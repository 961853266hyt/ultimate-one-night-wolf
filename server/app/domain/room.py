"""房间：成员、房主、配置和当前这一局。玩家的所有指令都从 Room.handle 进来。"""

import random
from collections import Counter
from typing import Self

from pydantic import BaseModel, Field

from .commands import (
    Command,
    Configure,
    ConfirmCard,
    Kick,
    Leave,
    NightAction,
    ReadyToVote,
    Rematch,
    Start,
    Vote,
)
from .errors import ErrorCode, RuleError
from .game import Game
from .recommended import recommended_deck
from .roles import ROLES
from .types import CENTER, MAX_PLAYERS, MIN_PLAYERS, Phase, PlayerId, RoleId, Settings

HOST_GRACE = 30  # 房主离线这么久之后，转给下一个在线的人（秒）
LOBBY_GRACE = 120  # 大厅里离线这么久之后，移出房间
EMPTY_TTL = 600  # 所有人都离线这么久之后，房间可以销毁


class Member(BaseModel):
    id: PlayerId
    name: str
    online: bool = False
    offline_since: float | None = None


class Room(BaseModel):
    code: str
    host: PlayerId
    members: list[Member]  # 加入顺序，开局后就是座位顺序
    settings: Settings = Field(default_factory=Settings)
    game: Game | None = None
    touched_at: float  # 最近一次有人上线或下线的时间

    @classmethod
    def create(cls, code: str, host: PlayerId, name: str, now: float) -> Self:
        """开房的人直接成为成员和房主，等他连上来才算在线。"""
        creator = Member(id=host, name=name, offline_since=now)
        return cls(code=code, host=host, members=[creator], touched_at=now)

    # ------------------------------------------------------------ 查询

    @property
    def phase(self) -> Phase:
        return Phase.LOBBY if self.game is None else self.game.phase

    def member(self, player: PlayerId) -> Member | None:
        return next((m for m in self.members if m.id == player), None)

    def deck(self) -> list[RoleId]:
        """这一局（或者下一局）用的牌堆。牌堆是公开信息。"""
        if self.game is not None:
            return sorted(self.game.dealt.values(), key=list(RoleId).index)
        if self.settings.deck is not None:
            return list(self.settings.deck)
        return recommended_deck(len(self.members))

    def next_deadline(self) -> float | None:
        """运行时应该在这个时间调用 tick。"""
        deadlines: list[float] = []
        if self.game is not None and self.game.ends_at is not None:
            deadlines.append(self.game.ends_at)
        if self.phase is Phase.LOBBY:
            deadlines += [
                since + LOBBY_GRACE for m in self.members if (since := m.offline_since) is not None
            ]
        host = self.member(self.host)
        if host is not None and host.offline_since is not None and self._someone_online():
            deadlines.append(host.offline_since + HOST_GRACE)
        return min(deadlines, default=None)

    def expires_at(self) -> float | None:
        """所有人都离线时，房间在这个时间之后可以销毁。"""
        return None if self._someone_online() else self.touched_at + EMPTY_TTL

    # ------------------------------------------------------------ 上线和下线

    def connect(self, player: PlayerId, name: str, now: float) -> None:
        """进房或重连。大厅和揭晓阶段都可以加入新成员。"""
        member = self.member(player)
        if member is None:
            if self.phase not in (Phase.LOBBY, Phase.REVEAL):
                raise RuleError(ErrorCode.GAME_IN_PROGRESS)
            if len(self.members) >= MAX_PLAYERS:
                raise RuleError(ErrorCode.ROOM_FULL)
            member = Member(id=player, name=name)
            self.members.append(member)
            if self.member(self.host) is None:
                self.host = player  # 房主已经不在房间里了（比如开房的人一直没连上来），新来的人接任
        member.name = name
        member.online = True
        member.offline_since = None
        self.touched_at = now

    def disconnect(self, player: PlayerId, now: float) -> None:
        member = self.member(player)
        if member is None or not member.online:
            return
        member.online = False
        member.offline_since = now
        self.touched_at = now

    # ------------------------------------------------------------ 指令

    def handle(self, player: PlayerId, command: Command, now: float, rng: random.Random) -> None:
        if self.member(player) is None:
            raise RuleError(ErrorCode.NOT_MEMBER)
        match command:
            case Configure(settings=settings):
                self._expect_host_in_lobby(player)
                _check_deck(settings.deck)
                self.settings = settings
            case Kick(player=target):
                self._expect_host_in_lobby(player)
                if target == player:
                    raise RuleError(ErrorCode.CANNOT_KICK_SELF)
                if self.member(target) is None:
                    raise RuleError(ErrorCode.UNKNOWN_PLAYER)
                self._remove(target)
            case Start():
                self._expect_host_in_lobby(player)
                self._start(now, rng)
            case Leave():
                self._leave(player, now)
            case Rematch():
                self._expect_host(player)
                if self.phase is not Phase.REVEAL:
                    raise RuleError(ErrorCode.WRONG_PHASE)
                self._rematch()
            case ConfirmCard():
                self._current_game().confirm_card(player, now)
            case NightAction(targets=targets):
                self._current_game().night_action(player, targets)
            case ReadyToVote():
                self._current_game().ready_to_vote(player, now)
            case Vote(target=target):
                self._current_game().vote(player, target, now)

    # ------------------------------------------------------------ 时钟

    def tick(self, now: float, rng: random.Random) -> None:
        if self.game is not None:
            self.game.tick(now, rng)
        if self.phase is Phase.LOBBY:
            for m in list(self.members):
                if m.offline_since is not None and now >= m.offline_since + LOBBY_GRACE:
                    self._remove(m.id)
        self._hand_over_if_host_away(now)

    # ------------------------------------------------------------ 内部

    def _expect_host(self, player: PlayerId) -> None:
        if player != self.host:
            raise RuleError(ErrorCode.NOT_HOST)

    def _expect_host_in_lobby(self, player: PlayerId) -> None:
        self._expect_host(player)
        if self.phase is not Phase.LOBBY:
            raise RuleError(ErrorCode.WRONG_PHASE)

    def _current_game(self) -> Game:
        if self.game is None:
            raise RuleError(ErrorCode.WRONG_PHASE)
        return self.game

    def _start(self, now: float, rng: random.Random) -> None:
        if not MIN_PLAYERS <= len(self.members) <= MAX_PLAYERS:
            raise RuleError(ErrorCode.PLAYER_COUNT)
        if not all(m.online for m in self.members):
            raise RuleError(ErrorCode.PLAYERS_OFFLINE)
        players = [m.id for m in self.members]
        self.game = Game.deal(players, self.deck(), self.settings.timings, now, rng)

    def _leave(self, player: PlayerId, now: float) -> None:
        """正在对局的人只算离线，座位保留到这局结束；其他情况直接移出。"""
        if self.game is not None and player in self.game.players:
            self.disconnect(player, now)
        else:
            self._remove(player)

    def _rematch(self) -> None:
        self.game = None
        for m in [m for m in self.members if not m.online]:
            self._remove(m.id)

    def _remove(self, player: PlayerId) -> None:
        self.members = [m for m in self.members if m.id != player]
        if player == self.host and self.members:
            online = [m for m in self.members if m.online]
            self.host = (online or self.members)[0].id

    def _hand_over_if_host_away(self, now: float) -> None:
        host = self.member(self.host)
        if host is None or host.offline_since is None or now < host.offline_since + HOST_GRACE:
            return
        online = [m for m in self.members if m.online]
        if online:
            self.host = online[0].id

    def _someone_online(self) -> bool:
        return any(m.online for m in self.members)


def _check_deck(deck: list[RoleId] | None) -> None:
    if deck is None:
        return
    if not MIN_PLAYERS + len(CENTER) <= len(deck) <= MAX_PLAYERS + len(CENTER):
        raise RuleError(ErrorCode.DECK_SIZE)
    if any(count > ROLES[role].max_copies for role, count in Counter(deck).items()):
        raise RuleError(ErrorCode.TOO_MANY_COPIES)

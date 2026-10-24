"""房间：成员、房主、配置和当前这一局。玩家的所有指令都从 Room.handle 进来。"""

import random
from collections import Counter
from typing import Self

from pydantic import BaseModel, Field

from .commands import (
    Command,
    Configure,
    ConfirmCard,
    EndSpeech,
    EndStep,
    Kick,
    Leave,
    LeaveSeat,
    NightAction,
    ReadyToVote,
    Rematch,
    Start,
    TakeSeat,
    Vote,
)
from .errors import ErrorCode, RuleError
from .game import Game
from .recommended import recommended_deck
from .roles import ROLES
from .types import CENTER, MAX_MEMBERS, MAX_PLAYERS, MIN_PLAYERS, Phase, PlayerId, RoleId, Settings

HOST_GRACE = 30  # 房主离线这么久之后，转给下一个在线的人（秒）
LOBBY_GRACE = 120  # 大厅里离线这么久之后，移出房间
EMPTY_TTL = 600  # 所有人都离线这么久之后，房间可以销毁


class Member(BaseModel):
    id: PlayerId
    name: str
    # 座位号，从 0 开始；None 是坐在观战席，不参加下一局。大厅里可以换到空座位，开局后按座位号排
    seat: int | None
    bot: bool = False  # 机器人：一直在线，不当房主，由房主替它操作
    online: bool = False
    offline_since: float | None = None


class Room(BaseModel):
    code: str
    host: PlayerId
    members: list[Member]  # 加入顺序；座位看 Member.seat，中间可以有空座位
    settings: Settings = Field(default_factory=Settings)
    game: Game | None = None
    touched_at: float  # 最近一次有人上线或下线的时间
    bots_added: int = 0  # 一共加过几个机器人，给新机器人编号；调试模式开着时，移出过的号不再用

    @classmethod
    def create(
        cls, code: str, host: PlayerId, name: str, now: float, settings: Settings | None = None
    ) -> Self:
        """开房的人直接成为成员和房主，等他连上来才算在线。从首页的板子开房时带着板子的设置。"""
        creator = Member(id=host, name=name, seat=0, offline_since=now)
        return cls(
            code=code,
            host=host,
            members=[creator],
            settings=settings or Settings(),
            touched_at=now,
        )

    # ------------------------------------------------------------ 查询

    @property
    def phase(self) -> Phase:
        return Phase.LOBBY if self.game is None else self.game.phase

    def member(self, player: PlayerId) -> Member | None:
        return next((m for m in self.members if m.id == player), None)

    def seated(self) -> list[Member]:
        """坐在座位上的人，不含观战席。"""
        return [m for m in self.members if m.seat is not None]

    def can_act_as(self, player: PlayerId, target: PlayerId) -> bool:
        """player 能不能替 target 操作：只有房主能替机器人操作。"""
        member = self.member(target)
        return player == self.host and member is not None and member.bot

    def deck(self) -> list[RoleId]:
        """这一局（或者下一局）用的牌堆。牌堆是公开信息。"""
        if self.game is not None:
            return sorted(self.game.dealt.values(), key=list(RoleId).index)
        if self.settings.deck is not None:
            return list(self.settings.deck)
        return recommended_deck(self.settings.seats)

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

    def is_open(self) -> bool:
        """能在「房间」列表里看到、点进来就能坐下：公开房间，在大厅里或者一局刚结束，还有空座位，有真人在线。"""
        in_between = self.phase in (Phase.LOBBY, Phase.REVEAL)
        return (
            self.settings.public
            and in_between
            and self._free_seat() is not None
            and self._someone_online()
        )

    def expires_at(self) -> float | None:
        """所有人都离线时，房间在这个时间之后可以销毁。"""
        return None if self._someone_online() else self.touched_at + EMPTY_TTL

    # ------------------------------------------------------------ 上线和下线

    def connect(self, player: PlayerId, name: str, now: float) -> None:
        """进房或重连。新来的人有空座位就坐下；座位坐满了、或者这一局正在打，先坐观战席。"""
        member = self.member(player)
        if member is None:
            if len(self.members) >= MAX_MEMBERS:
                raise RuleError(ErrorCode.ROOM_FULL)
            between = self.phase in (Phase.LOBBY, Phase.REVEAL)
            member = Member(id=player, name=name, seat=self._free_seat() if between else None)
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
                # 机器人可以让座，坐着的真人不行；观战席上的人不占座位
                if settings.seats < len([m for m in self.seated() if not m.bot]):
                    raise RuleError(ErrorCode.TOO_FEW_SEATS)
                self.settings = settings
                self._seat_bots()
            case Kick(player=target):
                self._expect_host_in_lobby(player)
                if target == player:
                    raise RuleError(ErrorCode.CANNOT_KICK_SELF)
                if self.member(target) is None:
                    raise RuleError(ErrorCode.UNKNOWN_PLAYER)
                self._remove(target)
            case TakeSeat(seat=seat):
                self._take_seat(player, seat)
            case LeaveSeat():
                self._leave_seat(player)
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
            case EndSpeech():
                self._current_game().end_speech(player, now, by_host=player == self.host)
            case Vote(target=target):
                self._current_game().vote(player, target, now)
            case EndStep():
                member = self.member(player)
                if player != self.host and not (member and member.bot):
                    raise RuleError(ErrorCode.NOT_HOST)
                self._current_game().end_step(now, rng)
        self._bots_get_ready(now)

    # ------------------------------------------------------------ 时钟

    def tick(self, now: float, rng: random.Random) -> None:
        if self.game is not None:
            self.game.tick(now, rng)
        if self.phase is Phase.LOBBY:
            for m in list(self.members):
                if m.offline_since is not None and now >= m.offline_since + LOBBY_GRACE:
                    self._remove(m.id)
        self._hand_over_if_host_away(now)
        self._bots_get_ready(now)

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
        # 坐满才能开局；座位数本身在 3 到 10 之间，由 Settings 保证。观战席上的人不玩，也不用等他们
        seated = sorted(self.seated(), key=lambda m: m.seat or 0)
        if len(seated) != self.settings.seats:
            raise RuleError(ErrorCode.PLAYER_COUNT)
        if not all(m.online for m in seated):
            raise RuleError(ErrorCode.PLAYERS_OFFLINE)
        players = [m.id for m in seated]
        settings = self.settings
        self.game = Game.deal(
            players,
            self.deck(),
            settings.timings,
            rng,
            self_vote=settings.self_vote,
            speech_rounds=settings.speech_rounds,
            manual_steps=settings.debug,
        )

    def _bots_get_ready(self, now: float) -> None:
        """机器人不用想：看牌时直接「记住了」，白天直接同意投票。夜里行动和投票由房主替它们做。"""
        game = self.game
        if game is None:
            return
        bots = [m.id for m in self.members if m.bot and m.id in game.players]
        for bot in bots:
            if game.phase is Phase.DEAL and bot not in game.confirmed:
                game.confirm_card(bot, now)
            elif game.phase is Phase.DAY and bot not in game.ready:
                game.ready_to_vote(bot, now)

    def _free_seat(self) -> int | None:
        """号最小的空座位；坐满了就是 None。"""
        taken = {m.seat for m in self.seated()}
        return next((s for s in range(self.settings.seats) if s not in taken), None)

    def _take_seat(self, player: PlayerId, seat: int) -> None:
        if self.phase is not Phase.LOBBY:
            raise RuleError(ErrorCode.WRONG_PHASE)
        if not 0 <= seat < self.settings.seats or any(m.seat == seat for m in self.members):
            raise RuleError(ErrorCode.SEAT_TAKEN)
        member = self.member(player)
        assert member is not None  # handle 已经查过是成员
        member.seat = seat

    def _leave_seat(self, player: PlayerId) -> None:
        if self.phase is not Phase.LOBBY:
            raise RuleError(ErrorCode.WRONG_PHASE)
        member = self.member(player)
        assert member is not None  # handle 已经查过是成员
        if not member.bot:  # 机器人只坐座位，不去观战
            member.seat = None

    def _seat_bots(self) -> None:
        """调试模式下空座位都坐上机器人，座位变少时机器人先让座；关掉调试模式，机器人全部移出。"""
        bots = sorted((m for m in self.members if m.bot), key=lambda m: m.seat or 0)
        people = len(self.seated()) - len(bots)
        room_for = self.settings.seats - people if self.settings.debug else 0
        for bot in bots[room_for:]:
            self._remove(bot.id)
        self._reseat_overflow()
        if self.settings.debug:
            self._add_bots()
        else:
            self.bots_added = 0  # 机器人都走了，下次打开重新从机器人1 编号

    def _add_bots(self) -> None:
        while (seat := self._free_seat()) is not None:
            self.bots_added += 1
            n = self.bots_added
            self.members.append(
                Member(id=f"bot-{n}", name=f"机器人{n}", seat=seat, bot=True, online=True)
            )

    def _reseat_overflow(self) -> None:
        """座位变少后，坐在多出来的座位上的人挪到前面的空座位。人数已经查过放得下。"""
        for m in sorted(self.seated(), key=lambda m: m.seat or 0):
            if m.seat is not None and m.seat >= self.settings.seats:
                seat = self._free_seat()
                assert seat is not None
                m.seat = seat

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
            people = [m for m in self.members if not m.bot]
            online = [m for m in people if m.online]
            self.host = (online or people or self.members)[0].id

    def _hand_over_if_host_away(self, now: float) -> None:
        host = self.member(self.host)
        if host is None or host.offline_since is None or now < host.offline_since + HOST_GRACE:
            return
        online = [m for m in self.members if m.online and not m.bot]
        if online:
            self.host = online[0].id

    def _someone_online(self) -> bool:
        """有没有真人在线。机器人一直在线，不算：只剩机器人的房间也要能过期回收。"""
        return any(m.online and not m.bot for m in self.members)


def _check_deck(deck: list[RoleId] | None) -> None:
    if deck is None:
        return
    if not MIN_PLAYERS + len(CENTER) <= len(deck) <= MAX_PLAYERS + len(CENTER):
        raise RuleError(ErrorCode.DECK_SIZE)
    if any(count > ROLES[role].max_copies for role, count in Counter(deck).items()):
        raise RuleError(ErrorCode.TOO_MANY_COPIES)

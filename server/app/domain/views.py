"""视图投影：一个玩家此刻能看到的全部内容。

所有字段都是显式列出的白名单。没写进来的东西，前端永远拿不到。
"""

from collections.abc import Collection

from pydantic import BaseModel

from .errors import ErrorCode, RuleError
from .game import Game, NightLogEntry
from .recommended import recommended_deck
from .room import Member, Room
from .types import (
    MAX_PLAYERS,
    MIN_PLAYERS,
    Knowledge,
    Phase,
    PlayerId,
    Prompt,
    RoleId,
    Slot,
    Team,
    Timings,
)


class MemberView(BaseModel):
    id: PlayerId
    name: str
    online: bool
    seat: int | None  # 座位号，从 0 开始。大厅里是选的座位；开局后是这一局的座位，没参加这一局就是 None


class RoomView(BaseModel):
    code: str
    host: PlayerId
    members: list[MemberView]
    deck: list[RoleId]
    auto_deck: bool
    seats: int  # 房间几个座位
    # 每种座位数推荐的牌堆。房主配牌时拿来对比和「恢复推荐」；改座位数时直接换成新人数的推荐
    recommended_decks: dict[int, list[RoleId]]
    timings: Timings


class MeView(BaseModel):
    id: PlayerId
    seat: int | None
    card: RoleId | None  # 发到的那张牌，不是现在手里的
    knowledge: list[Knowledge]


class DealView(BaseModel):
    confirmed: list[PlayerId]


class NightView(BaseModel):
    step: RoleId
    index: int  # 从 1 开始
    total: int


class DayView(BaseModel):
    ready: list[PlayerId]


class VoteView(BaseModel):
    voted: list[PlayerId]  # 只公开谁投了，不公开投给了谁
    mine: PlayerId | None


class ResultView(BaseModel):
    dealt: dict[Slot, RoleId]
    final: dict[Slot, RoleId]
    # 模仿者、化身幽灵的牌最后算作的角色（没变过的不在里面）；谁最后拿着这张牌，谁就算这个角色
    counts_as: dict[RoleId, RoleId]
    knowledge: dict[PlayerId, list[Knowledge]]
    night_log: list[NightLogEntry]
    votes: dict[PlayerId, PlayerId]
    deaths: list[PlayerId]
    winning_teams: list[Team]
    winners: list[PlayerId]


class PlayerView(BaseModel):
    phase: Phase
    ends_at: int | None  # 毫秒时间戳
    room: RoomView
    me: MeView
    prompt: Prompt | None = None
    deal: DealView | None = None
    night: NightView | None = None
    day: DayView | None = None
    vote: VoteView | None = None
    result: ResultView | None = None


def view_for(room: Room, player: PlayerId) -> PlayerView:
    if room.member(player) is None:
        raise RuleError(ErrorCode.NOT_MEMBER)

    game = room.game
    view = PlayerView(
        phase=room.phase,
        ends_at=None if game is None or game.ends_at is None else round(game.ends_at * 1000),
        room=_room_view(room),
        me=_me_view(game, player),
    )
    if game is None:
        return view

    match game.phase:
        case Phase.DEAL:
            view.deal = DealView(confirmed=_in_seat_order(game, game.confirmed))
        case Phase.NIGHT:
            view.night = NightView(
                step=game.night_plan[game.night_index],
                index=game.night_index + 1,
                total=len(game.night_plan),
            )
            view.prompt = game.prompt_for(player)
        case Phase.DAY:
            view.day = DayView(ready=_in_seat_order(game, game.ready))
        case Phase.VOTE:
            view.vote = VoteView(
                voted=_in_seat_order(game, game.votes), mine=game.votes.get(player)
            )
        case Phase.REVEAL:
            view.result = _result_view(game)
    return view


def _room_view(room: Room) -> RoomView:
    return RoomView(
        code=room.code,
        host=room.host,
        members=[
            MemberView(id=m.id, name=m.name, online=m.online, seat=_seat(room, m))
            for m in room.members
        ],
        deck=room.deck(),
        auto_deck=room.settings.deck is None,
        seats=room.settings.seats,
        recommended_decks={n: recommended_deck(n) for n in range(MIN_PLAYERS, MAX_PLAYERS + 1)},
        timings=room.settings.timings,
    )


def _me_view(game: Game | None, player: PlayerId) -> MeView:
    if game is None or player not in game.players:
        return MeView(id=player, seat=None, card=None, knowledge=[])
    return MeView(
        id=player,
        seat=game.players.index(player),
        card=game.dealt[player],
        knowledge=list(game.knowledge.get(player, [])),
    )


def _result_view(game: Game) -> ResultView:
    assert game.result is not None
    return ResultView(
        dealt=game.dealt,
        final=game.cards,
        counts_as=game.counts_as(),
        knowledge=game.knowledge,
        night_log=game.night_log,
        votes=game.votes,
        deaths=game.result.deaths,
        winning_teams=game.result.winning_teams,
        winners=game.result.winners,
    )


def _seat(room: Room, member: Member) -> int | None:
    game = room.game
    if game is None:
        return member.seat
    if member.id not in game.players:
        return None
    return game.players.index(member.id)


def _in_seat_order(game: Game, players: Collection[PlayerId]) -> list[PlayerId]:
    return [p for p in game.players if p in players]

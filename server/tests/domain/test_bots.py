"""调试模式：空座位坐上机器人，一个人就能把一局从头打到尾。机器人自己不行动，由房主替它们操作。"""

import pytest

from app.domain.commands import Configure, ConfirmCard, EndStep, Kick, Leave, Start
from app.domain.errors import ErrorCode, RuleError
from app.domain.room import EMPTY_TTL, HOST_GRACE, Room
from app.domain.types import Phase, Settings
from app.domain.types import RoleId as R
from app.domain.views import view_for
from tests.domain.helpers import NoShuffle, new_room

RNG = NoShuffle(0)


def rejects(code: ErrorCode, action) -> None:
    with pytest.raises(RuleError) as error:
        action()
    assert error.value.code is code


def bots(room: Room) -> list:
    return sorted((m for m in room.members if m.bot), key=lambda m: m.seat)


def debug(room: Room, on: bool = True, **settings) -> None:
    """房主在房间设置里打开（或关掉）调试模式，其他设置不变。"""
    seats = settings.pop("seats", room.settings.seats)
    room.handle("p0", Configure(settings=Settings(seats=seats, debug=on, **settings)), 0, RNG)


def test_debug_mode_fills_every_empty_seat_with_bots():
    room = new_room(1)
    debug(room, seats=5)

    assert [(m.seat, m.name) for m in bots(room)] == [
        (1, "机器人1"),
        (2, "机器人2"),
        (3, "机器人3"),
        (4, "机器人4"),
    ]
    assert all(m.online for m in bots(room))


def test_bots_give_up_seats_when_the_room_shrinks_but_people_do_not():
    room = new_room(4)
    debug(room, seats=6)
    debug(room, seats=5)
    assert [m.seat for m in bots(room)] == [4]

    rejects(ErrorCode.TOO_FEW_SEATS, lambda: debug(room, seats=3))


def test_turning_debug_mode_off_sends_the_bots_away():
    room = new_room(1)
    debug(room)
    debug(room, on=False)
    assert bots(room) == []

    debug(room)  # 再打开，又从机器人1 开始
    assert [m.name for m in bots(room)] == ["机器人1", "机器人2"]


def test_one_person_and_bots_can_start_a_game():
    room = new_room(1)
    debug(room)
    room.handle("p0", Start(), 0, RNG)
    assert room.game is not None and len(room.game.players) == 3


def test_a_kicked_bot_frees_its_seat_and_its_name_is_not_reused():
    room = new_room(1)
    debug(room)
    first = bots(room)[0]
    room.handle("p0", Kick(player=first.id), 0, RNG)
    assert room.member(first.id) is None
    debug(room)  # 再存一次设置，空座位重新坐上机器人

    newest = next(m for m in bots(room) if m.seat == first.seat)
    assert newest.id != first.id and newest.name == "机器人3"


def test_bots_never_become_host():
    room = new_room(2)
    debug(room, seats=4)
    room.handle("p0", Leave(), 0, RNG)
    assert room.host == "p1"

    room.disconnect("p1", now=10)
    room.tick(10 + HOST_GRACE, RNG)  # 房主离线够久，但在线的只有机器人
    assert room.host == "p1"


def test_a_room_left_to_its_bots_still_expires():
    room = new_room(1)
    debug(room)
    room.disconnect("p0", now=10)
    assert room.expires_at() == 10 + EMPTY_TTL


def test_only_the_host_may_act_as_a_bot():
    room = new_room(2)
    debug(room)
    [bot] = bots(room)
    assert room.can_act_as("p0", bot.id)
    assert not room.can_act_as("p1", bot.id)  # 不是房主
    assert not room.can_act_as("p0", "p1")  # 不是机器人
    assert not room.can_act_as("p0", "nobody")


# ---------------------------------------------------------------- 调试模式下的一局


def solo_game(humans: int = 1) -> Room:
    """真人 p0（房主）……，打开调试模式补满机器人，开局。"""
    room = new_room(humans)
    debug(room)
    room.handle("p0", Start(), 0, RNG)
    return room


def test_bots_confirm_their_cards_on_their_own():
    room = solo_game()
    game = room.game
    assert game is not None and game.confirmed == {"bot-1", "bot-2"}
    room.handle("p0", ConfirmCard(), 0, RNG)
    assert game.phase is Phase.NIGHT


def test_the_night_waits_for_the_host_in_debug_mode():
    room = solo_game()
    room.handle("p0", ConfirmCard(), 0, RNG)
    game = room.game
    assert game is not None and game.ends_at is None  # 不限时
    step = game.night_index
    room.tick(10**9, RNG)
    assert game.night_index == step  # 时间再久也不会自己往下走

    room.handle("p0", EndStep(), 0, RNG)
    assert game.night_index == step + 1 or game.phase is Phase.DAY


def test_a_bot_can_end_the_step_but_another_person_cannot():
    room = solo_game(humans=2)
    room.handle("p0", ConfirmCard(), 0, RNG)
    room.handle("p1", ConfirmCard(), 0, RNG)
    rejects(ErrorCode.NOT_HOST, lambda: room.handle("p1", EndStep(), 0, RNG))
    room.handle("bot-1", EndStep(), 0, RNG)  # 房主替机器人操作时发的


def test_ending_a_step_picks_what_was_required():
    room = new_room(1)
    debug(room, deck=[R.DRUNK, R.SEER, R.VILLAGER, R.ROBBER, R.TROUBLEMAKER, R.WEREWOLF])
    room.handle("p0", Start(), 0, RNG)  # 不洗牌：p0 是酒鬼
    room.handle("p0", ConfirmCard(), 0, RNG)
    game = room.game
    assert game is not None
    while game.night_role is not R.DRUNK:
        room.handle("p0", EndStep(), 0, RNG)
    room.handle("p0", EndStep(), 0, RNG)
    assert any(e.step is R.DRUNK and e.auto for e in game.night_log)


def test_the_night_still_has_a_clock_without_debug_mode():
    room = new_room(3)
    room.handle("p0", Start(), 0, RNG)
    for p in ("p0", "p1", "p2"):
        room.handle(p, ConfirmCard(), 0, RNG)
    assert room.game is not None and room.game.ends_at is not None
    rejects(ErrorCode.WRONG_PHASE, lambda: room.handle("p0", EndStep(), 0, RNG))


def test_the_host_sees_the_bots_cards_but_not_other_peoples():
    room = solo_game(humans=2)
    game = room.game
    assert game is not None
    # 房主看得到机器人的，看不到另一个真人 p1 的；自己的在 card 里，不重复
    host = view_for(room, "p0").me.known_dealt
    assert host == {"bot-1": game.dealt["bot-1"]}
    bot = view_for(room, "bot-1").me.known_dealt
    assert bot == {"p0": game.dealt["p0"]}
    assert view_for(room, "p1").me.known_dealt == {}

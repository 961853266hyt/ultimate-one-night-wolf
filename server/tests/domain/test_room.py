import pytest

from app.domain.commands import (
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
from app.domain.errors import ErrorCode, RuleError
from app.domain.recommended import recommended_deck
from app.domain.room import HOST_GRACE, LOBBY_GRACE, Room
from app.domain.types import MAX_PLAYERS, Phase, Settings
from app.domain.types import RoleId as R
from tests.domain.helpers import NoShuffle, new_room

RNG = NoShuffle(0)


def rejects(code: ErrorCode, action) -> None:
    with pytest.raises(RuleError) as error:
        action()
    assert error.value.code is code


def finish_game(room: Room) -> None:
    """用最快的方式把房间里的这一局打到揭晓。"""
    game = room.game
    assert game is not None
    while game.phase is not Phase.DAY:
        assert game.ends_at is not None
        room.tick(game.ends_at, RNG)
    for player in game.players:
        room.handle(player, ReadyToVote(), 0, RNG)
    for i, voter in enumerate(game.players):
        room.handle(voter, Vote(target=game.players[i - 1]), 0, RNG)


def test_the_creator_is_host_and_offline_until_connecting():
    room = Room.create("ABCD", "p0", "阿胡", now=0)
    assert room.host == "p0"
    assert not room.members[0].online
    room.connect("p0", "阿胡", now=1)
    assert room.members[0].online


def test_players_join_in_the_lobby_until_the_room_is_full():
    room = new_room(MAX_PLAYERS)
    rejects(ErrorCode.ROOM_FULL, lambda: room.connect("late", "late", 0))


def test_nobody_new_can_join_during_a_game_but_they_can_after_it_ends():
    room = new_room(3)
    room.handle("p0", Start(), 0, RNG)
    rejects(ErrorCode.GAME_IN_PROGRESS, lambda: room.connect("late", "late", 0))

    finish_game(room)
    room.connect("late", "late", 0)
    assert room.member("late") is not None


def test_a_player_who_reconnects_keeps_their_seat():
    room = new_room(3)
    room.handle("p0", Start(), 0, RNG)
    room.disconnect("p1", now=5)
    room.connect("p1", "p1", now=6)
    assert room.game is not None and room.game.players[1] == "p1"
    assert room.members[1].online


def test_only_the_host_manages_the_lobby():
    room = new_room(3)
    rejects(ErrorCode.NOT_HOST, lambda: room.handle("p1", Start(), 0, RNG))
    rejects(ErrorCode.NOT_HOST, lambda: room.handle("p1", Kick(player="p2"), 0, RNG))
    rejects(ErrorCode.NOT_HOST, lambda: room.handle("p1", Configure(settings=Settings()), 0, RNG))


def test_strangers_cannot_send_commands():
    room = new_room(3)
    rejects(ErrorCode.NOT_MEMBER, lambda: room.handle("stranger", Start(), 0, RNG))


def test_the_deck_follows_the_player_count_until_the_host_picks_one():
    room = new_room(4)
    assert room.deck() == recommended_deck(4)

    custom = [R.WEREWOLF, R.MASON, R.MASON, R.SEER, R.ROBBER, R.VILLAGER, R.WEREWOLF]
    room.handle("p0", Configure(settings=Settings(deck=custom)), 0, RNG)
    assert room.deck() == custom


def test_a_custom_deck_respects_card_limits():
    room = new_room(3)
    three_seers = [R.SEER] * 3 + [R.VILLAGER] * 3
    rejects(
        ErrorCode.TOO_MANY_COPIES,
        lambda: room.handle("p0", Configure(settings=Settings(deck=three_seers)), 0, RNG),
    )
    rejects(
        ErrorCode.DECK_SIZE,
        lambda: room.handle("p0", Configure(settings=Settings(deck=[R.SEER])), 0, RNG),
    )


def test_starting_needs_three_to_ten_players_all_online():
    room = new_room(2)
    rejects(ErrorCode.PLAYER_COUNT, lambda: room.handle("p0", Start(), 0, RNG))

    room.connect("p2", "p2", 0)
    room.disconnect("p1", 0)
    rejects(ErrorCode.PLAYERS_OFFLINE, lambda: room.handle("p0", Start(), 0, RNG))


def test_a_custom_deck_must_match_the_player_count_at_start():
    room = new_room(3)
    deck = recommended_deck(4)
    room.handle("p0", Configure(settings=Settings(deck=deck)), 0, RNG)
    rejects(ErrorCode.DECK_SIZE, lambda: room.handle("p0", Start(), 0, RNG))


def test_game_commands_are_routed_to_the_game():
    room = new_room(3)
    rejects(ErrorCode.WRONG_PHASE, lambda: room.handle("p0", ConfirmCard(), 0, RNG))
    room.handle("p0", Start(), 0, RNG)
    room.handle("p0", ConfirmCard(), 1, RNG)
    assert room.game is not None and room.game.confirmed == {"p0"}
    rejects(ErrorCode.WRONG_PHASE, lambda: room.handle("p0", NightAction(targets=[]), 1, RNG))


def test_leaving_the_lobby_removes_you_and_hands_over_host():
    room = new_room(3)
    room.handle("p0", Leave(), 0, RNG)
    assert [m.id for m in room.members] == ["p1", "p2"]
    assert room.host == "p1"


def test_leaving_mid_game_keeps_your_seat():
    room = new_room(3)
    room.handle("p0", Start(), 0, RNG)
    room.handle("p2", Leave(), 0, RNG)
    assert room.member("p2") is not None
    assert room.member("p2").online is False


def test_the_host_can_kick_but_not_themselves():
    room = new_room(3)
    room.handle("p0", Kick(player="p2"), 0, RNG)
    assert room.member("p2") is None
    rejects(ErrorCode.CANNOT_KICK_SELF, lambda: room.handle("p0", Kick(player="p0"), 0, RNG))
    rejects(ErrorCode.UNKNOWN_PLAYER, lambda: room.handle("p0", Kick(player="p9"), 0, RNG))


def test_offline_members_leave_the_lobby_after_a_grace_period():
    room = new_room(3)
    room.disconnect("p2", now=10)
    assert room.next_deadline() == 10 + LOBBY_GRACE

    room.tick(10 + LOBBY_GRACE - 1, RNG)
    assert room.member("p2") is not None
    room.tick(10 + LOBBY_GRACE, RNG)
    assert room.member("p2") is None


def test_the_host_role_moves_on_when_the_host_stays_away():
    room = new_room(3)
    room.handle("p0", Start(), 0, RNG)
    room.disconnect("p0", now=10)
    room.tick(10 + HOST_GRACE - 1, RNG)
    assert room.host == "p0"
    room.tick(10 + HOST_GRACE, RNG)
    assert room.host == "p1"


def test_the_host_stays_when_nobody_else_is_online():
    room = new_room(1)
    room.disconnect("p0", now=10)
    assert room.next_deadline() == 10 + LOBBY_GRACE  # 不会为了转交房主空转
    room.tick(10 + HOST_GRACE, RNG)
    assert room.host == "p0"


def test_a_newcomer_takes_over_a_room_whose_host_is_gone():
    room = Room.create("ABCD", "p0", "p0", now=0)
    room.tick(LOBBY_GRACE, RNG)  # 开房的人一直没连上来，被移出了
    assert room.members == []
    room.connect("p1", "p1", now=LOBBY_GRACE + 1)
    assert room.host == "p1"


def test_rematch_returns_to_the_lobby_without_the_offline_players():
    room = new_room(4)
    room.handle("p0", Start(), 0, RNG)
    finish_game(room)
    room.disconnect("p3", now=1)
    room.handle("p0", Rematch(), 1, RNG)
    assert room.phase is Phase.LOBBY
    assert [m.id for m in room.members] == ["p0", "p1", "p2"]


def test_only_a_finished_game_can_be_rematched():
    room = new_room(3)
    room.handle("p0", Start(), 0, RNG)
    rejects(ErrorCode.WRONG_PHASE, lambda: room.handle("p0", Rematch(), 0, RNG))


def test_an_empty_room_expires():
    room = new_room(2)
    assert room.expires_at() is None
    room.disconnect("p0", now=5)
    room.disconnect("p1", now=8)
    assert room.expires_at() == 8 + 600


def test_a_room_survives_a_json_round_trip():
    room = new_room(3)
    room.handle("p0", Start(), 0, RNG)
    assert Room.model_validate_json(room.model_dump_json()) == room

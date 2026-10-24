"""白天：开局随机定谁第一个发言、往哪边轮，天亮后公开；房主点「开始投票」进入投票。"""

import random

import pytest

from app.domain.commands import Configure, ConfirmCard, LeaveSeat, Start, StartVote
from app.domain.errors import ErrorCode, RuleError
from app.domain.game import Game
from app.domain.room import Room
from app.domain.types import Phase, Settings, Timings
from app.domain.types import RoleId as R
from app.domain.views import view_for
from tests.domain.helpers import NoShuffle, new_room, until_phase

RNG = NoShuffle(0)
DECK = [R.WEREWOLF, R.SEER, R.VILLAGER, R.ROBBER, R.TROUBLEMAKER, R.WEREWOLF]


def rejects(code: ErrorCode, action) -> None:
    with pytest.raises(RuleError) as error:
        action()
    assert error.value.code is code


def day_room(room: Room) -> Room:
    """配好牌、开局，打到白天。"""
    room.handle(room.host, Configure(settings=Settings(deck=DECK)), 0, RNG)
    room.handle(room.host, Start(), 0, RNG)
    game = room.game
    assert game is not None
    for player in game.players:
        room.handle(player, ConfirmCard(), 0, RNG)
    while game.phase is Phase.NIGHT:
        assert game.ends_at is not None
        room.tick(game.ends_at, RNG)
    return room


def test_the_first_speaker_and_the_direction_are_picked_at_random_when_dealing():
    seen = set()
    for seed in range(40):
        game = Game.deal(["p0", "p1", "p2"], DECK, Timings(), random.Random(seed))
        seen.add((game.first_speaker, game.clockwise))
    assert {speaker for speaker, _ in seen} == {0, 1, 2}
    assert {clockwise for _, clockwise in seen} == {True, False}


def test_everyone_sees_who_speaks_first_and_which_way_once_the_day_starts():
    room = day_room(new_room(3))
    game = room.game
    assert game is not None and game.phase is Phase.DAY
    for player in game.players:
        day = view_for(room, player).day
        assert day is not None
        assert day.first_speaker == game.players[game.first_speaker]
        assert day.clockwise == game.clockwise


def test_only_the_host_starts_the_vote():
    room = day_room(new_room(3))
    rejects(ErrorCode.NOT_HOST, lambda: room.handle("p1", StartVote(), 0, RNG))
    room.handle("p0", StartVote(), 0, RNG)
    assert room.phase is Phase.VOTE


def test_the_vote_can_only_start_during_the_day():
    room = new_room(3)
    rejects(ErrorCode.WRONG_PHASE, lambda: room.handle("p0", StartVote(), 0, RNG))
    game = Game.deal(["p0", "p1", "p2"], DECK, Timings(), RNG)
    until_phase(game, Phase.VOTE)
    with pytest.raises(RuleError) as error:
        game.start_vote(0)
    assert error.value.code is ErrorCode.WRONG_PHASE


def test_a_host_watching_from_the_spectator_seats_still_starts_the_vote():
    room = new_room(3)
    room.handle("p0", LeaveSeat(), 0, RNG)
    room.connect("p3", "p3", 0)  # 空出来的 1 号座位给新来的人
    assert room.member("p3").seat == 0
    day_room(room)
    assert room.game is not None and "p0" not in room.game.players
    room.handle("p0", StartVote(), 0, RNG)
    assert room.phase is Phase.VOTE

"""白天轮流发言：随机一个人先说，按座位顺序往后轮，说完点「结束发言」交给下一个，说满几轮就投票。"""

import pytest

from app.domain.commands import Configure, ConfirmCard, EndSpeech, ReadyToVote, Start
from app.domain.errors import ErrorCode, RuleError
from app.domain.game import Game
from app.domain.room import Room
from app.domain.types import Phase, Settings, Timings
from app.domain.types import RoleId as R
from app.domain.views import view_for
from tests.domain.helpers import NoShuffle, new_room, until_phase

# 不洗牌时 p0 是狼，夜里过后有狼，一定会进白天
DECK = [R.WEREWOLF, R.VILLAGER, R.VILLAGER, R.VILLAGER, R.WEREWOLF, R.TANNER]


def rejects(code: ErrorCode, action) -> None:
    with pytest.raises(RuleError) as error:
        action()
    assert error.value.code is code


def day(rounds: int, start: int = 1) -> Game:
    game = Game.deal(["p0", "p1", "p2"], DECK, Timings(), NoShuffle(0), speech_rounds=rounds)
    game.speech_start = start  # 固定从谁开始，方便断言；正常是开局时随机的
    until_phase(game, Phase.DAY)
    return game


def test_speakers_go_round_the_table_from_a_random_start():
    game = day(rounds=2, start=1)
    order = []
    while game.phase is Phase.DAY:
        speaker = game.speaker
        assert speaker is not None
        order.append((game.speech_round, speaker))
        game.end_speech(speaker, now=0)
    assert order == [(1, "p1"), (1, "p2"), (1, "p0"), (2, "p1"), (2, "p2"), (2, "p0")]
    assert game.phase is Phase.VOTE  # 说满两轮就投票


def test_the_first_speaker_is_picked_at_random_when_dealing():
    players = ["p0", "p1", "p2"]
    games = [Game.deal(players, DECK, Timings(), NoShuffle(s), speech_rounds=3) for s in range(30)]
    starts = {game.speech_start for game in games}
    assert starts == {0, 1, 2}


def test_only_the_speaker_or_the_host_can_end_a_speech():
    game = day(rounds=1, start=0)
    rejects(ErrorCode.NOT_YOUR_TURN, lambda: game.end_speech("p1", now=0))
    game.end_speech("p2", now=0, by_host=True)  # 房主替 p0 结束
    assert game.speaker == "p1"


def test_everyone_can_still_agree_to_vote_early():
    game = day(rounds=3)
    for player in game.players:
        game.ready_to_vote(player, now=0)
    assert game.phase is Phase.VOTE and game.speaker is None


def test_no_speaking_order_when_rounds_are_off():
    game = day(rounds=0)
    assert game.speaker is None
    rejects(ErrorCode.WRONG_PHASE, lambda: game.end_speech("p0", now=0))


def start_room(rounds: int) -> Room:
    room = new_room(3)
    settings = Settings(deck=DECK, speech_rounds=rounds)
    room.handle("p0", Configure(settings=settings), 0, NoShuffle(0))
    room.handle("p0", Start(), 0, NoShuffle(0))
    for p in ("p0", "p1", "p2"):
        room.handle(p, ConfirmCard(), 0, NoShuffle(0))
    assert room.game is not None
    while room.game.phase is Phase.NIGHT:
        assert room.game.ends_at is not None
        room.tick(room.game.ends_at, NoShuffle(0))
    return room


def test_the_room_passes_the_rounds_and_shows_the_speaker():
    room = start_room(rounds=1)
    game = room.game
    assert game is not None and game.phase is Phase.DAY and game.speech_rounds == 1
    speaker = game.speaker
    assert speaker is not None
    day_view = view_for(room, "p1").day
    assert day_view is not None
    assert (day_view.speaker, day_view.speech_round, day_view.speech_rounds) == (speaker, 1, 1)
    assert view_for(room, "p1").room.speech_rounds == 1

    other = next(p for p in game.players if p not in (speaker, "p0"))
    if speaker != "p0":
        # 不是房主也不是正在发言的人，结束不了
        rejects(ErrorCode.NOT_YOUR_TURN, lambda: room.handle(other, EndSpeech(), 0, NoShuffle(0)))
    room.handle("p0", EndSpeech(), 0, NoShuffle(0))  # 房主可以替任何人结束
    assert game.speaker != speaker


def test_ready_to_vote_still_works_in_a_room_with_a_speaking_order():
    room = start_room(rounds=3)
    for p in ("p0", "p1", "p2"):
        room.handle(p, ReadyToVote(), 0, NoShuffle(0))
    assert room.game is not None and room.game.phase is Phase.VOTE

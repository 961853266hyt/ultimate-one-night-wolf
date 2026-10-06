import pytest

from app.domain.errors import ErrorCode, RuleError
from app.domain.game import Game
from app.domain.rules import Result
from app.domain.types import Phase, Team, Timings
from app.domain.types import RoleId as R
from tests.domain.helpers import NoShuffle, new_game, night_until, skip, until_phase

T = Timings()


def a_game() -> Game:
    """p0 狼，p1 预言家，p2 村民；底牌：强盗、捣蛋鬼、狼。"""
    return new_game(R.WEREWOLF, R.SEER, R.VILLAGER, R.ROBBER, R.TROUBLEMAKER, R.WEREWOLF)


def test_a_full_game_the_village_wins():
    game = a_game()
    night_until(game, R.SEER)
    game.night_action("p1", ["p0"])
    until_phase(game, Phase.VOTE)

    game.vote("p0", "p1", now=1000)
    game.vote("p1", "p0", now=1000)
    game.vote("p2", "p0", now=1000)

    assert game.phase is Phase.REVEAL
    assert game.result is not None
    assert game.result.deaths == ["p0"]
    assert game.result.winning_teams == [Team.VILLAGE]
    assert game.result.winners == ["p1", "p2"]


def test_a_full_game_the_wolves_win():
    game = a_game()
    until_phase(game, Phase.VOTE)
    for voter, target in [("p0", "p2"), ("p1", "p2"), ("p2", "p1")]:
        game.vote(voter, target, now=1000)
    assert game.result is not None
    assert game.result.winners == ["p0"]


def test_if_every_player_ends_the_night_on_the_village_side_the_village_wins_without_a_vote():
    # 狼都在底牌里，玩家手里全是好人：天一亮就揭晓，不讨论也不投票
    game = new_game(R.SEER, R.ROBBER, R.VILLAGER, R.WEREWOLF, R.WEREWOLF, R.TROUBLEMAKER)
    phases = []
    while game.phase is not Phase.REVEAL:
        phases.append(game.phase)
        skip(game)

    assert Phase.DAY not in phases
    assert game.ends_at is None
    assert game.votes == {}
    assert game.result == Result(
        deaths=[], winning_teams=[Team.VILLAGE], winners=["p0", "p1", "p2"]
    )


@pytest.mark.parametrize("role", [R.MINION, R.TANNER])
def test_a_minion_or_tanner_among_the_players_still_means_a_vote(role):
    game = new_game(role, R.SEER, R.VILLAGER, R.WEREWOLF, R.WEREWOLF, R.ROBBER)
    until_phase(game, Phase.DAY)
    assert game.result is None


def test_the_check_uses_the_cards_after_the_night():
    # 酒鬼从底牌换来一张狼：玩家里有狼了，照常进入白天
    game = new_game(R.DRUNK, R.SEER, R.VILLAGER, R.WEREWOLF, R.WEREWOLF, R.TROUBLEMAKER)
    night_until(game, R.DRUNK)
    game.night_action("p0", ["C0"])
    until_phase(game, Phase.DAY)
    assert game.cards["p0"] is R.WEREWOLF


def test_dealing_ends_once_everyone_has_seen_their_card():
    game = a_game()
    for player in game.players:
        game.confirm_card(player, now=4)
    assert game.phase is Phase.NIGHT
    assert game.ends_at == 4 + T.night_step


def test_the_day_ends_once_everyone_is_ready_to_vote():
    game = a_game()
    until_phase(game, Phase.DAY)
    for player in game.players:
        game.ready_to_vote(player, now=500)
    assert game.phase is Phase.VOTE
    assert game.ends_at is None


def test_the_day_has_no_time_limit():
    game = a_game()
    until_phase(game, Phase.DAY)
    assert game.ends_at is None
    game.tick(10**9, NoShuffle(0))
    assert game.phase is Phase.DAY


def test_voting_has_no_time_limit():
    game = a_game()
    until_phase(game, Phase.VOTE)
    game.vote("p1", "p0", now=1000)
    assert game.ends_at is None
    game.tick(10**9, NoShuffle(0))
    assert game.phase is Phase.VOTE


@pytest.mark.parametrize("target", ["p0", "p9"])
def test_you_must_vote_for_another_player(target):
    game = a_game()
    until_phase(game, Phase.VOTE)
    with pytest.raises(RuleError) as error:
        game.vote("p0", target, now=1000)
    assert error.value.code is ErrorCode.BAD_TARGETS


def test_a_vote_cannot_be_changed():
    game = a_game()
    until_phase(game, Phase.VOTE)
    game.vote("p0", "p1", now=1000)
    with pytest.raises(RuleError) as error:
        game.vote("p0", "p2", now=1000)
    assert error.value.code is ErrorCode.ALREADY_VOTED


def test_only_players_of_this_game_can_act():
    game = a_game()
    with pytest.raises(RuleError) as error:
        game.confirm_card("stranger", now=1)
    assert error.value.code is ErrorCode.NOT_PLAYING


def test_the_deal_has_no_time_limit():
    game = a_game()
    assert game.ends_at is None
    game.tick(10**9, NoShuffle(0))
    assert game.phase is Phase.DEAL


def test_ticks_before_the_deadline_change_nothing():
    game = a_game()
    skip(game)  # 入夜，第一步从 now=0 开始
    game.tick(T.night_step - 0.001, NoShuffle(0))
    assert game.night_index == 0


def test_each_step_gets_its_full_time_from_when_it_starts():
    game = a_game()
    skip(game)  # 入夜，第一步从 now=0 开始
    game.tick(T.night_step + 7, NoShuffle(0))  # 晚了 7 秒才 tick
    assert game.night_index == 1
    assert game.ends_at == T.night_step + 7 + T.night_step


def test_the_deck_must_have_three_more_cards_than_players():
    with pytest.raises(RuleError) as error:
        Game.deal(["p0", "p1", "p2"], [R.VILLAGER] * 5, T, NoShuffle(0))
    assert error.value.code is ErrorCode.DECK_SIZE

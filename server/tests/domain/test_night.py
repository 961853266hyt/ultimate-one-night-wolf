import pytest

from app.domain.errors import ErrorCode, RuleError
from app.domain.night import plan_for
from app.domain.types import Phase, SawCard, Timings
from app.domain.types import RoleId as R
from tests.domain.helpers import NoShuffle, new_game, night_until, skip

STEP = Timings().night_step


def test_the_plan_covers_waking_roles_in_the_deck_in_wake_order():
    deck = [R.VILLAGER, R.INSOMNIAC, R.SEER, R.WEREWOLF, R.WEREWOLF, R.HUNTER]
    assert plan_for(deck) == [R.WEREWOLF, R.SEER, R.INSOMNIAC]


def test_every_step_lasts_the_same_time_even_for_roles_in_the_center():
    # 预言家和强盗都在底牌里，但这两步照样走满
    game = new_game(R.WEREWOLF, R.VILLAGER, R.DRUNK, R.SEER, R.ROBBER, R.WEREWOLF)
    now = skip(game)
    steps = []
    while game.phase is Phase.NIGHT:
        steps.append((game.night_role, game.ends_at - now))
        now = skip(game)
    assert steps == [(R.WEREWOLF, STEP), (R.SEER, STEP), (R.ROBBER, STEP), (R.DRUNK, STEP)]


def test_a_step_never_ends_early_even_after_the_actor_has_acted():
    game = new_game(R.SEER, R.WEREWOLF, R.VILLAGER, R.ROBBER, R.DRUNK, R.WEREWOLF)
    night_until(game, R.SEER)
    deadline = game.ends_at
    assert deadline is not None

    game.night_action("p0", ["p1"])
    game.tick(deadline - 0.001, NoShuffle(0))

    assert game.ends_at == deadline
    assert game.night_role is R.SEER


def test_a_deck_without_waking_roles_goes_straight_to_day():
    game = new_game(R.VILLAGER, R.VILLAGER, R.VILLAGER, R.HUNTER, R.TANNER, R.VILLAGER)
    skip(game)
    assert game.phase is Phase.DAY


def test_only_the_player_whose_turn_it_is_may_act():
    game = new_game(R.SEER, R.WEREWOLF, R.VILLAGER, R.ROBBER, R.DRUNK, R.WEREWOLF)
    night_until(game, R.SEER)
    with pytest.raises(RuleError) as error:
        game.night_action("p2", ["p1"])
    assert error.value.code is ErrorCode.NOT_YOUR_TURN


def test_a_player_acts_at_most_once_per_step():
    game = new_game(R.SEER, R.WEREWOLF, R.VILLAGER, R.ROBBER, R.DRUNK, R.WEREWOLF)
    night_until(game, R.SEER)
    game.night_action("p0", ["p1"])
    with pytest.raises(RuleError) as error:
        game.night_action("p0", ["p2"])
    assert error.value.code is ErrorCode.ALREADY_ACTED


def test_night_actions_are_rejected_outside_the_night():
    game = new_game(R.SEER, R.WEREWOLF, R.VILLAGER, R.ROBBER, R.DRUNK, R.WEREWOLF)
    with pytest.raises(RuleError) as error:
        game.night_action("p0", ["p1"])
    assert error.value.code is ErrorCode.WRONG_PHASE


def test_what_you_saw_does_not_change_when_cards_move_later():
    game = new_game(R.SEER, R.WEREWOLF, R.ROBBER, R.VILLAGER, R.DRUNK, R.WEREWOLF)
    night_until(game, R.SEER)
    game.night_action("p0", ["p1"])
    night_until(game, R.ROBBER)
    game.night_action("p2", ["p1"])  # 强盗拿走了预言家看过的那张狼牌

    assert game.cards["p1"] is R.ROBBER
    assert game.knowledge["p0"] == [SawCard(step=R.SEER, slot="p1", role=R.WEREWOLF)]

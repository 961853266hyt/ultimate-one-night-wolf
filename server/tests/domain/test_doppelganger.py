"""化身幽灵：化身成谁，就按谁的规则行动、按谁的阵营算胜负。"""

import pytest

from app.domain.errors import ErrorCode, RuleError
from app.domain.rules import Result
from app.domain.types import Copied, Phase, SawCard, SawPlayers, Swapped, Team, Timings
from app.domain.types import RoleId as R
from tests.domain.helpers import new_game, night_until, skip, until_phase


def doppelganger_game(*others: R):
    """p0 化身幽灵，others 依次是 p1、p2 和三张底牌。停在化身幽灵那一步。"""
    game = new_game(R.DOPPELGANGER, *others)
    night_until(game, R.DOPPELGANGER)
    return game


def test_the_doppelganger_wakes_first_and_becomes_the_role_she_looks_at():
    game = doppelganger_game(R.WEREWOLF, R.VILLAGER, R.SEER, R.ROBBER, R.WEREWOLF)
    assert game.night_index == 0
    game.night_action("p0", ["p2"])
    assert game.knowledge["p0"] == [Copied(step=R.DOPPELGANGER, slot="p2", role=R.VILLAGER)]
    assert game.acting_role("p0") is R.VILLAGER
    assert game.prompt_for("p0") is None  # 村民夜里没事做


@pytest.mark.parametrize("targets", [["p0"], ["C0"], ["p1", "p2"]])
def test_the_doppelganger_copies_exactly_one_other_player(targets):
    game = doppelganger_game(R.WEREWOLF, R.VILLAGER, R.SEER, R.ROBBER, R.WEREWOLF)
    with pytest.raises(RuleError) as error:
        game.night_action("p0", targets)
    assert error.value.code is ErrorCode.BAD_TARGETS


def test_a_doppelganger_who_does_not_choose_copies_someone_at_random():
    game = doppelganger_game(R.WEREWOLF, R.VILLAGER, R.SEER, R.ROBBER, R.WEREWOLF)
    skip(game)
    [entry] = game.night_log
    assert entry.auto and entry.step is R.DOPPELGANGER
    [target] = entry.targets
    assert target in ("p1", "p2")
    assert game.acting_role("p0") is game.cards[target]


def test_the_doppelganger_step_runs_its_full_time_even_with_the_card_in_the_center():
    game = new_game(R.WEREWOLF, R.SEER, R.VILLAGER, R.DOPPELGANGER, R.ROBBER, R.WEREWOLF)
    now = skip(game)  # 入夜
    assert game.night_role is R.DOPPELGANGER
    assert game.wakers() == []
    assert game.ends_at == now + Timings().night_step


# ------------------------------------------------------------ 马上行动的角色


def test_a_doppelganger_seer_looks_right_away_and_does_not_wake_again():
    game = doppelganger_game(R.SEER, R.WEREWOLF, R.VILLAGER, R.ROBBER, R.WEREWOLF)
    game.night_action("p0", ["p1"])
    game.night_action("p0", ["C0", "C1"])
    assert game.knowledge["p0"][-2:] == [
        SawCard(step=R.DOPPELGANGER, slot="C0", role=R.VILLAGER),
        SawCard(step=R.DOPPELGANGER, slot="C1", role=R.ROBBER),
    ]
    assert game.prompt_for("p0") is None
    night_until(game, R.SEER)
    assert game.wakers() == ["p1"]


def test_a_doppelganger_robber_robs_right_away():
    game = doppelganger_game(R.ROBBER, R.WEREWOLF, R.VILLAGER, R.SEER, R.WEREWOLF)
    game.night_action("p0", ["p1"])
    game.night_action("p0", ["p2"])
    assert (game.cards["p0"], game.cards["p2"]) == (R.WEREWOLF, R.DOPPELGANGER)
    assert game.knowledge["p0"][-2:] == [
        Swapped(step=R.DOPPELGANGER, slots=("p0", "p2")),
        SawCard(step=R.DOPPELGANGER, slot="p0", role=R.WEREWOLF),
    ]


def test_whoever_ends_with_the_doppelganger_card_is_the_copied_role():
    game = doppelganger_game(R.ROBBER, R.WEREWOLF, R.VILLAGER, R.SEER, R.WEREWOLF)
    game.night_action("p0", ["p1"])  # 化身成强盗
    game.night_action("p0", ["p2"])  # 抢了狼，化身幽灵的牌到了 p2 手里
    roles = game.final_roles()
    assert (roles["p0"], roles["p2"]) == (R.WEREWOLF, R.ROBBER)


def test_a_doppelganger_troublemaker_swaps_two_others():
    game = doppelganger_game(R.TROUBLEMAKER, R.WEREWOLF, R.VILLAGER, R.SEER, R.WEREWOLF)
    game.night_action("p0", ["p1"])
    game.night_action("p0", ["p1", "p2"])
    assert (game.cards["p1"], game.cards["p2"]) == (R.WEREWOLF, R.TROUBLEMAKER)


def test_a_doppelganger_drunk_who_does_not_swap_is_swapped_at_random():
    game = doppelganger_game(R.DRUNK, R.WEREWOLF, R.VILLAGER, R.SEER, R.WEREWOLF)
    game.night_action("p0", ["p1"])
    prompt = game.prompt_for("p0")
    assert prompt is not None and prompt.required
    skip(game)

    copy, swap = game.night_log
    assert not copy.auto and swap.auto
    assert game.cards[swap.targets[0]] is R.DOPPELGANGER


def test_both_choices_are_made_for_a_doppelganger_who_times_out_and_copies_the_drunk():
    # 两边都是酒鬼，随机化身一定化身成酒鬼
    game = doppelganger_game(R.DRUNK, R.DRUNK, R.VILLAGER, R.SEER, R.WEREWOLF)
    skip(game)
    copy, swap = game.night_log
    assert copy.auto and swap.auto
    assert game.acting_role("p0") is R.DRUNK
    assert game.cards["p0"] is not R.DOPPELGANGER


def test_a_doppelganger_witch_looks_and_swaps_in_the_doppelganger_step():
    game = doppelganger_game(R.WITCH, R.WEREWOLF, R.VILLAGER, R.SEER, R.WEREWOLF)
    game.night_action("p0", ["p1"])
    game.night_action("p0", ["C1"])
    game.night_action("p0", ["p0"])
    assert (game.cards["p0"], game.cards["C1"]) == (R.SEER, R.DOPPELGANGER)
    assert game.prompt_for("p0") is None
    night_until(game, R.WITCH)
    assert game.wakers() == ["p1"]


# ------------------------------------------------------------ 跟着那个角色醒的


def test_a_doppelganger_werewolf_wakes_with_the_werewolves():
    game = doppelganger_game(R.WEREWOLF, R.VILLAGER, R.SEER, R.ROBBER, R.WEREWOLF)
    game.night_action("p0", ["p1"])
    assert game.prompt_for("p0") is None
    night_until(game, R.WEREWOLF)
    assert game.wakers() == ["p0", "p1"]
    assert game.knowledge["p1"] == [SawPlayers(step=R.WEREWOLF, role=R.WEREWOLF, players=["p0"])]
    assert game.prompt_for("p1") is None  # 有两只狼，不是独狼


def test_a_doppelganger_minion_sees_the_werewolves():
    game = doppelganger_game(R.MINION, R.WEREWOLF, R.VILLAGER, R.SEER, R.WEREWOLF)
    game.night_action("p0", ["p1"])
    night_until(game, R.MINION)
    assert game.wakers() == ["p0", "p1"]
    assert game.knowledge["p0"][-1] == SawPlayers(step=R.MINION, role=R.WEREWOLF, players=["p2"])


def test_a_doppelganger_mason_meets_the_mason():
    game = doppelganger_game(R.MASON, R.VILLAGER, R.WEREWOLF, R.SEER, R.WEREWOLF)
    game.night_action("p0", ["p1"])
    night_until(game, R.MASON)
    assert game.knowledge["p1"] == [SawPlayers(step=R.MASON, role=R.MASON, players=["p0"])]


def test_a_doppelganger_insomniac_sees_her_card_at_the_end_of_the_night():
    game = doppelganger_game(R.INSOMNIAC, R.ROBBER, R.VILLAGER, R.SEER, R.WEREWOLF)
    game.night_action("p0", ["p1"])
    night_until(game, R.ROBBER)
    game.night_action("p2", ["p0"])  # 强盗拿走了化身幽灵的牌
    night_until(game, R.INSOMNIAC)
    assert game.wakers() == ["p0", "p1"]
    assert game.knowledge["p0"][-1] == SawCard(step=R.INSOMNIAC, slot="p0", role=R.ROBBER)


# ------------------------------------------------------------ 胜负


def test_a_doppelganger_werewolf_is_on_the_werewolf_team():
    game = doppelganger_game(R.WEREWOLF, R.VILLAGER, R.SEER, R.ROBBER, R.WEREWOLF)
    game.night_action("p0", ["p1"])
    until_phase(game, Phase.VOTE)
    for voter, target in [("p0", "p2"), ("p1", "p2"), ("p2", "p0")]:
        game.vote(voter, target, now=0)
    assert game.result == Result(deaths=["p2"], winning_teams=[Team.WEREWOLF], winners=["p0", "p1"])


def test_a_doppelganger_who_copies_a_villager_counts_as_one_at_daybreak():
    # 狼都在底牌里，化身幽灵化身成村民：玩家全是好人，天一亮就揭晓
    game = doppelganger_game(R.VILLAGER, R.SEER, R.WEREWOLF, R.ROBBER, R.WEREWOLF)
    game.night_action("p0", ["p1"])
    until_phase(game, Phase.REVEAL)
    assert game.result is not None and game.result.winning_teams == [Team.VILLAGE]

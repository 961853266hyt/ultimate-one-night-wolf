"""模仿者：看一张底牌变成那个角色，到那个角色那一步再和他们一起醒，按那个角色的阵营算胜负。"""

import pytest

from app.domain.errors import ErrorCode, RuleError
from app.domain.rules import Result
from app.domain.types import CENTER, Copied, Phase, SawCard, SawPlayers, Team, Timings
from app.domain.types import RoleId as R
from tests.domain.helpers import new_game, night_until, skip, until_phase


def copycat_game(*others: R):
    """p0 模仿者，others 依次是 p1、p2 和三张底牌 C0、C1、C2。停在模仿者那一步。"""
    game = new_game(R.COPYCAT, *others)
    night_until(game, R.COPYCAT)
    return game


def test_the_copycat_wakes_first_and_becomes_the_center_card_she_looks_at():
    game = copycat_game(R.WEREWOLF, R.VILLAGER, R.SEER, R.ROBBER, R.TROUBLEMAKER)
    assert game.night_index == 0
    game.night_action("p0", ["C0"])
    assert game.knowledge["p0"] == [Copied(step=R.COPYCAT, slot="C0", role=R.SEER)]
    assert game.acting_role("p0") is R.SEER
    assert game.prompt_for("p0") is None  # 预言家的事到预言家那一步再做


@pytest.mark.parametrize("targets", [["p1"], ["p0"], ["C0", "C1"]])
def test_the_copycat_copies_exactly_one_center_card(targets):
    game = copycat_game(R.WEREWOLF, R.VILLAGER, R.SEER, R.ROBBER, R.TROUBLEMAKER)
    with pytest.raises(RuleError) as error:
        game.night_action("p0", targets)
    assert error.value.code is ErrorCode.BAD_TARGETS


def test_a_copycat_who_does_not_choose_copies_a_center_card_at_random():
    game = copycat_game(R.WEREWOLF, R.VILLAGER, R.SEER, R.ROBBER, R.TROUBLEMAKER)
    skip(game)
    [entry] = game.night_log
    assert entry.auto and entry.step is R.COPYCAT
    [target] = entry.targets
    assert target in CENTER
    assert game.acting_role("p0") is game.cards[target]


def test_the_copycat_step_runs_its_full_time_even_with_the_card_in_the_center():
    game = new_game(R.WEREWOLF, R.SEER, R.VILLAGER, R.COPYCAT, R.ROBBER, R.WEREWOLF)
    now = skip(game)  # 入夜
    assert game.night_role is R.COPYCAT
    assert game.wakers() == []
    assert game.ends_at == now + Timings().night_step


# ------------------------------------------------------------ 到那个角色那一步再醒


def test_a_copycat_seer_looks_at_the_seer_step():
    game = copycat_game(R.WEREWOLF, R.VILLAGER, R.SEER, R.ROBBER, R.TROUBLEMAKER)
    game.night_action("p0", ["C0"])
    night_until(game, R.SEER)
    assert game.wakers() == ["p0"]
    game.night_action("p0", ["p1"])
    assert game.knowledge["p0"][-1] == SawCard(step=R.SEER, slot="p1", role=R.WEREWOLF)


def test_a_copycat_werewolf_wakes_with_the_werewolves():
    game = copycat_game(R.WEREWOLF, R.VILLAGER, R.WEREWOLF, R.SEER, R.ROBBER)
    game.night_action("p0", ["C0"])
    night_until(game, R.WEREWOLF)
    assert game.wakers() == ["p0", "p1"]
    assert game.knowledge["p1"] == [SawPlayers(step=R.WEREWOLF, role=R.WEREWOLF, players=["p0"])]
    assert game.prompt_for("p1") is None  # 有两只狼，不是独狼


def test_a_copycat_minion_sees_the_werewolves():
    game = copycat_game(R.WEREWOLF, R.VILLAGER, R.MINION, R.SEER, R.ROBBER)
    game.night_action("p0", ["C0"])
    night_until(game, R.MINION)
    assert game.wakers() == ["p0"]
    assert game.knowledge["p0"][-1] == SawPlayers(step=R.MINION, role=R.WEREWOLF, players=["p1"])


def test_a_copycat_mason_meets_the_mason():
    game = copycat_game(R.MASON, R.VILLAGER, R.MASON, R.SEER, R.WEREWOLF)
    game.night_action("p0", ["C0"])
    night_until(game, R.MASON)
    assert game.knowledge["p1"] == [SawPlayers(step=R.MASON, role=R.MASON, players=["p0"])]


def test_a_copycat_insomniac_sees_her_card_at_the_end_of_the_night():
    game = copycat_game(R.ROBBER, R.VILLAGER, R.INSOMNIAC, R.SEER, R.WEREWOLF)
    game.night_action("p0", ["C0"])
    night_until(game, R.ROBBER)
    game.night_action("p1", ["p0"])  # 强盗拿走了模仿者的牌
    night_until(game, R.INSOMNIAC)
    assert game.wakers() == ["p0"]
    assert game.knowledge["p0"][-1] == SawCard(step=R.INSOMNIAC, slot="p0", role=R.ROBBER)


def test_a_copycat_drunk_who_does_not_swap_is_swapped_at_random():
    game = copycat_game(R.WEREWOLF, R.VILLAGER, R.DRUNK, R.SEER, R.ROBBER)
    game.night_action("p0", ["C0"])
    night_until(game, R.DRUNK)
    prompt = game.prompt_for("p0")
    assert prompt is not None and prompt.required
    skip(game)
    swap = game.night_log[-1]
    assert swap.auto and swap.step is R.DRUNK
    assert game.cards[swap.targets[0]] is R.COPYCAT


# ------------------------------------------------------------ 和化身幽灵


def test_a_copycat_who_copies_the_doppelganger_copies_a_player_at_the_doppelganger_step():
    game = copycat_game(R.SEER, R.WEREWOLF, R.DOPPELGANGER, R.VILLAGER, R.ROBBER)
    game.night_action("p0", ["C0"])
    assert game.prompt_for("p0") is None
    night_until(game, R.DOPPELGANGER)
    assert game.wakers() == ["p0"]
    game.night_action("p0", ["p1"])  # 化身成预言家，马上验人
    game.night_action("p0", ["C1", "C2"])
    assert game.knowledge["p0"] == [
        Copied(step=R.COPYCAT, slot="C0", role=R.DOPPELGANGER),
        Copied(step=R.DOPPELGANGER, slot="p1", role=R.SEER),
        SawCard(step=R.DOPPELGANGER, slot="C1", role=R.VILLAGER),
        SawCard(step=R.DOPPELGANGER, slot="C2", role=R.ROBBER),
    ]
    night_until(game, R.SEER)
    assert game.wakers() == ["p1"]  # 已经在化身幽灵那一步验过了
    assert game.counts_as() == {R.COPYCAT: R.SEER}


def test_a_doppelganger_who_copies_the_copycat_does_nothing_but_wins_like_her():
    game = copycat_game(R.DOPPELGANGER, R.VILLAGER, R.WEREWOLF, R.SEER, R.ROBBER)
    game.night_action("p0", ["C0"])  # 模仿者变成狼人
    night_until(game, R.DOPPELGANGER)
    game.night_action("p1", ["p0"])
    assert game.knowledge["p1"] == [Copied(step=R.DOPPELGANGER, slot="p0", role=R.COPYCAT)]
    assert game.prompt_for("p1") is None  # 模仿的那一步已经过去了
    night_until(game, R.WEREWOLF)
    assert game.wakers() == ["p0"]  # 不和狼一起醒
    assert game.counts_as() == {R.COPYCAT: R.WEREWOLF, R.DOPPELGANGER: R.WEREWOLF}
    assert game.final_roles()["p1"] is R.WEREWOLF


# ------------------------------------------------------------ 胜负


def test_whoever_ends_with_the_copycat_card_is_the_copied_role():
    game = copycat_game(R.ROBBER, R.VILLAGER, R.WEREWOLF, R.SEER, R.TROUBLEMAKER)
    game.night_action("p0", ["C0"])  # 模仿者变成狼人
    night_until(game, R.ROBBER)
    game.night_action("p1", ["p0"])  # 强盗拿走了模仿者的牌
    roles = game.final_roles()
    assert (roles["p0"], roles["p1"]) == (R.ROBBER, R.WEREWOLF)


def test_a_copycat_tanner_wins_alone_when_voted_out():
    game = copycat_game(R.WEREWOLF, R.VILLAGER, R.TANNER, R.SEER, R.ROBBER)
    game.night_action("p0", ["C0"])
    until_phase(game, Phase.VOTE)
    for voter, target in [("p0", "p1"), ("p1", "p0"), ("p2", "p0")]:
        game.vote(voter, target, now=0)
    assert game.result == Result(deaths=["p0"], winning_teams=[Team.TANNER], winners=["p0"])


def test_a_copycat_who_copies_a_villager_counts_as_one_at_daybreak():
    # 狼都在底牌里，模仿者变成村民：玩家全是好人，天一亮就揭晓
    game = copycat_game(R.SEER, R.VILLAGER, R.VILLAGER, R.WEREWOLF, R.WEREWOLF)
    game.night_action("p0", ["C0"])
    until_phase(game, Phase.REVEAL)
    assert game.result is not None and game.result.winning_teams == [Team.VILLAGE]


def test_a_copycat_who_copies_a_werewolf_keeps_the_game_going():
    game = copycat_game(R.SEER, R.VILLAGER, R.WEREWOLF, R.ROBBER, R.VILLAGER)
    game.night_action("p0", ["C0"])
    until_phase(game, Phase.DAY)
    assert game.phase is Phase.DAY

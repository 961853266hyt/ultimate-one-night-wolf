import pytest

from app.domain.errors import ErrorCode, RuleError
from app.domain.night import NIGHT_ORDER
from app.domain.roles import ROLES, Role
from app.domain.types import RoleId as R
from app.domain.types import SawCard, SawPlayers, Swapped
from tests.domain.helpers import new_game, night_until, skip


def test_every_role_is_registered():
    assert set(ROLES) == set(R)


def test_the_night_order_lists_each_role_once():
    assert len(NIGHT_ORDER) == len(set(NIGHT_ORDER))


def has_night_behavior(role: Role) -> bool:
    cls = type(role)
    return any(getattr(cls, m) is not getattr(Role, m) for m in ("wake_info", "prompt", "choices"))


@pytest.mark.parametrize("role", list(ROLES.values()), ids=lambda role: role.id)
def test_a_role_wakes_at_night_exactly_when_it_has_something_to_do_there(role):
    # 写了夜间能力却忘了排进 NIGHT_ORDER，这个角色就永远不会醒，而且不会报错
    assert (role.id in NIGHT_ORDER) == has_night_behavior(role)


def test_werewolves_see_each_other_and_cannot_peek():
    game = new_game(R.WEREWOLF, R.WEREWOLF, R.SEER, R.VILLAGER, R.ROBBER, R.DRUNK)
    night_until(game, R.WEREWOLF)
    assert game.knowledge["p0"] == [SawPlayers(step=R.WEREWOLF, role=R.WEREWOLF, players=["p1"])]
    assert game.knowledge["p1"] == [SawPlayers(step=R.WEREWOLF, role=R.WEREWOLF, players=["p0"])]
    assert game.prompt_for("p0") is None


def test_lone_wolf_may_peek_at_one_center_card():
    game = new_game(R.WEREWOLF, R.SEER, R.VILLAGER, R.WEREWOLF, R.ROBBER, R.DRUNK)
    night_until(game, R.WEREWOLF)
    assert game.knowledge["p0"] == [SawPlayers(step=R.WEREWOLF, role=R.WEREWOLF, players=[])]

    game.night_action("p0", ["C0"])
    assert game.knowledge["p0"][-1] == SawCard(step=R.WEREWOLF, slot="C0", role=R.WEREWOLF)


def test_minion_sees_the_wolf_but_the_wolf_does_not_see_the_minion():
    game = new_game(R.WEREWOLF, R.MINION, R.VILLAGER, R.SEER, R.ROBBER, R.DRUNK)
    night_until(game, R.MINION)
    assert game.knowledge["p1"] == [SawPlayers(step=R.MINION, role=R.WEREWOLF, players=["p0"])]
    assert game.knowledge["p0"] == [SawPlayers(step=R.WEREWOLF, role=R.WEREWOLF, players=[])]


def test_minion_learns_when_every_wolf_is_in_the_center():
    game = new_game(R.MINION, R.SEER, R.VILLAGER, R.WEREWOLF, R.WEREWOLF, R.DRUNK)
    night_until(game, R.MINION)
    assert game.knowledge["p0"] == [SawPlayers(step=R.MINION, role=R.WEREWOLF, players=[])]


def test_masons_see_each_other():
    game = new_game(R.MASON, R.VILLAGER, R.MASON, R.WEREWOLF, R.SEER, R.DRUNK)
    night_until(game, R.MASON)
    assert game.knowledge["p0"] == [SawPlayers(step=R.MASON, role=R.MASON, players=["p2"])]
    assert game.knowledge["p2"] == [SawPlayers(step=R.MASON, role=R.MASON, players=["p0"])]


def test_seer_views_another_player():
    game = new_game(R.SEER, R.WEREWOLF, R.VILLAGER, R.ROBBER, R.DRUNK, R.WEREWOLF)
    night_until(game, R.SEER)
    game.night_action("p0", ["p1"])
    assert game.knowledge["p0"] == [SawCard(step=R.SEER, slot="p1", role=R.WEREWOLF)]


def test_seer_views_two_center_cards():
    game = new_game(R.SEER, R.WEREWOLF, R.VILLAGER, R.ROBBER, R.DRUNK, R.WEREWOLF)
    night_until(game, R.SEER)
    game.night_action("p0", ["C0", "C2"])
    assert game.knowledge["p0"] == [
        SawCard(step=R.SEER, slot="C0", role=R.ROBBER),
        SawCard(step=R.SEER, slot="C2", role=R.WEREWOLF),
    ]


@pytest.mark.parametrize(
    "targets",
    [[], ["p0"], ["p9"], ["C0"], ["C0", "C0"], ["p1", "p2"], ["p1", "C0"]],
    ids=["nothing", "self", "stranger", "one-center", "same-center", "two-players", "mixed"],
)
def test_seer_rejects_targets_that_fit_no_option(targets):
    game = new_game(R.SEER, R.WEREWOLF, R.VILLAGER, R.ROBBER, R.DRUNK, R.WEREWOLF)
    night_until(game, R.SEER)
    with pytest.raises(RuleError) as error:
        game.night_action("p0", targets)
    assert error.value.code is ErrorCode.BAD_TARGETS
    assert "p0" not in game.knowledge


def test_robber_takes_the_card_and_sees_it():
    game = new_game(R.ROBBER, R.WEREWOLF, R.VILLAGER, R.SEER, R.DRUNK, R.WEREWOLF)
    night_until(game, R.ROBBER)
    robbed_knew = list(game.knowledge["p1"])

    game.night_action("p0", ["p1"])

    assert (game.cards["p0"], game.cards["p1"]) == (R.WEREWOLF, R.ROBBER)
    assert game.knowledge["p0"] == [
        Swapped(step=R.ROBBER, slots=("p0", "p1")),
        SawCard(step=R.ROBBER, slot="p0", role=R.WEREWOLF),
    ]
    assert game.knowledge["p1"] == robbed_knew


def witch_game():
    """p0 女巫，p1 狼，p2 村民；底牌：预言家、酒鬼、狼。"""
    game = new_game(R.WITCH, R.WEREWOLF, R.VILLAGER, R.SEER, R.DRUNK, R.WEREWOLF)
    night_until(game, R.WITCH)
    return game


def test_witch_looks_at_a_center_card_then_must_give_it_to_a_player():
    game = witch_game()
    game.night_action("p0", ["C0"])
    assert game.knowledge["p0"] == [SawCard(step=R.WITCH, slot="C0", role=R.SEER)]
    prompt = game.prompt_for("p0")
    assert prompt is not None and prompt.required

    game.night_action("p0", ["p2"])
    assert (game.cards["C0"], game.cards["p2"]) == (R.VILLAGER, R.SEER)
    assert game.knowledge["p0"][-1] == Swapped(step=R.WITCH, slots=("C0", "p2"))
    assert game.prompt_for("p0") is None


def test_witch_may_give_the_card_to_herself():
    game = witch_game()
    game.night_action("p0", ["C2"])
    game.night_action("p0", ["p0"])
    assert (game.cards["p0"], game.cards["C2"]) == (R.WEREWOLF, R.WITCH)
    assert game.knowledge["p0"][-2:] == [
        Swapped(step=R.WITCH, slots=("C2", "p0")),
        SawCard(step=R.WITCH, slot="p0", role=R.WEREWOLF),
    ]


def test_witch_must_look_at_a_center_card_first():
    game = witch_game()
    with pytest.raises(RuleError) as error:
        game.night_action("p0", ["p1"])
    assert error.value.code is ErrorCode.BAD_TARGETS


def test_a_witch_who_does_not_look_changes_nothing():
    game = witch_game()
    skip(game)
    assert game.night_log == []
    assert game.cards == game.dealt


def test_a_witch_who_looks_but_does_not_swap_is_swapped_at_random():
    game = witch_game()
    game.night_action("p0", ["C0"])
    skip(game)

    look, swap = game.night_log
    assert not look.auto and swap.auto
    [target] = swap.targets
    assert game.cards[target] is R.SEER  # 看到的那张换到了被选中的人手里


def test_each_night_log_entry_keeps_what_that_action_revealed():
    game = witch_game()
    game.night_action("p0", ["C0"])
    game.night_action("p0", ["p0"])
    look, swap = game.night_log
    assert look.learned == [SawCard(step=R.WITCH, slot="C0", role=R.SEER)]
    assert swap.learned == [
        Swapped(step=R.WITCH, slots=("C0", "p0")),
        SawCard(step=R.WITCH, slot="p0", role=R.SEER),
    ]


def test_troublemaker_swaps_two_others_without_looking():
    game = new_game(R.TROUBLEMAKER, R.WEREWOLF, R.VILLAGER, R.SEER, R.DRUNK, R.WEREWOLF)
    night_until(game, R.TROUBLEMAKER)
    game.night_action("p0", ["p1", "p2"])
    assert (game.cards["p1"], game.cards["p2"]) == (R.VILLAGER, R.WEREWOLF)
    assert game.knowledge["p0"] == [Swapped(step=R.TROUBLEMAKER, slots=("p1", "p2"))]


def test_troublemaker_cannot_swap_his_own_card():
    game = new_game(R.TROUBLEMAKER, R.WEREWOLF, R.VILLAGER, R.SEER, R.DRUNK, R.WEREWOLF)
    night_until(game, R.TROUBLEMAKER)
    with pytest.raises(RuleError):
        game.night_action("p0", ["p0", "p1"])


def test_drunk_swaps_with_the_center_without_looking():
    game = new_game(R.DRUNK, R.WEREWOLF, R.VILLAGER, R.SEER, R.ROBBER, R.WEREWOLF)
    night_until(game, R.DRUNK)
    game.night_action("p0", ["C1"])
    assert (game.cards["p0"], game.cards["C1"]) == (R.ROBBER, R.DRUNK)
    assert game.knowledge["p0"] == [Swapped(step=R.DRUNK, slots=("p0", "C1"))]


def test_a_drunk_who_does_nothing_is_swapped_at_random():
    game = new_game(R.DRUNK, R.WEREWOLF, R.VILLAGER, R.SEER, R.ROBBER, R.WEREWOLF)
    night_until(game, R.DRUNK)
    skip(game)

    [entry] = game.night_log
    assert entry.auto and entry.step is R.DRUNK
    assert game.cards[entry.targets[0]] is R.DRUNK
    assert not any(isinstance(fact, SawCard) for fact in game.knowledge["p0"])


def test_insomniac_sees_the_card_she_ends_the_night_with():
    game = new_game(R.INSOMNIAC, R.ROBBER, R.VILLAGER, R.SEER, R.DRUNK, R.WEREWOLF)
    night_until(game, R.ROBBER)
    game.night_action("p1", ["p0"])
    night_until(game, R.INSOMNIAC)
    assert game.knowledge["p0"] == [SawCard(step=R.INSOMNIAC, slot="p0", role=R.ROBBER)]


def test_players_act_as_the_card_they_were_dealt():
    game = new_game(R.TROUBLEMAKER, R.DRUNK, R.VILLAGER, R.SEER, R.ROBBER, R.WEREWOLF)
    night_until(game, R.TROUBLEMAKER)
    game.night_action("p0", ["p1", "p2"])  # 酒鬼牌换到了 p2 手里
    night_until(game, R.DRUNK)
    assert game.wakers() == ["p1"]

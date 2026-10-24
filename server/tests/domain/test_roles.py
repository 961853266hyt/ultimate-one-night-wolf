import pytest

from app.domain.errors import ErrorCode, RuleError
from app.domain.night import NIGHT_ORDER
from app.domain.roles import ROLES, Role
from app.domain.types import CENTER, Revealed, SawCard, SawPlayers, Shifted, Swapped
from app.domain.types import RoleId as R
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


def test_lone_wolf_peeks_at_one_center_card():
    game = new_game(R.WEREWOLF, R.SEER, R.VILLAGER, R.WEREWOLF, R.ROBBER, R.DRUNK)
    night_until(game, R.WEREWOLF)
    assert game.knowledge["p0"] == [SawPlayers(step=R.WEREWOLF, role=R.WEREWOLF, players=[])]

    game.night_action("p0", ["C0"])
    assert game.knowledge["p0"][-1] == SawCard(step=R.WEREWOLF, slot="C0", role=R.WEREWOLF)


def test_lone_wolf_must_peek_so_the_system_picks_a_card_on_timeout():
    game = new_game(R.WEREWOLF, R.SEER, R.VILLAGER, R.WEREWOLF, R.ROBBER, R.DRUNK)
    night_until(game, R.WEREWOLF)
    prompt = game.prompt_for("p0")
    assert prompt is not None and prompt.required

    skip(game)  # 到时间还没选
    [entry] = [e for e in game.night_log if e.step is R.WEREWOLF]
    assert entry.auto and entry.player == "p0" and entry.targets[0] in CENTER
    assert isinstance(game.knowledge["p0"][-1], SawCard)


def test_minion_sees_the_wolf_but_the_wolf_does_not_see_the_minion():
    game = new_game(R.WEREWOLF, R.MINION, R.VILLAGER, R.SEER, R.ROBBER, R.DRUNK)
    night_until(game, R.MINION)
    assert game.knowledge["p1"] == [SawPlayers(step=R.MINION, role=R.WEREWOLF, players=["p0"])]
    # 狼只知道自己是独狼（之后看的那张底牌不算），不知道爪牙
    assert game.knowledge["p0"][0] == SawPlayers(step=R.WEREWOLF, role=R.WEREWOLF, players=[])
    assert not any(
        isinstance(fact, SawPlayers) and fact.role is R.MINION for fact in game.knowledge["p0"]
    )


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


def test_seer_views_two_center_cards_one_at_a_time():
    game = new_game(R.SEER, R.WEREWOLF, R.VILLAGER, R.ROBBER, R.DRUNK, R.WEREWOLF)
    night_until(game, R.SEER)
    game.night_action("p0", ["C0"])
    assert game.knowledge["p0"] == [SawCard(step=R.SEER, slot="C0", role=R.ROBBER)]

    game.night_action("p0", ["C2"])
    assert game.knowledge["p0"] == [
        SawCard(step=R.SEER, slot="C0", role=R.ROBBER),
        SawCard(step=R.SEER, slot="C2", role=R.WEREWOLF),
    ]
    assert game.prompt_for("p0") is None


def test_a_seer_who_saw_one_center_card_must_see_a_different_one():
    game = new_game(R.SEER, R.WEREWOLF, R.VILLAGER, R.ROBBER, R.DRUNK, R.WEREWOLF)
    night_until(game, R.SEER)
    game.night_action("p0", ["C0"])

    prompt = game.prompt_for("p0")
    assert prompt is not None and prompt.required
    with pytest.raises(RuleError) as error:
        game.night_action("p0", ["C0"])
    assert error.value.code is ErrorCode.BAD_TARGETS
    with pytest.raises(RuleError) as error:
        game.night_action("p0", ["p1"])  # 看了底牌就不能再改看玩家
    assert error.value.code is ErrorCode.BAD_TARGETS


def test_a_seer_who_stops_after_one_center_card_sees_another_at_random():
    game = new_game(R.SEER, R.WEREWOLF, R.VILLAGER, R.ROBBER, R.DRUNK, R.WEREWOLF)
    night_until(game, R.SEER)
    game.night_action("p0", ["C1"])
    skip(game)

    first, second = actions(game, R.SEER)
    assert not first.auto and second.auto
    [slot] = second.targets
    assert slot in ("C0", "C2")
    assert game.knowledge["p0"][-1] == SawCard(step=R.SEER, slot=slot, role=game.cards[slot])


def test_a_seer_who_saw_a_player_is_done():
    game = new_game(R.SEER, R.WEREWOLF, R.VILLAGER, R.ROBBER, R.DRUNK, R.WEREWOLF)
    night_until(game, R.SEER)
    game.night_action("p0", ["p1"])
    assert game.prompt_for("p0") is None


@pytest.mark.parametrize(
    "targets",
    [[], ["p0"], ["p9"], ["C0", "C2"], ["C0", "C0"], ["p1", "p2"], ["p1", "C0"]],
    ids=[
        "nothing",
        "self",
        "stranger",
        "two-centers-at-once",
        "same-center",
        "two-players",
        "mixed",
    ],
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


def test_a_robber_who_does_nothing_robs_someone_at_random():
    game = new_game(R.ROBBER, R.WEREWOLF, R.VILLAGER, R.SEER, R.DRUNK, R.WEREWOLF)
    night_until(game, R.ROBBER)
    skip(game)

    [entry] = actions(game, R.ROBBER)
    assert entry.auto and entry.step is R.ROBBER
    [target] = entry.targets
    assert target in ("p1", "p2")  # 只抢其他玩家，不抢自己，也不抢底牌
    assert game.cards[target] is R.ROBBER
    assert game.knowledge["p0"] == [
        Swapped(step=R.ROBBER, slots=("p0", target)),
        SawCard(step=R.ROBBER, slot="p0", role=game.cards["p0"]),
    ]


def actions(game, step: R) -> list:
    """夜里某个角色那一步的行动记录。独狼那一步到时间会自动翻一张底牌，和别的角色无关，先滤掉。"""
    return [entry for entry in game.night_log if entry.step is step]


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
    assert actions(game, R.WITCH) == []
    assert game.cards == game.dealt


def test_a_witch_who_looks_but_does_not_swap_is_swapped_at_random():
    game = witch_game()
    game.night_action("p0", ["C0"])
    skip(game)

    look, swap = actions(game, R.WITCH)
    assert not look.auto and swap.auto
    [target] = swap.targets
    assert game.cards[target] is R.SEER  # 看到的那张换到了被选中的人手里


def test_each_night_log_entry_keeps_what_that_action_revealed():
    game = witch_game()
    game.night_action("p0", ["C0"])
    game.night_action("p0", ["p0"])
    look, swap = actions(game, R.WITCH)
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

    [entry] = actions(game, R.DRUNK)
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


# ---------------------------------------------------------------- 白痴


def test_village_idiot_passes_everyone_elses_card_to_the_next_seat():
    # p0 预言家，p1 白痴，p2 猎人，p3 皮匠（强盗到时间会随机抢牌，这里不放）
    game = new_game(R.SEER, R.VILLAGE_IDIOT, R.HUNTER, R.TANNER, R.WEREWOLF, R.WEREWOLF, R.VILLAGER)
    night_until(game, R.VILLAGE_IDIOT)
    game.night_action("p1", ["next"])
    # 跳过白痴自己：p0 → p2 → p3 → p0
    assert [game.cards[p] for p in game.players] == [R.TANNER, R.VILLAGE_IDIOT, R.SEER, R.HUNTER]
    assert game.knowledge["p1"] == [Shifted(step=R.VILLAGE_IDIOT, direction="next")]


def test_village_idiot_can_pass_the_other_way():
    game = new_game(R.SEER, R.VILLAGE_IDIOT, R.HUNTER, R.TANNER, R.WEREWOLF, R.WEREWOLF, R.VILLAGER)
    night_until(game, R.VILLAGE_IDIOT)
    game.night_action("p1", ["previous"])
    assert [game.cards[p] for p in game.players] == [R.HUNTER, R.VILLAGE_IDIOT, R.TANNER, R.SEER]


def test_village_idiot_may_leave_the_cards_alone():
    game = new_game(R.SEER, R.VILLAGE_IDIOT, R.HUNTER, R.TANNER, R.WEREWOLF, R.WEREWOLF, R.VILLAGER)
    night_until(game, R.VILLAGE_IDIOT)
    prompt = game.prompt_for("p1")
    assert prompt is not None and not prompt.required
    before = dict(game.cards)
    skip(game)
    assert game.cards == before


@pytest.mark.parametrize("targets", [["p0"], ["left"], ["next", "previous"]])
def test_village_idiot_only_picks_a_direction(targets):
    game = new_game(R.SEER, R.VILLAGE_IDIOT, R.HUNTER, R.TANNER, R.WEREWOLF, R.WEREWOLF, R.VILLAGER)
    night_until(game, R.VILLAGE_IDIOT)
    with pytest.raises(RuleError) as error:
        game.night_action("p1", targets)
    assert error.value.code is ErrorCode.BAD_TARGETS


def test_a_doppelganger_village_idiot_shifts_the_cards_right_away():
    # p0 化身幽灵，p1 白痴，p2 预言家，p3 皮匠
    game = new_game(
        R.DOPPELGANGER, R.VILLAGE_IDIOT, R.SEER, R.TANNER, R.WEREWOLF, R.WEREWOLF, R.VILLAGER
    )
    night_until(game, R.DOPPELGANGER)
    game.night_action("p0", ["p1"])
    game.night_action("p0", ["next"])
    assert [game.cards[p] for p in game.players] == [
        R.DOPPELGANGER,
        R.TANNER,
        R.VILLAGE_IDIOT,
        R.SEER,
    ]
    assert game.knowledge["p0"][-1] == Shifted(step=R.DOPPELGANGER, direction="next")


# ---------------------------------------------------------------- 揭示者


def test_revealer_leaves_a_village_card_face_up_for_everyone():
    game = new_game(R.REVEALER, R.SEER, R.WEREWOLF, R.VILLAGER, R.WEREWOLF, R.ROBBER)
    night_until(game, R.REVEALER)
    game.night_action("p0", ["p1"])
    assert game.face_up == {"p1": R.SEER}
    assert game.knowledge["p0"] == [Revealed(step=R.REVEALER, slot="p1", role=R.SEER, face_up=True)]


@pytest.mark.parametrize("hidden", [R.WEREWOLF, R.MINION, R.TANNER])
def test_revealer_turns_werewolf_team_and_tanner_cards_back_down(hidden):
    game = new_game(R.REVEALER, hidden, R.VILLAGER, R.SEER, R.WEREWOLF, R.ROBBER)
    night_until(game, R.REVEALER)
    game.night_action("p0", ["p1"])
    assert game.face_up == {}
    assert game.knowledge["p0"] == [
        Revealed(step=R.REVEALER, slot="p1", role=hidden, face_up=False)
    ]


def test_revealer_judges_a_doppelganger_card_by_what_it_became():
    # p0 化身幽灵化身成狼人：这张牌算狼人，翻开也要扣回去
    game = new_game(R.DOPPELGANGER, R.WEREWOLF, R.REVEALER, R.VILLAGER, R.SEER, R.ROBBER)
    night_until(game, R.DOPPELGANGER)
    game.night_action("p0", ["p1"])
    night_until(game, R.REVEALER)
    game.night_action("p2", ["p0"])
    assert game.face_up == {}
    assert game.knowledge["p2"][-1] == Revealed(
        step=R.REVEALER, slot="p0", role=R.DOPPELGANGER, face_up=False
    )


def test_revealer_cannot_flip_their_own_card_or_a_center_card():
    game = new_game(R.REVEALER, R.SEER, R.WEREWOLF, R.VILLAGER, R.WEREWOLF, R.ROBBER)
    night_until(game, R.REVEALER)
    for targets in (["p0"], ["C0"]):
        with pytest.raises(RuleError) as error:
            game.night_action("p0", targets)
        assert error.value.code is ErrorCode.BAD_TARGETS


def test_revealer_and_village_idiot_wake_in_the_official_order():
    order = list(NIGHT_ORDER)
    assert order.index(R.TROUBLEMAKER) < order.index(R.VILLAGE_IDIOT) < order.index(R.DRUNK)
    assert order[-1] is R.REVEALER

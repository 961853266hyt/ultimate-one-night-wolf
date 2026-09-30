import pytest

from app.domain.rules import deaths, lynched, resolve, winning_teams
from app.domain.types import RoleId as R
from app.domain.types import Team

WOLF, MINION, TANNER, HUNTER, VILLAGER = R.WEREWOLF, R.MINION, R.TANNER, R.HUNTER, R.VILLAGER


def test_nobody_dies_when_nobody_gets_two_votes():
    assert lynched({"a": "b", "b": "c", "c": "a"}) == set()


def test_the_most_voted_die_and_ties_die_together():
    assert lynched({"a": "b", "b": "a", "c": "a", "d": "b"}) == {"a", "b"}
    assert lynched({"a": "b", "b": "a", "c": "b"}) == {"b"}


def test_the_hunter_takes_the_player_he_voted_for():
    cards = {"a": HUNTER, "b": VILLAGER, "c": WOLF}
    assert deaths(cards, {"a": "c", "b": "a", "c": "a"}) == {"a", "c"}


def test_hunters_chain():
    cards = {"a": HUNTER, "b": HUNTER, "c": VILLAGER, "d": VILLAGER}
    assert deaths(cards, {"a": "b", "b": "c", "c": "a", "d": "a"}) == {"a", "b", "c"}


@pytest.mark.parametrize(
    ("held", "dead", "expected"),
    [
        # 有狼在玩家手里
        ([WOLF, VILLAGER, VILLAGER], [0], [Team.VILLAGE]),
        ([WOLF, VILLAGER, VILLAGER], [1], [Team.WEREWOLF]),
        ([WOLF, VILLAGER, VILLAGER], [], [Team.WEREWOLF]),
        ([WOLF, MINION, VILLAGER], [1], [Team.WEREWOLF]),  # 爪牙出局不算狼出局
        ([WOLF, TANNER, VILLAGER], [1], [Team.TANNER]),  # 皮匠出局，狼不算赢
        ([WOLF, TANNER, VILLAGER], [0, 1], [Team.TANNER, Team.VILLAGE]),
        # 狼都在底牌里
        ([VILLAGER, VILLAGER, VILLAGER], [], [Team.VILLAGE]),
        ([VILLAGER, VILLAGER, VILLAGER], [0], []),
        ([MINION, VILLAGER, VILLAGER], [], [Team.VILLAGE]),
        ([MINION, VILLAGER, VILLAGER], [1], [Team.WEREWOLF]),
        ([MINION, VILLAGER, VILLAGER], [0], []),
        ([TANNER, VILLAGER, VILLAGER], [0], [Team.TANNER]),
    ],
)
def test_winning_teams(held, dead, expected):
    players = [f"p{i}" for i in range(len(held))]
    cards = dict(zip(players, held, strict=True))
    assert winning_teams(cards, players, {players[i] for i in dead}) == expected


def test_winners_are_decided_by_the_card_they_end_with():
    # p0 发到的是强盗，偷来了狼牌，所以算狼人阵营
    cards = {"p0": WOLF, "p1": R.ROBBER, "p2": VILLAGER}
    result = resolve(cards, ["p0", "p1", "p2"], {"p0": "p1", "p1": "p2", "p2": "p1"})
    assert result.deaths == ["p1"]
    assert result.winning_teams == [Team.WEREWOLF]
    assert result.winners == ["p0"]

from collections import Counter

import pytest

from app.domain.recommended import RECOMMENDED, recommended_deck
from app.domain.roles import ROLES
from app.domain.types import CENTER, MAX_PLAYERS, MIN_PLAYERS
from app.domain.types import RoleId as R

PLAYER_COUNTS = range(MIN_PLAYERS, MAX_PLAYERS + 1)


def test_every_player_count_has_a_recommended_deck():
    assert sorted(RECOMMENDED) == list(PLAYER_COUNTS)


@pytest.mark.parametrize("players", PLAYER_COUNTS)
def test_a_recommended_deck_fits_its_player_count(players: int):
    deck = recommended_deck(players)
    assert len(deck) == players + len(CENTER)
    assert all(count <= ROLES[role].max_copies for role, count in Counter(deck).items())


def test_rooms_outside_the_range_use_the_nearest_deck():
    assert recommended_deck(1) == RECOMMENDED[MIN_PLAYERS]
    assert recommended_deck(MAX_PLAYERS + 2) == RECOMMENDED[MAX_PLAYERS]


def test_changing_a_returned_deck_leaves_the_table_alone():
    recommended_deck(3).append(R.TANNER)
    assert R.TANNER not in RECOMMENDED[3]

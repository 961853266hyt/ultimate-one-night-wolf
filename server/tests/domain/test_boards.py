import random
from collections import Counter

import pytest

from app.domain.boards import BOARDS, BoardKind, board_of
from app.domain.commands import Configure
from app.domain.game import Game
from app.domain.recommended import recommended_deck
from app.domain.roles import ROLES
from app.domain.room import Room
from app.domain.types import CENTER, MAX_PLAYERS, MIN_PLAYERS, Phase, Settings, Timings
from app.domain.types import RoleId as R
from app.domain.views import view_for
from tests.domain.helpers import NoShuffle, skip

PLAYER_COUNTS = range(MIN_PLAYERS, MAX_PLAYERS + 1)


@pytest.mark.parametrize("board", BOARDS, ids=lambda board: board.id)
def test_a_board_is_a_legal_deck_for_its_player_count(board):
    assert len(board.deck) == board.seats + len(CENTER)
    copies = Counter(board.deck)
    assert all(count <= ROLES[role].max_copies for role, count in copies.items())
    assert copies[R.MASON] in (0, 2)  # 守夜人成对


@pytest.mark.parametrize("players", PLAYER_COUNTS)
def test_every_player_count_has_the_classic_board(players: int):
    [classic] = [b for b in BOARDS if b.seats == players and b.kind is BoardKind.CLASSIC]
    assert Counter(classic.deck) == Counter(recommended_deck(players))


@pytest.mark.parametrize("players", PLAYER_COUNTS)
def test_boards_for_the_same_player_count_can_be_told_apart(players: int):
    boards = [b for b in BOARDS if b.seats == players]
    for board in boards:
        assert board_of(players, board.deck) is board.kind
    decks = [frozenset(Counter(b.deck).items()) for b in boards]
    assert len(set(decks)) == len(decks)


def test_ids_are_unique():
    ids = [board.id for board in BOARDS]
    assert len(set(ids)) == len(ids)


def test_a_deck_of_your_own_is_no_board():
    assert board_of(3, [R.TANNER, R.SEER, R.VILLAGER, R.VILLAGER, R.VILLAGER, R.ROBBER]) is None
    # 牌一样、人数不一样也不算
    assert board_of(4, recommended_deck(3)) is None


@pytest.mark.parametrize("board", BOARDS, ids=lambda board: board.id)
@pytest.mark.parametrize("seed", range(3))
def test_every_board_plays_to_the_end(board, seed: int):
    players = [f"p{i}" for i in range(board.seats)]
    game = Game.deal(players, board.deck, Timings(), random.Random(seed))
    now = 0.0
    while game.phase is not Phase.REVEAL:
        if game.phase is Phase.DAY:
            for player in players:
                game.ready_to_vote(player, now)
        elif game.phase is Phase.VOTE:
            for i, player in enumerate(players):
                game.vote(player, players[(i + 1) % len(players)], now)
        else:
            now = skip(game)
    assert game.result is not None


def test_a_room_opened_from_a_board_uses_its_cards_and_settings():
    chaos = next(b for b in BOARDS if b.kind is BoardKind.CHAOS and b.seats == 5)
    room = Room.create("ABCD", "p0", "p0", 0, chaos.settings())
    view = view_for(room, "p0").room
    assert (view.seats, view.board, view.speech_rounds) == (5, BoardKind.CHAOS, 4)
    assert Counter(view.deck) == Counter(chaos.deck)


def test_the_classic_board_keeps_following_the_seat_count():
    classic = next(b for b in BOARDS if b.kind is BoardKind.CLASSIC and b.seats == 5)
    assert classic.settings().deck is None  # 和按人数推荐一样，改座位数时牌跟着换


def test_changing_the_cards_turns_a_board_into_your_own():
    chaos = next(b for b in BOARDS if b.kind is BoardKind.CHAOS and b.seats == 5)
    room = Room.create("ABCD", "p0", "p0", 0, chaos.settings())
    room.connect("p0", "p0", 0)
    deck = [R.TANNER if role is R.WITCH else role for role in chaos.deck]
    room.handle("p0", Configure(settings=Settings(seats=5, deck=deck)), 0, NoShuffle(0))
    assert view_for(room, "p0").room.board is None

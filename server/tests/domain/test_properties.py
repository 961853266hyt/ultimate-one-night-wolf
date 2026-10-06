"""随机牌堆、随机合法操作，打完整局，检查不管怎么玩都必须成立的性质。"""

import random
from collections import Counter

from hypothesis import given, settings
from hypothesis import strategies as st

from app.domain.commands import Configure, ConfirmCard, NightAction, ReadyToVote, Start, Vote
from app.domain.night import candidates
from app.domain.roles import ROLES
from app.domain.room import Room
from app.domain.types import CENTER, MAX_PLAYERS, MIN_PLAYERS, Phase, Settings
from app.domain.views import view_for
from tests.domain.helpers import new_room

ALL_CARDS = [role for role, spec in ROLES.items() for _ in range(spec.max_copies)]


@st.composite
def setups(draw) -> tuple[int, list, int]:
    n = draw(st.integers(MIN_PLAYERS, MAX_PLAYERS))
    deck = draw(st.permutations(ALL_CARDS))[: n + len(CENTER)]
    seed = draw(st.integers(0, 2**32))
    return n, deck, seed


def play(n: int, deck: list, seed: int) -> Room:
    rng = random.Random(seed)
    room = new_room(n)
    room.handle("p0", Configure(settings=Settings(deck=deck)), 0, rng)
    room.handle("p0", Start(), 0, rng)
    game = room.game
    assert game is not None

    now = 0.0
    while room.phase is not Phase.REVEAL:
        if room.phase is Phase.DEAL:
            for player in game.players:  # 看牌不限时，所有人都点了「我记住了」才入夜
                room.handle(player, ConfirmCard(), now, rng)
        if room.phase is Phase.NIGHT:
            for player in game.wakers():
                prompt = game.prompt_for(player)
                if prompt is None or rng.random() < 0.2:
                    continue
                option = rng.choice(prompt.options)
                targets = rng.sample(candidates(game.players, player, option), option.count)
                before = {p: view_for(room, p) for p in game.players}
                room.handle(player, NightAction(targets=targets), now, rng)
                # 夜间行动只改变行动者自己的视图，否则别人能察觉到「有人刚行动了」
                changed = [p for p in game.players if view_for(room, p) != before[p]]
                assert changed == [player]
        if room.phase is Phase.DAY:
            for player in game.players:  # 白天不限时，所有人都同意投票才往下走
                room.handle(player, ReadyToVote(), now, rng)
        if room.phase is Phase.VOTE:
            for player in game.players:
                target = rng.choice([p for p in game.players if p != player])
                room.handle(player, Vote(target=target), now, rng)
            continue

        deadline = room.next_deadline()
        assert deadline is not None
        now = deadline
        room.tick(now, rng)
        after = room.next_deadline()
        assert after is None or after > now  # 运行时不会空转
        assert Counter(game.cards.values()) == Counter(deck)  # 牌只会换位置，不会多也不会少

    return room


@settings(max_examples=200, deadline=None)
@given(setups())
def test_any_game_plays_through_with_invariants_intact(setup):
    room = play(*setup)
    game = room.game
    assert game is not None and game.result is not None
    assert set(game.result.deaths) <= set(game.players)
    assert set(game.result.winners) <= set(game.players)
    for player in game.players:
        assert view_for(room, player).result is not None


@settings(max_examples=50, deadline=None)
@given(setups())
def test_the_same_seed_plays_the_same_game(setup):
    assert play(*setup) == play(*setup)

import pytest

from app.domain.commands import Configure, NightAction, ReadyToVote, Start, Vote
from app.domain.errors import RuleError
from app.domain.recommended import recommended_deck
from app.domain.room import Room
from app.domain.types import Phase, SawCard, Settings
from app.domain.types import RoleId as R
from app.domain.views import view_for
from tests.domain.helpers import NoShuffle, new_room

RNG = NoShuffle(0)

# p0 强盗，p1 狼，p2 预言家；底牌：村民、捣蛋鬼、狼
DECK = [R.ROBBER, R.WEREWOLF, R.SEER, R.VILLAGER, R.TROUBLEMAKER, R.WEREWOLF]


def started_room() -> Room:
    room = new_room(3)
    room.handle("p0", Configure(settings=Settings(deck=DECK)), 0, RNG)
    room.handle("p0", Start(), 0, RNG)
    return room


def advance_to(room: Room, phase: Phase, step: R | None = None) -> None:
    game = room.game
    assert game is not None
    while game.phase is not phase or (step is not None and game.night_role is not step):
        if game.phase is Phase.DAY:
            for player in game.players:  # 白天不限时，所有人都同意投票才往下走
                room.handle(player, ReadyToVote(), 0, RNG)
            continue
        assert game.ends_at is not None
        room.tick(game.ends_at, RNG)


def test_the_lobby_shows_members_and_the_public_deck():
    view = view_for(new_room(3), "p1")
    assert view.phase is Phase.LOBBY
    assert [m.id for m in view.room.members] == ["p0", "p1", "p2"]
    assert view.room.deck == [R.WEREWOLF, R.WEREWOLF, R.SEER, R.ROBBER, R.TROUBLEMAKER, R.VILLAGER]
    assert view.room.auto_deck and view.room.recommended_deck == view.room.deck
    assert view.me.card is None


def test_the_lobby_keeps_the_recommended_deck_next_to_a_custom_one():
    room = new_room(3)
    room.handle("p0", Configure(settings=Settings(deck=DECK)), 0, RNG)
    view = view_for(room, "p1")
    assert view.room.deck == DECK
    assert not view.room.auto_deck
    assert view.room.recommended_deck == recommended_deck(3)


def test_you_always_see_the_card_you_were_dealt():
    room = started_room()
    advance_to(room, Phase.NIGHT, R.ROBBER)
    room.handle("p0", NightAction(targets=["p1"]), 0, RNG)  # 强盗偷走了 p1 的狼牌

    assert view_for(room, "p1").me.card is R.WEREWOLF
    assert view_for(room, "p0").me.card is R.ROBBER


def test_you_only_see_your_own_knowledge():
    room = started_room()
    advance_to(room, Phase.NIGHT, R.SEER)
    room.handle("p2", NightAction(targets=["p1"]), 0, RNG)

    assert view_for(room, "p2").me.knowledge == [SawCard(step=R.SEER, slot="p1", role=R.WEREWOLF)]
    assert all(fact.step is R.WEREWOLF for fact in view_for(room, "p1").me.knowledge)
    assert view_for(room, "p0").me.knowledge == []


def test_night_progress_is_public_but_the_prompt_is_private():
    room = started_room()
    advance_to(room, Phase.NIGHT, R.SEER)
    views = {p: view_for(room, p) for p in ("p0", "p1", "p2")}

    assert all(v.night is not None and v.night.step is R.SEER for v in views.values())
    assert views["p0"].night is not None and views["p0"].night.total == 4
    assert views["p2"].prompt is not None
    assert views["p0"].prompt is None and views["p1"].prompt is None


def test_votes_stay_secret_until_the_reveal():
    room = started_room()
    advance_to(room, Phase.VOTE)
    room.handle("p0", Vote(target="p1"), 0, RNG)

    other = view_for(room, "p2")
    assert other.vote is not None and other.vote.voted == ["p0"] and other.vote.mine is None
    mine = view_for(room, "p0")
    assert mine.vote is not None and mine.vote.mine == "p1"
    assert other.result is None


def test_the_reveal_opens_everything():
    room = started_room()
    advance_to(room, Phase.VOTE)
    for voter, target in [("p0", "p1"), ("p1", "p2"), ("p2", "p1")]:
        room.handle(voter, Vote(target=target), 0, RNG)

    result = view_for(room, "p0").result
    assert result is not None
    assert result.dealt["C2"] is R.WEREWOLF
    assert result.votes == {"p0": "p1", "p1": "p2", "p2": "p1"}
    assert result.deaths == ["p1"]


def test_the_deadline_is_sent_in_milliseconds():
    room = started_room()
    assert view_for(room, "p0").ends_at == 10_000


def test_non_members_get_no_view():
    with pytest.raises(RuleError):
        view_for(new_room(3), "stranger")

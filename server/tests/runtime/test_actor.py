import pytest

from app.domain.commands import Configure, ConfirmCard, Kick, NightAction, Start
from app.domain.errors import ErrorCode
from app.domain.room import Room
from app.domain.types import Phase, Settings
from app.domain.types import RoleId as R
from app.runtime.connection import Connection
from tests.runtime.fakes import FakeSocket, Harness, settle

pytestmark = pytest.mark.anyio


@pytest.fixture
async def harness():
    harness = Harness()
    yield harness
    await harness.close()


async def test_a_new_connection_receives_the_current_view(harness):
    await harness.join("p0")
    [frame] = harness.sockets["p0"].frames
    assert (frame["type"], frame["seq"], frame["view"]["phase"]) == ("state", 1, "lobby")
    assert frame["server_now"] == 1_000_000


async def test_a_second_tab_gets_its_own_snapshot(harness):
    await harness.join("p0")
    first = harness.sockets["p0"]
    await harness.join("p0")
    assert [f["seq"] for f in harness.sockets["p0"].frames] == [1]
    assert len(first.frames) == 1  # 第一个标签页没有收到多余的帧


async def test_nobody_new_joins_a_game_in_progress(harness):
    await harness.join("p0", "p1", "p2")
    await harness.send("p0", Start())
    error = await harness.actor.attach(Connection("late", FakeSocket()), "late")
    assert error is ErrorCode.GAME_IN_PROGRESS


async def test_a_night_action_reaches_only_the_player_who_acted(harness):
    await harness.join("p0", "p1", "p2")
    deck = [R.SEER, R.WEREWOLF, R.VILLAGER, R.ROBBER, R.DRUNK, R.WEREWOLF]
    await harness.send("p0", Configure(settings=Settings(deck=deck)))
    await harness.send("p0", Start())
    for player in ("p0", "p1", "p2"):
        await harness.send(player, ConfirmCard())
    await harness.advance()  # 狼的那一步结束，轮到预言家
    assert harness.room.game is not None and harness.room.game.night_role is R.SEER
    harness.clear()

    await harness.send("p0", NightAction(targets=["p1"]))

    assert len(harness.sockets["p0"].frames) == 1
    assert harness.sockets["p1"].frames == []
    assert harness.sockets["p2"].frames == []


async def test_a_rejected_command_only_answers_the_sender(harness):
    await harness.join("p0", "p1", "p2")
    harness.clear()
    await harness.send("p1", Start(), ref="r1")
    assert harness.sockets["p1"].frames == [{"type": "error", "code": "not_host", "ref": "r1"}]
    assert harness.sockets["p0"].frames == []
    assert harness.sockets["p2"].frames == []


async def test_the_clock_moves_the_game_forward(harness):
    await harness.join("p0", "p1", "p2")
    await harness.send("p0", Start())
    for player in ("p0", "p1", "p2"):
        await harness.send(player, ConfirmCard())
    await harness.advance()  # 夜里第一步到点
    assert {socket.view()["night"]["index"] for socket in harness.sockets.values()} == {2}


async def test_a_command_that_arrives_after_the_deadline_sees_the_new_phase(harness):
    await harness.join("p0", "p1", "p2")
    # 夜里只有狼这一步；p0 是独狼，可以看一张底牌
    deck = [R.WEREWOLF, R.VILLAGER, R.VILLAGER, R.VILLAGER, R.HUNTER, R.WEREWOLF]
    await harness.send("p0", Configure(settings=Settings(deck=deck)))
    await harness.send("p0", Start())
    for player in ("p0", "p1", "p2"):
        await harness.send(player, ConfirmCard())
    harness.clock.now += 60  # 狼的那一步早就该结束了，但 actor 还没醒
    await harness.send("p0", NightAction(targets=["C0"]))
    assert harness.sockets["p0"].errors() == ["wrong_phase"]
    assert harness.sockets["p0"].view()["phase"] == "day"


async def test_disconnecting_shows_you_offline_to_everyone_else(harness):
    await harness.join("p0", "p1", "p2")
    harness.actor.detach(harness.conns["p2"])
    await settle()
    members = harness.sockets["p0"].view()["room"]["members"]
    assert [m["online"] for m in members] == [True, True, False]


async def test_a_kicked_player_is_told_and_disconnected(harness):
    await harness.join("p0", "p1", "p2")
    await harness.send("p0", Kick(player="p2"))
    socket = harness.sockets["p2"]
    assert socket.frames[-1] == {"type": "error", "code": "removed", "ref": None}
    assert socket.closed


async def test_a_crashing_command_is_rolled_back_and_the_room_carries_on(harness, monkeypatch):
    await harness.join("p0", "p1", "p2")

    def crash(*args, **kwargs):
        raise RuntimeError("bug")

    monkeypatch.setattr(Room, "handle", crash)
    await harness.send("p0", Start())
    assert harness.sockets["p0"].frames[-1]["code"] == "internal"
    assert harness.room.phase is Phase.LOBBY

    monkeypatch.undo()
    await harness.send("p0", Start())
    assert harness.room.phase is Phase.DEAL


async def test_a_room_whose_clock_breaks_is_closed(harness, monkeypatch):
    await harness.join("p0")

    def crash(*args, **kwargs):
        raise RuntimeError("bug")

    monkeypatch.setattr(Room, "tick", crash)
    harness.actor.poke()
    await settle()
    assert harness.exited and harness.actor.closed
    assert harness.sockets["p0"].frames[-1]["code"] == "internal"
    assert harness.sockets["p0"].closed


async def test_a_room_everyone_has_left_closes_itself(harness):
    await harness.join("p0")
    harness.actor.detach(harness.conns["p0"])
    await settle()
    await harness.advance(to=harness.clock.now + 599)
    assert not harness.exited
    await harness.advance(to=harness.clock.now + 1)
    assert harness.exited
    error = await harness.actor.attach(Connection("p0", FakeSocket()), "p0")
    assert error == "room_not_found"

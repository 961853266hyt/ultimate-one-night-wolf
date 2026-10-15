"""房主替机器人操作：一条连接临时换成机器人的身份，收机器人的视图，指令也算机器人的。"""

import pytest

from app.domain.commands import AddBots, ConfirmCard, EndStep, Leave, ReadyToVote, Start, Vote
from app.domain.types import Phase
from tests.runtime.fakes import Harness

pytestmark = pytest.mark.anyio


@pytest.fixture
async def harness():
    harness = Harness()
    yield harness
    await harness.close()


async def test_the_host_sees_and_acts_as_a_bot(harness):
    await harness.join("p0")
    await harness.send("p0", AddBots())
    await harness.send("p0", Start())  # 不洗牌：p0 和 bot-1 是狼，一定会投票
    await harness.send("p0", ConfirmCard())  # 机器人自己已经记住了，入夜
    while harness.room.phase is Phase.NIGHT:
        await harness.send("p0", EndStep())
    await harness.send("p0", ReadyToVote())  # 机器人自己已经同意了，开始投票

    await harness.act_as("p0", "bot-1")
    assert harness.sockets["p0"].view()["me"]["id"] == "bot-1"
    await harness.send("p0", Vote(target="p0"))
    assert harness.room.game is not None and harness.room.game.votes == {"bot-1": "p0"}


async def test_a_bot_cannot_do_what_only_the_host_can(harness):
    await harness.join("p0")
    await harness.act_as("p0", None)
    await harness.send("p0", AddBots())
    await harness.act_as("p0", "bot-1")
    harness.clear()
    await harness.send("p0", Start())
    assert harness.sockets["p0"].errors() == ["not_host"]


async def test_only_the_host_can_act_as_a_bot(harness):
    await harness.join("p0", "p1")
    await harness.send("p0", AddBots())
    harness.clear()

    await harness.act_as("p1", "bot-1")
    assert harness.sockets["p1"].errors() == ["not_host"]
    await harness.send("p1", ConfirmCard())  # 还是 p1 自己，不是机器人
    assert harness.sockets["p1"].errors()[-1] == "wrong_phase"


async def test_a_bot_that_leaves_sends_its_controller_back_to_itself(harness):
    await harness.join("p0")
    await harness.send("p0", AddBots())
    await harness.act_as("p0", "bot-1")
    await harness.send("p0", Leave())

    socket = harness.sockets["p0"]
    assert harness.room.member("bot-1") is None
    assert not socket.closed
    assert socket.view()["me"]["id"] == "p0"


async def test_the_host_can_switch_back_to_itself(harness):
    await harness.join("p0")
    await harness.send("p0", AddBots())
    await harness.act_as("p0", "bot-2")
    await harness.act_as("p0", None)
    assert harness.sockets["p0"].view()["me"]["id"] == "p0"

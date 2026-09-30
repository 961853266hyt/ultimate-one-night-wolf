import asyncio
import json
from typing import Any

from app.domain.commands import Command
from app.domain.room import Room
from app.runtime.actor import RoomActor
from app.runtime.connection import Connection
from tests.domain.helpers import NoShuffle


class FakeSocket:
    def __init__(self) -> None:
        self.frames: list[dict[str, Any]] = []
        self.closed = False

    async def send_text(self, data: str) -> None:
        self.frames.append(json.loads(data))

    async def close(self, code: int = 1000) -> None:
        self.closed = True

    def states(self) -> list[dict[str, Any]]:
        return [frame for frame in self.frames if frame["type"] == "state"]

    def errors(self) -> list[str]:
        return [frame["code"] for frame in self.frames if frame["type"] == "error"]

    def view(self) -> dict[str, Any]:
        return self.states()[-1]["view"]


class FakeClock:
    def __init__(self, now: float = 1000.0) -> None:
        self.now = now

    def __call__(self) -> float:
        return self.now


async def settle() -> None:
    """让 actor 和各条连接的发送任务把手头的事做完。"""
    await asyncio.sleep(0.01)


class Harness:
    """一个跑起来的 RoomActor，p0 开的房；每个玩家一条假连接。"""

    def __init__(self) -> None:
        self.clock = FakeClock()
        self.exited = False
        self.actor = RoomActor(
            Room.create("ABCD", "p0", "p0", self.clock()), self.clock, NoShuffle(0)
        )
        self.actor.start(on_exit=self._on_exit)
        self.sockets: dict[str, FakeSocket] = {}
        self.conns: dict[str, Connection] = {}
        self._writers: list[asyncio.Task[None]] = []

    @property
    def room(self) -> Room:
        return self.actor.room

    async def join(self, *players: str) -> None:
        for player in players:
            socket = FakeSocket()
            conn = Connection(player, socket)
            self._writers.append(asyncio.create_task(conn.run()))
            assert await self.actor.attach(conn, player) is None
            self.sockets[player], self.conns[player] = socket, conn
        await settle()

    async def send(self, player: str, command: Command, ref: str | None = None) -> None:
        self.actor.post(self.conns[player], command, ref)
        await settle()

    async def advance(self, to: float | None = None) -> None:
        """把时钟拨到 to（默认是下一个截止时间），让 actor 结算。"""
        deadline = self.room.next_deadline()
        assert to is not None or deadline is not None
        self.clock.now = to if to is not None else deadline
        self.actor.poke()
        await settle()

    def clear(self) -> None:
        for socket in self.sockets.values():
            socket.frames.clear()

    def _on_exit(self) -> None:
        self.exited = True

    async def close(self) -> None:
        await self.actor.stop()
        for writer in self._writers:
            writer.cancel()

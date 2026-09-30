"""RoomActor：一个房间的运行时。

这个房间的所有消息（进房、断开、玩家指令、倒计时）都进同一个收件箱，按顺序处理，
所以不需要锁。每次改动都在房间状态的副本上执行，成功才替换，出错就当没发生过。
处理完一条消息，给每个在线的人渲染视图，只把变了的推出去。
"""

import asyncio
import logging
import random
from collections.abc import Callable
from contextlib import suppress
from dataclasses import dataclass

from ..domain.commands import Command
from ..domain.errors import ErrorCode, RuleError
from ..domain.room import Room
from ..domain.types import PlayerId
from ..domain.views import PlayerView, view_for
from ..protocol import ProtocolErrorCode, StateMessage
from .connection import Connection

log = logging.getLogger(__name__)

AnyErrorCode = ErrorCode | ProtocolErrorCode


@dataclass
class _Attach:
    conn: Connection
    name: str
    done: asyncio.Future[AnyErrorCode | None]


@dataclass
class _Detach:
    conn: Connection


@dataclass
class _Act:
    conn: Connection
    command: Command
    ref: str | None


_Message = _Attach | _Detach | _Act | None  # None：没有新消息，只检查倒计时


class RoomActor:
    def __init__(self, room: Room, clock: Callable[[], float], rng: random.Random) -> None:
        self.room = room
        self.closed = False
        self._clock = clock
        self._rng = rng
        self._inbox: asyncio.Queue[_Message] = asyncio.Queue()
        self._connections: dict[PlayerId, set[Connection]] = {}
        self._fresh: set[Connection] = set()  # 刚连上、还没收到过快照的连接
        self._sent: dict[PlayerId, PlayerView] = {}  # 上一次发给每个人的视图
        self._seq: dict[PlayerId, int] = {}
        self._task: asyncio.Task[None] | None = None

    # ------------------------------------------------------------ 生命周期

    def start(self, on_exit: Callable[[], None]) -> None:
        self._task = asyncio.create_task(self._run(), name=f"room {self.room.code}")
        self._task.add_done_callback(lambda _: on_exit())

    async def stop(self) -> None:
        if self._task is not None:
            self._task.cancel()
            with suppress(asyncio.CancelledError):
                await self._task

    # ------------------------------------------------------------ 往收件箱里放消息

    async def attach(self, conn: Connection, name: str) -> AnyErrorCode | None:
        """进房或重连。成功返回 None，否则返回错误码。"""
        if self.closed:
            return ProtocolErrorCode.ROOM_NOT_FOUND
        done: asyncio.Future[AnyErrorCode | None] = asyncio.get_running_loop().create_future()
        self._inbox.put_nowait(_Attach(conn, name, done))
        return await done

    def detach(self, conn: Connection) -> None:
        self._inbox.put_nowait(_Detach(conn))

    def post(self, conn: Connection, command: Command, ref: str | None = None) -> None:
        self._inbox.put_nowait(_Act(conn, command, ref))

    def poke(self) -> None:
        """立刻检查一次倒计时。"""
        self._inbox.put_nowait(None)

    # ------------------------------------------------------------ 主循环

    async def _run(self) -> None:
        reason = ProtocolErrorCode.ROOM_NOT_FOUND
        try:
            while True:
                message = await self._next_message()
                if message is None and self._expired():
                    return
                if not self._process(message):
                    reason = ProtocolErrorCode.INTERNAL
                    return
                self._publish()
        finally:
            self.closed = True
            self._shut_down(reason)

    async def _next_message(self) -> _Message:
        deadlines = [
            t for t in (self.room.next_deadline(), self.room.expires_at()) if t is not None
        ]
        timeout = max(0.0, min(deadlines) - self._clock()) if deadlines else None
        try:
            return await asyncio.wait_for(self._inbox.get(), timeout)
        except TimeoutError:
            return None

    def _expired(self) -> bool:
        expires_at = self.room.expires_at()
        return expires_at is not None and self._clock() >= expires_at

    def _process(self, message: _Message) -> bool:
        """处理一条消息。返回 False 表示这个房间的倒计时坏了，只能关掉。"""
        now = self._clock()
        # 先结算到期的倒计时，再处理消息：截止之后才到的投票会被拒绝
        if self._transact(lambda room: room.tick(now, self._rng)) is not None:
            if isinstance(message, _Attach):
                _resolve(message.done, ProtocolErrorCode.INTERNAL)
            return False

        match message:
            case _Attach(conn=conn, name=name, done=done):
                error = self._transact(lambda room: room.connect(conn.player, name, now))
                if error is None:
                    self._connections.setdefault(conn.player, set()).add(conn)
                    self._fresh.add(conn)
                _resolve(done, error)
            case _Detach(conn=conn):
                self._detach(conn, now)
            case _Act(conn=conn, command=command, ref=ref):
                error = self._transact(
                    lambda room: room.handle(conn.player, command, now, self._rng)
                )
                if error is not None:
                    conn.send_error(error, ref)

        self._drop_removed()
        return True

    def _transact(self, change: Callable[[Room], None]) -> AnyErrorCode | None:
        """在副本上执行 change，成功才替换当前状态。"""
        draft = self.room.model_copy(deep=True)
        try:
            change(draft)
        except RuleError as error:
            return error.code
        except Exception:
            log.exception("room %s: unexpected error", self.room.code)
            return ProtocolErrorCode.INTERNAL
        self.room = draft
        return None

    def _detach(self, conn: Connection, now: float) -> None:
        conns = self._connections.get(conn.player)
        if conns is None or conn not in conns:
            return
        conns.discard(conn)
        self._fresh.discard(conn)
        if not conns:
            # 同一个人可能开了几个标签页，最后一条断开才算离线
            del self._connections[conn.player]
            self._transact(lambda room: room.disconnect(conn.player, now))

    def _drop_removed(self) -> None:
        """被踢出或者离开了房间的人：关掉他们的连接。"""
        for player in [p for p in self._connections if self.room.member(p) is None]:
            for conn in self._connections.pop(player):
                self._fresh.discard(conn)
                conn.close(ProtocolErrorCode.REMOVED)
            self._sent.pop(player, None)
            self._seq.pop(player, None)

    def _publish(self) -> None:
        """只给视图变了的人发帧，否则别人能从「收到了一帧」察觉到私密的变化。"""
        now_ms = round(self._clock() * 1000)
        for player, conns in self._connections.items():
            view = view_for(self.room, player)
            if view != self._sent.get(player):
                self._sent[player] = view
                self._seq[player] = self._seq.get(player, 0) + 1
                targets = conns
            else:
                targets = conns & self._fresh
            if targets:
                message = StateMessage(seq=self._seq[player], server_now=now_ms, view=view)
                frame = message.model_dump_json()
                for conn in targets:
                    conn.send_state(frame)
        self._fresh.clear()

    def _shut_down(self, reason: ProtocolErrorCode) -> None:
        for conns in self._connections.values():
            for conn in conns:
                conn.close(reason)
        self._connections.clear()
        while not self._inbox.empty():
            message = self._inbox.get_nowait()
            if isinstance(message, _Attach):
                _resolve(message.done, ProtocolErrorCode.ROOM_NOT_FOUND)


def _resolve(done: asyncio.Future[AnyErrorCode | None], error: AnyErrorCode | None) -> None:
    if not done.done():  # 等结果的那一方可能已经断开了
        done.set_result(error)

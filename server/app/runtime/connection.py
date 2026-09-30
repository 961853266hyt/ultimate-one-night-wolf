"""一条 WebSocket 连接的发送端。"""

import asyncio
import logging
from collections import deque
from typing import Protocol

from ..domain.errors import ErrorCode
from ..domain.types import PlayerId
from ..protocol import ErrorMessage, ProtocolErrorCode

log = logging.getLogger(__name__)


class Socket(Protocol):
    async def send_text(self, data: str) -> None: ...

    async def close(self, code: int = 1000) -> None: ...


class Connection:
    """actor 只往这里放消息，从不等待网络；真正的发送由 run() 完成。

    快照只保留最新的一帧：还没发出去就被新的覆盖，反正每一帧都是完整视图。
    错误消息按顺序逐条发送。
    """

    def __init__(self, player: PlayerId, socket: Socket) -> None:
        self.player = player
        self._socket = socket
        self._state: str | None = None
        self._errors: deque[str] = deque()
        self._closing = False
        self._wake = asyncio.Event()

    def send_state(self, frame: str) -> None:
        self._state = frame
        self._wake.set()

    def send_error(self, code: ErrorCode | ProtocolErrorCode, ref: str | None = None) -> None:
        self._errors.append(ErrorMessage(code=code, ref=ref).model_dump_json())
        self._wake.set()

    def close(self, code: ErrorCode | ProtocolErrorCode | None = None) -> None:
        """把手头的消息（以及 code 对应的错误）发完，然后关闭连接。"""
        if code is not None:
            self.send_error(code)
        self._closing = True
        self._wake.set()

    async def run(self) -> None:
        try:
            while True:
                await self._wake.wait()
                self._wake.clear()
                while self._errors:
                    await self._socket.send_text(self._errors.popleft())
                if self._state is not None:
                    frame, self._state = self._state, None
                    await self._socket.send_text(frame)
                if self._closing:
                    await self._socket.close()
                    return
        except Exception:
            # 发送失败说明对方已经断开，读取那一侧会负责收尾
            log.debug("sending to %s failed", self.player, exc_info=True)

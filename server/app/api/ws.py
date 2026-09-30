"""WebSocket：进房之后的一切。

首帧必须是 hello → 校验 token → 交给房间的 actor → 之后每一帧都是一条指令。
"""

import asyncio
import json
from collections.abc import AsyncIterator
from contextlib import suppress

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from pydantic import TypeAdapter, ValidationError

from ..domain.commands import Command
from ..protocol import ErrorMessage, Hello, ProtocolErrorCode
from ..runtime.actor import RoomActor
from ..runtime.connection import Connection

HELLO_TIMEOUT = 10  # 秒

router = APIRouter()
_commands: TypeAdapter[Command] = TypeAdapter(Command)


@router.websocket("/ws/rooms/{code}")
async def room_socket(ws: WebSocket, code: str) -> None:
    await ws.accept()
    hello = await _receive_hello(ws)
    if hello is None:
        return await _reject(ws, ProtocolErrorCode.BAD_MESSAGE)
    player = ws.app.state.auth.verify(hello.token)
    if player is None:
        return await _reject(ws, ProtocolErrorCode.BAD_TOKEN)
    actor: RoomActor | None = ws.app.state.manager.get(code)
    if actor is None:
        return await _reject(ws, ProtocolErrorCode.ROOM_NOT_FOUND)

    conn = Connection(player, ws)
    writer = asyncio.create_task(conn.run())
    error = await actor.attach(conn, hello.name)
    if error is not None:
        conn.close(error)
        await writer
        return
    try:
        async for text in _texts(ws):
            _relay(text, conn, actor)
    finally:
        actor.detach(conn)
        writer.cancel()


async def _receive_hello(ws: WebSocket) -> Hello | None:
    try:
        async with asyncio.timeout(HELLO_TIMEOUT):
            message = await ws.receive()
        return Hello.model_validate_json(message["text"])
    except (TimeoutError, KeyError, ValidationError):
        return None


async def _texts(ws: WebSocket) -> AsyncIterator[str]:
    """逐条读文本帧，对方断开时结束。"""
    while True:
        message = await ws.receive()
        if message["type"] == "websocket.disconnect":
            return
        if (text := message.get("text")) is not None:
            yield text


def _relay(text: str, conn: Connection, actor: RoomActor) -> None:
    try:
        raw = json.loads(text)
        command = _commands.validate_python(raw)
    except (json.JSONDecodeError, ValidationError):
        conn.send_error(ProtocolErrorCode.BAD_MESSAGE)
        return
    ref = raw.get("ref")
    actor.post(conn, command, ref if isinstance(ref, str) else None)


async def _reject(ws: WebSocket, code: ProtocolErrorCode) -> None:
    with suppress(WebSocketDisconnect, RuntimeError):
        await ws.send_text(ErrorMessage(code=code).model_dump_json())
        await ws.close()

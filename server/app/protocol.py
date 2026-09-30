"""线上消息格式：客户端发什么、服务端回什么。

前端的 TypeScript 类型由这里导出的 JSON Schema 生成（在 web/ 下运行 pnpm gen:types）。
"""

import json
from enum import StrEnum
from typing import Annotated, Any, Literal

from pydantic import BaseModel, Field, StringConstraints

from .domain.commands import (
    Configure,
    ConfirmCard,
    Kick,
    Leave,
    NightAction,
    ReadyToVote,
    Rematch,
    Start,
    Vote,
)
from .domain.errors import ErrorCode
from .domain.views import PlayerView

Name = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=16)]


class Hello(BaseModel):
    """WebSocket 连上之后的第一帧：还不是成员就加入，已经是成员就恢复。"""

    type: Literal["hello"] = "hello"
    token: str
    name: Name


# 客户端之后发的每一帧都是 domain 里的一条指令，见 domain/commands.py
ClientMessage = Annotated[
    Hello
    | Configure
    | Kick
    | Start
    | Leave
    | ConfirmCard
    | NightAction
    | ReadyToVote
    | Vote
    | Rematch,
    Field(discriminator="type"),
]


class ProtocolErrorCode(StrEnum):
    """游戏规则以外的错误。"""

    BAD_MESSAGE = "bad_message"
    BAD_TOKEN = "bad_token"
    ROOM_NOT_FOUND = "room_not_found"
    REMOVED = "removed"  # 被踢出或者离开了房间
    INTERNAL = "internal"


class StateMessage(BaseModel):
    type: Literal["state"] = "state"
    seq: int  # 每个玩家独立递增
    server_now: int  # 毫秒时间戳，客户端用它校正本机时钟
    view: PlayerView


class ErrorMessage(BaseModel):
    type: Literal["error"] = "error"
    code: ErrorCode | ProtocolErrorCode
    ref: str | None = None  # 原样带回出错那条指令里的 ref


ServerMessage = Annotated[StateMessage | ErrorMessage, Field(discriminator="type")]


def json_schema() -> dict[str, Any]:
    """整份协议的 JSON Schema，给 json-schema-to-typescript 用。"""

    class Protocol(BaseModel):
        client: ClientMessage
        server: ServerMessage

    root = Protocol.model_json_schema(mode="serialization")
    defs = root["$defs"]
    defs["ClientMessage"] = {**root["properties"]["client"], "title": "ClientMessage"}
    defs["ServerMessage"] = {**root["properties"]["server"], "title": "ServerMessage"}
    schema = {
        "title": "Protocol",
        "anyOf": [{"$ref": "#/$defs/ClientMessage"}, {"$ref": "#/$defs/ServerMessage"}],
        "$defs": defs,
    }
    _tidy(schema)
    return schema


def _tidy(node: Any, named: bool = False) -> None:
    """让生成的 TS 类型更干净。

    - 所有字段都标为必填：两边发送时字段总是齐全的
    - 字段上的 title 会被生成成一堆多余的类型别名，去掉；只保留 $defs 里模型的名字
    - prefixItems（元组）换成 json-schema-to-typescript 认识的旧写法
    """
    if isinstance(node, list):
        for item in node:
            _tidy(item)
        return
    if not isinstance(node, dict):
        return
    if not named:
        node.pop("title", None)
    node.pop("default", None)
    if "properties" in node:
        node["required"] = list(node["properties"])
    if "prefixItems" in node:
        items = node.pop("prefixItems")
        node.update(items=items, minItems=len(items), maxItems=len(items))
    for key, value in node.items():
        if key == "$defs":
            for definition in value.values():
                _tidy(definition, named=True)
        elif key == "properties":
            for field in value.values():
                _tidy(field)
        else:
            _tidy(value)


if __name__ == "__main__":
    print(json.dumps(json_schema(), ensure_ascii=False, indent=2))

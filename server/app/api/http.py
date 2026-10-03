"""HTTP 接口：访客身份、开房、查询。房间里的一切都走 WebSocket，见 ws.py。"""

from typing import Annotated

from fastapi import APIRouter, Depends, Header, HTTPException, Request
from pydantic import BaseModel

from ..domain.night import NIGHT_ORDER
from ..domain.roles import ROLES
from ..domain.types import MAX_PLAYERS, Phase, PlayerId, RoleId, Team
from ..protocol import Name, ProtocolErrorCode
from ..runtime.manager import RoomManager
from .auth import Auth

router = APIRouter(prefix="/api")


class SessionOut(BaseModel):
    player_id: PlayerId
    token: str


class CreateRoomIn(BaseModel):
    name: Name


class CreateRoomOut(BaseModel):
    code: str


class RoomSummary(BaseModel):
    code: str
    phase: Phase
    players: int
    joinable: bool


class RoleInfo(BaseModel):
    id: RoleId
    team: Team
    night_order: int | None  # 夜里第几个醒，从 1 开始；None 表示夜里不醒
    max_copies: int


def _auth(request: Request) -> Auth:
    return request.app.state.auth


def _manager(request: Request) -> RoomManager:
    return request.app.state.manager


def _bearer(authorization: str | None) -> str | None:
    scheme, _, token = (authorization or "").partition(" ")
    return token if scheme.lower() == "bearer" and token else None


def current_player(
    request: Request, authorization: Annotated[str | None, Header()] = None
) -> PlayerId:
    token = _bearer(authorization)
    player = _auth(request).verify(token) if token else None
    if player is None:
        raise HTTPException(401, ProtocolErrorCode.BAD_TOKEN)
    return player


@router.post("/session")
async def session(
    request: Request, authorization: Annotated[str | None, Header()] = None
) -> SessionOut:
    """带着有效 token 调用时原样返回，否则发一个新的访客身份。"""
    auth = _auth(request)
    token = _bearer(authorization)
    if token is not None and (player := auth.verify(token)) is not None:
        return SessionOut(player_id=player, token=token)
    player, token = auth.issue()
    return SessionOut(player_id=player, token=token)


@router.post("/rooms")
async def create_room(
    body: CreateRoomIn,
    request: Request,
    player: Annotated[PlayerId, Depends(current_player)],
) -> CreateRoomOut:
    code = _manager(request).create(player, body.name)
    if code is None:
        raise HTTPException(503, "too_many_rooms")
    return CreateRoomOut(code=code)


@router.get("/rooms/{code}")
async def room_summary(code: str, request: Request) -> RoomSummary:
    actor = _manager(request).get(code)
    if actor is None:
        raise HTTPException(404, ProtocolErrorCode.ROOM_NOT_FOUND)
    room = actor.room
    joinable = room.phase in (Phase.LOBBY, Phase.REVEAL) and len(room.members) < MAX_PLAYERS
    return RoomSummary(
        code=room.code, phase=room.phase, players=len(room.members), joinable=joinable
    )


@router.get("/roles")
async def roles() -> list[RoleInfo]:
    return [
        RoleInfo(id=r.id, team=r.team, night_order=_night_order(r.id), max_copies=r.max_copies)
        for r in ROLES.values()
    ]


def _night_order(role: RoleId) -> int | None:
    return NIGHT_ORDER.index(role) + 1 if role in NIGHT_ORDER else None

"""HTTP 接口：访客身份、开房、查询。房间里的一切都走 WebSocket，见 ws.py。"""

from typing import Annotated

from fastapi import APIRouter, Depends, Header, HTTPException, Request
from pydantic import BaseModel

from ..domain.boards import BOARDS, BOARDS_BY_ID, BoardKind, board_of
from ..domain.night import NIGHT_ORDER
from ..domain.roles import ROLES
from ..domain.types import MAX_MEMBERS, Phase, PlayerId, RoleId, Team
from ..protocol import Name, ProtocolErrorCode
from ..runtime.manager import RoomManager
from .auth import Auth

router = APIRouter(prefix="/api")


class SessionOut(BaseModel):
    player_id: PlayerId
    token: str


class CreateRoomIn(BaseModel):
    name: Name
    board: str | None = None  # 从首页的板子开房：板子的 id，比如 chaos-5


class CreateRoomOut(BaseModel):
    code: str


class RoomSummary(BaseModel):
    code: str
    phase: Phase
    players: int
    joinable: bool


class OpenRoom(BaseModel):
    """「房间」列表里的一个房间：谁开的、来了几个人、配了什么牌。"""

    code: str
    host: str  # 房主的名字
    phase: Phase  # lobby 是等开局，reveal 是一局刚结束、等下一局
    players: int
    seats: int
    deck: list[RoleId]
    board: BoardKind | None  # 用的是哪个板子，房主自己配的牌是 None


class BoardOut(BaseModel):
    """首页的一个板子。名字和标签前端按 kind 翻译。"""

    id: str
    kind: BoardKind
    seats: int
    deck: list[RoleId]
    signature: RoleId  # 招牌角色，卡片上放它的大卡图


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
    board = None
    if body.board is not None and (board := BOARDS_BY_ID.get(body.board)) is None:
        raise HTTPException(422, "unknown_board")
    code = _manager(request).create(player, body.name, board.settings() if board else None)
    if code is None:
        raise HTTPException(503, "too_many_rooms")
    return CreateRoomOut(code=code)


@router.get("/rooms")
async def open_rooms(request: Request) -> list[OpenRoom]:
    """现在能加入的房间，快坐满的排前面。不用身份就能看。"""
    rooms = [actor.room for actor in _manager(request).all() if not actor.closed]
    listed = [room for room in rooms if room.is_open()]
    listed.sort(key=lambda room: (room.settings.seats - len(room.seated()), room.code))
    return [
        OpenRoom(
            code=room.code,
            host=host.name if (host := room.member(room.host)) else "",
            phase=room.phase,
            players=len(room.seated()),
            seats=room.settings.seats,
            deck=room.deck(),
            board=board_of(room.settings.seats, room.deck()),
        )
        for room in listed
    ]


@router.get("/boards")
async def boards() -> list[BoardOut]:
    """首页的板子，按玩法、人数排好。"""
    return [
        BoardOut(
            id=board.id,
            kind=board.kind,
            seats=board.seats,
            deck=board.deck,
            signature=board.signature,
        )
        for board in BOARDS
    ]


@router.get("/rooms/{code}")
async def room_summary(code: str, request: Request) -> RoomSummary:
    actor = _manager(request).get(code)
    if actor is None:
        raise HTTPException(404, ProtocolErrorCode.ROOM_NOT_FOUND)
    room = actor.room
    joinable = len(room.members) < MAX_MEMBERS  # 坐满了、正在打也能进来，先坐观战席
    return RoomSummary(
        code=room.code, phase=room.phase, players=len(room.seated()), joinable=joinable
    )


@router.get("/roles")
async def roles() -> list[RoleInfo]:
    return [
        RoleInfo(id=r.id, team=r.team, night_order=_night_order(r.id), max_copies=r.max_copies)
        for r in ROLES.values()
    ]


def _night_order(role: RoleId) -> int | None:
    return NIGHT_ORDER.index(role) + 1 if role in NIGHT_ORDER else None

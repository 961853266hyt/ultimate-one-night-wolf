"""端到端：真的开 WebSocket。规则和计时的细节在 domain 和 runtime 的测试里。"""

from collections.abc import Callable, Iterator
from contextlib import contextmanager
from typing import Any

import pytest
from fastapi.testclient import TestClient
from starlette.websockets import WebSocketDisconnect

from app.config import Config
from app.main import create_app


@pytest.fixture
def client():
    with TestClient(create_app(Config(secret_key="test"))) as client:
        yield client


def open_room(client: TestClient, players: int) -> tuple[str, list[dict[str, str]]]:
    sessions = [client.post("/api/session").json() for _ in range(players)]
    headers = {"Authorization": f"Bearer {sessions[0]['token']}"}
    code = client.post("/api/rooms", json={"name": "p0"}, headers=headers).json()["code"]
    return code, sessions


@contextmanager
def connect(client: TestClient, code: str, session: dict[str, str], name: str) -> Iterator[Any]:
    with client.websocket_connect(f"/ws/rooms/{code}") as ws:
        ws.send_json({"type": "hello", "token": session["token"], "name": name})
        yield ws


def next_view(ws: Any, until: Callable[[dict[str, Any]], bool] = lambda view: True) -> dict:
    while True:
        frame = ws.receive_json()
        if frame["type"] == "state" and until(frame["view"]):
            return frame["view"]


def next_error(ws: Any) -> str:
    while True:
        frame = ws.receive_json()
        if frame["type"] == "error":
            return frame["code"]


def test_players_join_and_the_host_deals_everyone_their_own_card(client):
    code, sessions = open_room(client, 3)
    with (
        connect(client, code, sessions[0], "p0") as ws0,
        connect(client, code, sessions[1], "p1") as ws1,
        connect(client, code, sessions[2], "p2") as ws2,
    ):
        sockets = [ws0, ws1, ws2]
        for ws in sockets:
            next_view(ws, until=lambda view: len(view["room"]["members"]) == 3)

        ws0.send_json({"type": "start"})
        views = [next_view(ws, until=lambda view: view["phase"] == "deal") for ws in sockets]

        game = client.app.state.manager.get(code).room.game
        for session, view in zip(sessions, views, strict=True):
            assert view["me"]["card"] == game.dealt[session["player_id"]]


def test_a_bad_token_is_refused(client):
    code, sessions = open_room(client, 1)
    forged = {"token": sessions[0]["player_id"] + ".forged"}
    with connect(client, code, forged, "p0") as ws:
        assert next_error(ws) == "bad_token"
        with pytest.raises(WebSocketDisconnect):
            ws.receive_json()


def test_an_unknown_room_is_refused(client):
    _, sessions = open_room(client, 1)
    with connect(client, "ZZZZ", sessions[0], "p0") as ws:
        assert next_error(ws) == "room_not_found"


def test_the_first_frame_must_be_hello(client):
    code, _ = open_room(client, 1)
    with client.websocket_connect(f"/ws/rooms/{code}") as ws:
        ws.send_json({"type": "start"})
        assert next_error(ws) == "bad_message"


def test_a_malformed_command_is_rejected_but_the_connection_survives(client):
    code, sessions = open_room(client, 1)
    with connect(client, code, sessions[0], "p0") as ws:
        next_view(ws)
        ws.send_text("not json")
        assert next_error(ws) == "bad_message"
        ws.send_json({"type": "start", "ref": "r1"})
        assert ws.receive_json() == {"type": "error", "code": "player_count", "ref": "r1"}


def test_reconnecting_puts_you_back_in_your_seat(client):
    code, sessions = open_room(client, 3)
    with (
        connect(client, code, sessions[0], "p0") as ws0,
        connect(client, code, sessions[1], "p1") as ws1,
        connect(client, code, sessions[2], "p2") as ws2,
    ):
        next_view(ws2, until=lambda view: len(view["room"]["members"]) == 3)
        ws0.send_json({"type": "start"})
        before = next_view(ws1, until=lambda view: view["phase"] == "deal")

    with connect(client, code, sessions[1], "p1") as ws1:
        after = next_view(ws1)
        assert after["me"] == before["me"]
        assert after["phase"] == "deal"

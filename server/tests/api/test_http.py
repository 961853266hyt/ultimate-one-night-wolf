import pytest
from fastapi.testclient import TestClient

from app.config import Config
from app.domain.types import RoleId
from app.main import create_app


@pytest.fixture
def client():
    with TestClient(create_app(Config(secret_key="test"))) as client:
        yield client


def bearer(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


def test_a_new_visitor_gets_an_identity(client):
    session = client.post("/api/session").json()
    assert session["player_id"].startswith("p_")
    assert session["token"].startswith(session["player_id"] + ".")


def test_a_valid_token_keeps_its_identity(client):
    first = client.post("/api/session").json()
    assert client.post("/api/session", headers=bearer(first["token"])).json() == first


def test_a_forged_token_gets_a_fresh_identity(client):
    first = client.post("/api/session").json()
    forged = client.post("/api/session", headers=bearer(first["player_id"] + ".forged")).json()
    assert forged["player_id"] != first["player_id"]


def test_opening_a_room_needs_an_identity(client):
    assert client.post("/api/rooms", json={"name": "阿胡"}).status_code == 401


def test_open_a_room_and_look_it_up(client):
    token = client.post("/api/session").json()["token"]
    code = client.post("/api/rooms", json={"name": "阿胡"}, headers=bearer(token)).json()["code"]
    summary = client.get(f"/api/rooms/{code.lower()}").json()
    assert summary == {"code": code, "phase": "lobby", "players": 1, "joinable": True}


def test_names_cannot_be_blank(client):
    token = client.post("/api/session").json()["token"]
    response = client.post("/api/rooms", json={"name": "   "}, headers=bearer(token))
    assert response.status_code == 422


def test_unknown_rooms_are_not_found(client):
    assert client.get("/api/rooms/ZZZZ").status_code == 404


def test_the_role_catalog_covers_every_role(client):
    roles = {role["id"]: role for role in client.get("/api/roles").json()}
    assert set(roles) == set(RoleId)
    assert roles["copycat"]["night_order"] == 1
    assert roles["doppelganger"]["night_order"] == 2
    assert roles["werewolf"]["night_order"] == 3
    assert roles["villager"]["night_order"] is None

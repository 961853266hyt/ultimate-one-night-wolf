from typing import get_args

from app.api.ws import _commands
from app.domain.commands import Command
from app.protocol import ActAs, ClientMessage, Hello, json_schema


def union_members(annotated) -> set[type]:
    union, _ = get_args(annotated)
    return set(get_args(union))


def test_clients_can_send_hello_act_as_and_every_command():
    assert union_members(ClientMessage) == union_members(Command) | {Hello, ActAs}


def test_the_socket_reads_act_as_apart_from_room_commands():
    assert _commands.validate_python({"type": "act_as", "player": "bot-1"}) == ActAs(player="bot-1")
    assert _commands.validate_python({"type": "act_as", "player": None}) == ActAs(player=None)


def test_the_schema_marks_every_field_required():
    for name, definition in json_schema()["$defs"].items():
        if "properties" in definition:
            assert definition["required"] == list(definition["properties"]), name

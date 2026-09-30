from typing import get_args

from app.domain.commands import Command
from app.protocol import ClientMessage, Hello, json_schema


def union_members(annotated) -> set[type]:
    union, _ = get_args(annotated)
    return set(get_args(union))


def test_clients_can_send_hello_and_every_command():
    assert union_members(ClientMessage) == union_members(Command) | {Hello}


def test_the_schema_marks_every_field_required():
    for name, definition in json_schema()["$defs"].items():
        if "properties" in definition:
            assert definition["required"] == list(definition["properties"]), name

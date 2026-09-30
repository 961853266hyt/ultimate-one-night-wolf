"""玩家发给房间的指令。上线和下线不是指令，由运行时直接调用 Room.connect / Room.disconnect。"""

from typing import Annotated, Literal

from pydantic import BaseModel, Field

from .types import PlayerId, Settings, Slot


class Configure(BaseModel):
    type: Literal["configure"] = "configure"
    settings: Settings


class Kick(BaseModel):
    type: Literal["kick"] = "kick"
    player: PlayerId


class Start(BaseModel):
    type: Literal["start"] = "start"


class Leave(BaseModel):
    type: Literal["leave"] = "leave"


class ConfirmCard(BaseModel):
    type: Literal["confirm_card"] = "confirm_card"


class NightAction(BaseModel):
    type: Literal["night_action"] = "night_action"
    targets: list[Slot]


class ReadyToVote(BaseModel):
    type: Literal["ready_to_vote"] = "ready_to_vote"


class Vote(BaseModel):
    type: Literal["vote"] = "vote"
    target: PlayerId


class Rematch(BaseModel):
    type: Literal["rematch"] = "rematch"


Command = Annotated[
    Configure | Kick | Start | Leave | ConfirmCard | NightAction | ReadyToVote | Vote | Rematch,
    Field(discriminator="type"),
]

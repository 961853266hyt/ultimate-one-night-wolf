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


class TakeSeat(BaseModel):
    """大厅里换到一个空座位。座位号从 0 开始。"""

    type: Literal["take_seat"] = "take_seat"
    seat: int


class AddBots(BaseModel):
    """房主把所有空座位坐上机器人。机器人自己不行动，房主可以替它们操作。"""

    type: Literal["add_bots"] = "add_bots"


class Start(BaseModel):
    type: Literal["start"] = "start"


class Leave(BaseModel):
    type: Literal["leave"] = "leave"


class ConfirmCard(BaseModel):
    type: Literal["confirm_card"] = "confirm_card"


class NightAction(BaseModel):
    type: Literal["night_action"] = "night_action"
    targets: list[Slot]


class EndStep(BaseModel):
    """有机器人的一局，夜里每一步不限时，由房主（或者房主替机器人）手动结束这一步。"""

    type: Literal["end_step"] = "end_step"


class ReadyToVote(BaseModel):
    type: Literal["ready_to_vote"] = "ready_to_vote"


class Vote(BaseModel):
    type: Literal["vote"] = "vote"
    target: PlayerId


class Rematch(BaseModel):
    type: Literal["rematch"] = "rematch"


Command = Annotated[
    Configure
    | Kick
    | TakeSeat
    | AddBots
    | Start
    | Leave
    | ConfirmCard
    | NightAction
    | EndStep
    | ReadyToVote
    | Vote
    | Rematch,
    Field(discriminator="type"),
]

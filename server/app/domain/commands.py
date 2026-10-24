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


class LeaveSeat(BaseModel):
    """大厅里离开座位，坐到观战席：下一局不玩，看别人玩。想回来就再挑一个空座位。"""

    type: Literal["leave_seat"] = "leave_seat"


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


class StartVote(BaseModel):
    """房主：白天讨论完了，开始投票。"""

    type: Literal["start_vote"] = "start_vote"


class Vote(BaseModel):
    type: Literal["vote"] = "vote"
    target: PlayerId


class Rematch(BaseModel):
    type: Literal["rematch"] = "rematch"


Command = Annotated[
    Configure
    | Kick
    | TakeSeat
    | LeaveSeat
    | Start
    | Leave
    | ConfirmCard
    | NightAction
    | EndStep
    | StartVote
    | Vote
    | Rematch,
    Field(discriminator="type"),
]

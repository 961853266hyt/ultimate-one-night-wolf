"""领域里通用的小类型：角色、阵营、阶段、配置，以及夜里看到的信息和能做的选择。"""

from enum import StrEnum
from typing import Annotated, Literal

from pydantic import BaseModel, Field

PlayerId = str
Slot = str  # 放牌的位置：玩家的 id，或者底牌 C0 / C1 / C2

CENTER: tuple[Slot, ...] = ("C0", "C1", "C2")
MIN_PLAYERS = 3
MAX_PLAYERS = 10


class RoleId(StrEnum):
    WEREWOLF = "werewolf"
    MINION = "minion"
    MASON = "mason"
    SEER = "seer"
    ROBBER = "robber"
    WITCH = "witch"
    TROUBLEMAKER = "troublemaker"
    DRUNK = "drunk"
    INSOMNIAC = "insomniac"
    HUNTER = "hunter"
    TANNER = "tanner"
    VILLAGER = "villager"


class Team(StrEnum):
    VILLAGE = "village"
    WEREWOLF = "werewolf"
    TANNER = "tanner"


class Phase(StrEnum):
    LOBBY = "lobby"
    DEAL = "deal"
    NIGHT = "night"
    DAY = "day"
    VOTE = "vote"
    REVEAL = "reveal"


class Timings(BaseModel):
    """各阶段时长，单位秒。看牌、白天讨论和投票都不限时，所以只有夜里每一步。"""

    night_step: int = Field(default=20, ge=5, le=60)


class Settings(BaseModel):
    deck: list[RoleId] | None = None  # None 表示按人数自动推荐
    timings: Timings = Field(default_factory=Timings)


# ---------------------------------------------------------------- 夜里得到的信息


class SawCard(BaseModel):
    """看到了某个位置上的牌。"""

    type: Literal["saw_card"] = "saw_card"
    step: RoleId
    slot: Slot
    role: RoleId


class SawPlayers(BaseModel):
    """得知哪些玩家拿着某个角色，例如狼互认、爪牙看狼。players 可以为空。"""

    type: Literal["saw_players"] = "saw_players"
    step: RoleId
    role: RoleId
    players: list[PlayerId]


class Swapped(BaseModel):
    """交换了两个位置上的牌。交换本身不代表看到了牌。"""

    type: Literal["swapped"] = "swapped"
    step: RoleId
    slots: tuple[Slot, Slot]


Knowledge = Annotated[SawCard | SawPlayers | Swapped, Field(discriminator="type")]


# ---------------------------------------------------------------- 夜里能做的选择


class TargetOption(BaseModel):
    """选 count 个目标。player 指其他玩家，include_self 时也可以选自己；center 指底牌。"""

    kind: Literal["player", "center"]
    count: int
    include_self: bool = False


class Prompt(BaseModel):
    """玩家此刻能做的选择：从 options 里挑一种。required 的选择超时后由系统随机代选。"""

    options: list[TargetOption]
    required: bool = False

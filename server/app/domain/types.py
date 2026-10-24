"""领域里通用的小类型：角色、阵营、阶段、配置，以及夜里看到的信息和能做的选择。"""

from enum import StrEnum
from typing import Annotated, Literal

from pydantic import BaseModel, Field

PlayerId = str
Slot = str  # 放牌的位置：玩家的 id，或者底牌 C0 / C1 / C2

# 白痴挪牌的方向：每张牌传给座位号的下一个人，或者上一个人
Direction = Literal["next", "previous"]
DIRECTIONS: tuple[Direction, ...] = ("next", "previous")

CENTER: tuple[Slot, ...] = ("C0", "C1", "C2")
MIN_PLAYERS = 3
MAX_PLAYERS = 10
MAX_MEMBERS = 20  # 一个房间最多几个人：坐着的加上观战席


class RoleId(StrEnum):
    COPYCAT = "copycat"
    DOPPELGANGER = "doppelganger"
    WEREWOLF = "werewolf"
    MINION = "minion"
    MASON = "mason"
    SEER = "seer"
    ROBBER = "robber"
    WITCH = "witch"
    TROUBLEMAKER = "troublemaker"
    VILLAGE_IDIOT = "village_idiot"
    DRUNK = "drunk"
    INSOMNIAC = "insomniac"
    REVEALER = "revealer"
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
    seats: int = Field(default=3, ge=MIN_PLAYERS, le=MAX_PLAYERS)  # 房间几个座位，坐满才能开局
    deck: list[RoleId] | None = None  # None 表示按座位数自动推荐
    timings: Timings = Field(default_factory=Timings)
    self_vote: bool = True  # 能不能投自己。官方规则不能，这里默认放开，房主可以关掉
    # 公开房间：出现在「房间」列表里，谁都能点进来。关掉就只能靠房间号或链接进来
    public: bool = True
    # 调试模式，给开发者一个人测试用：空座位坐上机器人，由房主替它们操作；夜里不限时，手动结束每一步
    debug: bool = False


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


class Copied(BaseModel):
    """模仿者或化身幽灵看了 slot 上的牌，变成了 role。step 是在谁的那一步变的。"""

    type: Literal["copied"] = "copied"
    step: RoleId
    slot: Slot
    role: RoleId


class Shifted(BaseModel):
    """白痴把除自己以外所有玩家的牌，一起往 direction 挪了一位。只挪不看。"""

    type: Literal["shifted"] = "shifted"
    step: RoleId
    direction: Direction


class Revealed(BaseModel):
    """揭示者翻开 slot 上的牌看到了 role。face_up：好人阵营的牌就一直翻着，所有人都看得到；
    否则扣了回去，只有揭示者知道。"""

    type: Literal["revealed"] = "revealed"
    step: RoleId
    slot: Slot
    role: RoleId
    face_up: bool


Knowledge = Annotated[
    SawCard | SawPlayers | Swapped | Copied | Shifted | Revealed, Field(discriminator="type")
]


# ---------------------------------------------------------------- 夜里能做的选择


class TargetOption(BaseModel):
    """选 count 个目标。player 指其他玩家，include_self 时也可以选自己；center 指底牌；
    direction 是选一个方向（next / previous），白痴挪牌用。"""

    kind: Literal["player", "center", "direction"]
    count: int
    include_self: bool = False
    exclude: list[Slot] = Field(default_factory=list)  # 不能选的位置，比如预言家已经看过的那张底牌


class Prompt(BaseModel):
    """玩家此刻能做的选择：从 options 里挑一种。required 的选择超时后由系统随机代选。"""

    options: list[TargetOption]
    required: bool = False

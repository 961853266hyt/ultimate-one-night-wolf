"""预设的板子：几个人玩、配哪些牌，首页挑一个直接开房。

每个人数都有一个「经典局」，就是按人数推荐的那副牌；别的玩法挑合适的人数配。
这里只管牌和设置，板子的名字、标签由前端按 kind 翻译。想加一个板子，在 DECKS 里加一行，
再给前端语言包加上名字；同一个人数下两个板子的牌不能一样，不然房间里认不出是哪个。
"""

from collections import Counter
from enum import StrEnum

from pydantic import BaseModel

from .recommended import RECOMMENDED
from .types import RoleId, Settings


class BoardKind(StrEnum):
    STARTER = "starter"  # 新手局：只有最基础的角色
    CLASSIC = "classic"  # 经典局：按人数推荐
    CHAOS = "chaos"  # 换牌大乱斗：换牌的角色全上
    TANNER = "tanner"  # 皮匠搅局：皮匠、爪牙、猎人
    MASON = "mason"  # 守夜人局：一对守夜人
    MIRROR = "mirror"  # 镜像局：化身幽灵、模仿者


class Board(BaseModel):
    kind: BoardKind
    seats: int
    deck: list[RoleId]
    speech_rounds: int
    signature: RoleId  # 招牌角色：首页卡片上放它的大卡图

    @property
    def id(self) -> str:
        return f"{self.kind}-{self.seats}"

    def settings(self) -> Settings:
        """用这个板子开房时的设置。牌和按人数推荐的一样时不写死，之后改座位数会自动换牌。"""
        recommended = Counter(self.deck) == Counter(RECOMMENDED[self.seats])
        return Settings(
            seats=self.seats,
            deck=None if recommended else list(self.deck),
            speech_rounds=self.speech_rounds,
        )


WOLF = RoleId.WEREWOLF
MINION = RoleId.MINION
MASON = RoleId.MASON
SEER = RoleId.SEER
ROBBER = RoleId.ROBBER
WITCH = RoleId.WITCH
TROUBLE = RoleId.TROUBLEMAKER
DRUNK = RoleId.DRUNK
INSOMNIAC = RoleId.INSOMNIAC
HUNTER = RoleId.HUNTER
TANNER = RoleId.TANNER
VILLAGER = RoleId.VILLAGER
DOPPEL = RoleId.DOPPELGANGER
COPYCAT = RoleId.COPYCAT

# 玩法 → 人数 → 牌，每副都是「人数 + 3」张。首页按这里的顺序排
DECKS: dict[BoardKind, dict[int, list[RoleId]]] = {
    BoardKind.STARTER: {
        4: [WOLF, WOLF, SEER, ROBBER, TROUBLE, VILLAGER, VILLAGER],
        5: [WOLF, WOLF, SEER, ROBBER, TROUBLE, VILLAGER, VILLAGER, VILLAGER],
        6: [WOLF, WOLF, SEER, ROBBER, TROUBLE, INSOMNIAC, VILLAGER, VILLAGER, VILLAGER],
        7: [WOLF, WOLF, SEER, ROBBER, TROUBLE, INSOMNIAC, HUNTER, VILLAGER, VILLAGER, VILLAGER],
        8: [WOLF, WOLF, MASON, MASON, SEER, ROBBER, TROUBLE, INSOMNIAC]
        + [VILLAGER, VILLAGER, VILLAGER],
        9: [WOLF, WOLF, MASON, MASON, SEER, ROBBER, TROUBLE, INSOMNIAC, HUNTER]
        + [VILLAGER, VILLAGER, VILLAGER],
        10: [WOLF, WOLF, MASON, MASON, SEER, ROBBER, TROUBLE, DRUNK, INSOMNIAC, HUNTER]
        + [VILLAGER, VILLAGER, VILLAGER],
    },
    BoardKind.CLASSIC: {n: list(deck) for n, deck in RECOMMENDED.items()},
    BoardKind.CHAOS: {
        3: [WOLF, WOLF, ROBBER, TROUBLE, WITCH, INSOMNIAC],
        4: [WOLF, WOLF, ROBBER, TROUBLE, DRUNK, WITCH, INSOMNIAC],
        5: [WOLF, WOLF, SEER, ROBBER, TROUBLE, DRUNK, WITCH, INSOMNIAC],
        6: [WOLF, WOLF, SEER, ROBBER, TROUBLE, DRUNK, WITCH, INSOMNIAC, VILLAGER],
        7: [WOLF, WOLF, MINION, SEER, ROBBER, TROUBLE, DRUNK, WITCH, INSOMNIAC, VILLAGER],
        8: [WOLF, WOLF, MINION, SEER, ROBBER, TROUBLE, DRUNK, WITCH, INSOMNIAC]
        + [VILLAGER, VILLAGER],
        9: [WOLF, WOLF, MINION, SEER, ROBBER, TROUBLE, DRUNK, WITCH, INSOMNIAC, HUNTER]
        + [VILLAGER, VILLAGER],
        10: [WOLF, WOLF, MINION, SEER, ROBBER, TROUBLE, DRUNK, WITCH, INSOMNIAC, HUNTER, TANNER]
        + [VILLAGER, VILLAGER],
    },
    BoardKind.TANNER: {
        3: [WOLF, WOLF, SEER, ROBBER, TANNER, VILLAGER],
        4: [WOLF, WOLF, MINION, SEER, ROBBER, TROUBLE, TANNER],
        5: [WOLF, WOLF, MINION, SEER, ROBBER, TROUBLE, TANNER, HUNTER],
        6: [WOLF, WOLF, MINION, SEER, ROBBER, TROUBLE, TANNER, HUNTER, VILLAGER],
        7: [WOLF, WOLF, MINION, SEER, ROBBER, TROUBLE, INSOMNIAC, TANNER, HUNTER, VILLAGER],
    },
    BoardKind.MASON: {
        5: [WOLF, WOLF, MASON, MASON, SEER, ROBBER, TROUBLE, INSOMNIAC],
        6: [WOLF, WOLF, MINION, MASON, MASON, SEER, ROBBER, TROUBLE, INSOMNIAC],
        7: [WOLF, WOLF, MINION, MASON, MASON, SEER, ROBBER, TROUBLE, DRUNK, INSOMNIAC],
        8: [WOLF, WOLF, MINION, MASON, MASON, SEER, ROBBER, TROUBLE, DRUNK, INSOMNIAC, VILLAGER],
        9: [WOLF, WOLF, MINION, MASON, MASON, SEER, ROBBER, TROUBLE, DRUNK, INSOMNIAC, HUNTER]
        + [VILLAGER],
        10: [WOLF, WOLF, MINION, MASON, MASON, SEER, ROBBER, TROUBLE, DRUNK, INSOMNIAC, HUNTER]
        + [TANNER, VILLAGER],
    },
    BoardKind.MIRROR: {
        4: [DOPPEL, WOLF, WOLF, SEER, ROBBER, TROUBLE, VILLAGER],
        5: [DOPPEL, WOLF, WOLF, SEER, ROBBER, TROUBLE, INSOMNIAC, VILLAGER],
        6: [DOPPEL, COPYCAT, WOLF, WOLF, SEER, ROBBER, TROUBLE, INSOMNIAC, VILLAGER],
        7: [DOPPEL, COPYCAT, WOLF, WOLF, MINION, SEER, ROBBER, TROUBLE, INSOMNIAC, VILLAGER],
        8: [DOPPEL, COPYCAT, WOLF, WOLF, MINION, SEER, ROBBER, TROUBLE, DRUNK, INSOMNIAC]
        + [VILLAGER],
        9: [DOPPEL, COPYCAT, WOLF, WOLF, MINION, SEER, ROBBER, TROUBLE, DRUNK, INSOMNIAC]
        + [TANNER, VILLAGER],
        10: [DOPPEL, COPYCAT, WOLF, WOLF, MINION, SEER, ROBBER, TROUBLE, DRUNK, INSOMNIAC]
        + [HUNTER, TANNER, VILLAGER],
    },
}

# 换牌大乱斗天亮之后要理的东西多，多说一轮
SPEECH_ROUNDS: dict[BoardKind, int] = {BoardKind.CHAOS: 4}

# 每种玩法的招牌角色，各个人数的牌里都得有它
SIGNATURE: dict[BoardKind, RoleId] = {
    BoardKind.STARTER: SEER,
    BoardKind.CLASSIC: WOLF,
    BoardKind.CHAOS: WITCH,
    BoardKind.TANNER: TANNER,
    BoardKind.MASON: MASON,
    BoardKind.MIRROR: DOPPEL,
}

BOARDS: list[Board] = [
    Board(
        kind=kind,
        seats=seats,
        deck=deck,
        speech_rounds=SPEECH_ROUNDS.get(kind, Settings().speech_rounds),
        signature=SIGNATURE[kind],
    )
    for kind, decks in DECKS.items()
    for seats, deck in sorted(decks.items())
]

BOARDS_BY_ID: dict[str, Board] = {board.id: board for board in BOARDS}


def board_of(seats: int, deck: list[RoleId]) -> BoardKind | None:
    """这么多座位、这副牌是哪个板子；房主自己配的牌对不上任何板子，就是 None。"""
    cards = Counter(deck)
    for board in BOARDS:
        if board.seats == seats and Counter(board.deck) == cards:
            return board.kind
    return None

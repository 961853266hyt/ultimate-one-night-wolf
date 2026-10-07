"""角色的公共接口。每个角色一个文件，只覆盖自己用得到的方法。"""

from typing import ClassVar, Protocol

from ..types import Knowledge, PlayerId, Prompt, RoleId, Slot, Team


class Table(Protocol):
    """角色能看到、能改动的牌桌。Game 实现了它，角色不需要知道 Game 的其余部分。"""

    players: list[PlayerId]
    cards: dict[Slot, RoleId]
    acted: set[PlayerId]
    # 每个人夜里得知的信息。分两次行动的角色（女巫）靠它记住做到哪一步了
    knowledge: dict[PlayerId, list[Knowledge]]

    def players_acting_as(self, role: RoleId) -> list[PlayerId]: ...

    def swap(self, a: Slot, b: Slot) -> None: ...


class Role:
    """夜里什么时候醒，不由角色自己决定，见 night.NIGHT_ORDER。"""

    id: ClassVar[RoleId]
    team: ClassVar[Team] = Team.VILLAGE
    max_copies: ClassVar[int] = 1

    def wake_info(self, table: Table, me: PlayerId) -> list[Knowledge]:
        """醒来时直接得到的信息。"""
        return []

    def prompt(self, table: Table, me: PlayerId) -> Prompt | None:
        """此刻能做的选择。每次行动后都会重新求值；默认每一步只能行动一次。"""
        if me in table.acted:
            return None
        return self.choices(table, me)

    def choices(self, table: Table, me: PlayerId) -> Prompt | None:
        return None

    def act(self, table: Table, me: PlayerId, targets: list[Slot]) -> list[Knowledge]:
        """执行行动，返回看到的信息。targets 已经按 prompt 校验过。"""
        raise NotImplementedError

"""角色的公共接口。每个角色一个文件，只覆盖自己用得到的方法。"""

from typing import ClassVar, Protocol

from ..types import Knowledge, PlayerId, Prompt, RoleId, Slot, Team


class Table(Protocol):
    """角色能看到、能改动的牌桌。Game 实现了它，角色不需要知道 Game 的其余部分。"""

    players: list[PlayerId]
    cards: dict[Slot, RoleId]

    def my_actions(self, me: PlayerId) -> list[list[Slot]]:
        """这一步里 me 已经做过的行动，每次选的目标。分几次行动的角色靠它知道做到哪了。"""
        ...

    def acting_role(self, player: PlayerId) -> RoleId:
        """夜里以什么身份行动：发到的牌；化身幽灵化身之后是化身成的角色。"""
        ...

    def players_acting_as(self, role: RoleId) -> list[PlayerId]: ...

    def swap(self, a: Slot, b: Slot) -> None: ...

    def become(self, player: PlayerId, role: RoleId) -> None:
        """化身幽灵化身成 role。"""
        ...


class Role:
    """夜里什么时候醒，不由角色自己决定，见 night.NIGHT_ORDER。"""

    id: ClassVar[RoleId]
    team: ClassVar[Team] = Team.VILLAGE
    max_copies: ClassVar[int] = 1
    # 化身幽灵化身成这个角色时，是在化身幽灵那一步马上行动（预言家、强盗……），
    # 还是等到这个角色那一步再一起醒（狼人、爪牙、守夜人、失眠者）
    acts_with_doppelganger: ClassVar[bool] = False

    def wake_info(self, table: Table, me: PlayerId) -> list[Knowledge]:
        """醒来时直接得到的信息。"""
        return []

    def prompt(self, table: Table, me: PlayerId) -> Prompt | None:
        """此刻能做的选择。每次行动后都会重新求值；默认每一步只能行动一次。"""
        if table.my_actions(me):
            return None
        return self.choices(table, me)

    def choices(self, table: Table, me: PlayerId) -> Prompt | None:
        return None

    def act(self, table: Table, me: PlayerId, targets: list[Slot]) -> list[Knowledge]:
        """执行行动，返回看到的信息。targets 已经按 prompt 校验过。"""
        raise NotImplementedError

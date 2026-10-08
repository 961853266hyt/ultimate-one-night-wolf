from collections.abc import Mapping

from ..types import Copied, Knowledge, PlayerId, Prompt, RoleId, Slot, TargetOption
from .base import Role, Table


class Doppelganger(Role):
    """在模仿者之后醒来，看一名其他玩家的牌，变成那个角色，阵营也跟着变。

    化身成预言家、强盗、捣蛋鬼、酒鬼、女巫的，在这一步接着做那个角色的事；
    化身成狼人、爪牙、守夜人、失眠者的，到那个角色那一步一起醒（见 Game.wakers）。
    化身成模仿者的，模仿那一步已经过去了，什么也不做，胜负算模仿者变成的角色。
    """

    id = RoleId.DOPPELGANGER

    def __init__(self, roles: Mapping[RoleId, Role]) -> None:
        self._roles = roles  # 注册表，化身之后要用化身成的角色

    def prompt(self, table: Table, me: PlayerId) -> Prompt | None:
        if not table.my_actions(me):
            # 必须化身，到时间还没选由系统随机代选
            return Prompt(options=[TargetOption(kind="player", count=1)], required=True)
        role = self._roles[table.acting_role(me)]
        if not role.acts_with_doppelganger:
            return None
        return role.prompt(_AfterCopy(table), me)

    def act(self, table: Table, me: PlayerId, targets: list[Slot]) -> list[Knowledge]:
        if not table.my_actions(me):
            [target] = targets
            role = table.cards[target]
            table.become(me, role)
            return [Copied(step=self.id, slot=target, role=role)]
        role = self._roles[table.acting_role(me)]
        facts = role.act(_AfterCopy(table), me, targets)
        # 都是在化身幽灵这一步得知的
        return [fact.model_copy(update={"step": self.id}) for fact in facts]


class _AfterCopy:
    """去掉化身的那一次行动，化身成的角色就像这一步刚开始一样。"""

    def __init__(self, table: Table) -> None:
        self._table = table

    def __getattr__(self, name: str):
        return getattr(self._table, name)

    def my_actions(self, me: PlayerId) -> list[list[Slot]]:
        return self._table.my_actions(me)[1:]

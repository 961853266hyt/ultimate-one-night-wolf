from ..types import Copied, Knowledge, PlayerId, Prompt, RoleId, Slot, TargetOption
from .base import Role, Table


class Copycat(Role):
    """最先醒来，看一张底牌，变成那个角色，阵营也跟着变。

    和化身幽灵不同，她不在这一步接着行动：变成了谁，就到谁那一步和他们一起醒，
    照那个角色的规则行动（见 Game.wakers）。变成化身幽灵的，在化身幽灵那一步去化身。
    """

    id = RoleId.COPYCAT

    def choices(self, table: Table, me: PlayerId) -> Prompt | None:
        # 必须模仿，到时间还没选由系统随机代选
        return Prompt(options=[TargetOption(kind="center", count=1)], required=True)

    def act(self, table: Table, me: PlayerId, targets: list[Slot]) -> list[Knowledge]:
        [slot] = targets
        role = table.cards[slot]
        table.become(me, role)
        return [Copied(step=self.id, slot=slot, role=role)]

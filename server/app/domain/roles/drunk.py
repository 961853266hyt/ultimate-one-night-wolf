from ..types import Knowledge, PlayerId, Prompt, RoleId, Slot, Swapped, TargetOption
from .base import Role, Table


class Drunk(Role):
    id = RoleId.DRUNK

    def choices(self, table: Table, me: PlayerId) -> Prompt | None:
        return Prompt(options=[TargetOption(kind="center", count=1)], required=True)

    def act(self, table: Table, me: PlayerId, targets: list[Slot]) -> list[Knowledge]:
        [center] = targets
        table.swap(me, center)
        return [Swapped(step=self.id, slots=(me, center))]  # 换完不看新牌

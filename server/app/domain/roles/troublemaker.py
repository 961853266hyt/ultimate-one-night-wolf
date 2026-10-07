from ..types import Knowledge, PlayerId, Prompt, RoleId, Slot, Swapped, TargetOption
from .base import Role, Table


class Troublemaker(Role):
    id = RoleId.TROUBLEMAKER
    acts_with_doppelganger = True

    def choices(self, table: Table, me: PlayerId) -> Prompt | None:
        return Prompt(options=[TargetOption(kind="player", count=2)])

    def act(self, table: Table, me: PlayerId, targets: list[Slot]) -> list[Knowledge]:
        a, b = targets
        table.swap(a, b)
        return [Swapped(step=self.id, slots=(a, b))]  # 只换不看

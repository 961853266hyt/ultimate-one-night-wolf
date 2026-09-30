from ..types import Knowledge, PlayerId, Prompt, RoleId, SawCard, Slot, Swapped, TargetOption
from .base import Role, Table


class Robber(Role):
    id = RoleId.ROBBER
    night_order = 6

    def choices(self, table: Table, me: PlayerId) -> Prompt | None:
        return Prompt(options=[TargetOption(kind="player", count=1)])

    def act(self, table: Table, me: PlayerId, targets: list[Slot]) -> list[Knowledge]:
        [target] = targets
        table.swap(me, target)
        return [
            Swapped(step=self.id, slots=(me, target)),
            SawCard(step=self.id, slot=me, role=table.cards[me]),  # 看的是换到手里的新牌
        ]

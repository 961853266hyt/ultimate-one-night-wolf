from ..types import Knowledge, PlayerId, Prompt, RoleId, SawCard, Slot, TargetOption
from .base import Role, Table


class Seer(Role):
    id = RoleId.SEER
    night_order = 5

    def choices(self, table: Table, me: PlayerId) -> Prompt | None:
        return Prompt(
            options=[TargetOption(kind="player", count=1), TargetOption(kind="center", count=2)]
        )

    def act(self, table: Table, me: PlayerId, targets: list[Slot]) -> list[Knowledge]:
        return [SawCard(step=self.id, slot=slot, role=table.cards[slot]) for slot in targets]

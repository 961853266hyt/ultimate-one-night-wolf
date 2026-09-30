from ..types import Knowledge, PlayerId, RoleId, SawCard
from .base import Role, Table


class Insomniac(Role):
    id = RoleId.INSOMNIAC
    night_order = 9

    def wake_info(self, table: Table, me: PlayerId) -> list[Knowledge]:
        return [SawCard(step=self.id, slot=me, role=table.cards[me])]

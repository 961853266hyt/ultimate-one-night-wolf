from ..types import Knowledge, PlayerId, RoleId, SawPlayers
from .base import Role, Table


class Mason(Role):
    id = RoleId.MASON
    night_order = 4
    max_copies = 2

    def wake_info(self, table: Table, me: PlayerId) -> list[Knowledge]:
        others = [p for p in table.players_acting_as(RoleId.MASON) if p != me]
        return [SawPlayers(step=self.id, role=RoleId.MASON, players=others)]

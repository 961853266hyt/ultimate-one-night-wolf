from ..types import Knowledge, PlayerId, RoleId, SawPlayers, Team
from .base import Role, Table


class Minion(Role):
    id = RoleId.MINION
    team = Team.WEREWOLF

    def wake_info(self, table: Table, me: PlayerId) -> list[Knowledge]:
        # 爪牙看得到狼，狼看不到爪牙
        wolves = table.players_acting_as(RoleId.WEREWOLF)
        return [SawPlayers(step=self.id, role=RoleId.WEREWOLF, players=wolves)]

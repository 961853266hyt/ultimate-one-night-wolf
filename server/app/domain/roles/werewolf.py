from ..types import (
    Knowledge,
    PlayerId,
    Prompt,
    RoleId,
    SawCard,
    SawPlayers,
    Slot,
    TargetOption,
    Team,
)
from .base import Role, Table


class Werewolf(Role):
    id = RoleId.WEREWOLF
    team = Team.WEREWOLF
    max_copies = 2

    def wake_info(self, table: Table, me: PlayerId) -> list[Knowledge]:
        others = [p for p in table.players_acting_as(RoleId.WEREWOLF) if p != me]
        return [SawPlayers(step=self.id, role=RoleId.WEREWOLF, players=others)]

    def choices(self, table: Table, me: PlayerId) -> Prompt | None:
        if len(table.players_acting_as(RoleId.WEREWOLF)) > 1:
            return None
        return Prompt(options=[TargetOption(kind="center", count=1)])  # 独狼可以看一张底牌

    def act(self, table: Table, me: PlayerId, targets: list[Slot]) -> list[Knowledge]:
        return [SawCard(step=self.id, slot=slot, role=table.cards[slot]) for slot in targets]

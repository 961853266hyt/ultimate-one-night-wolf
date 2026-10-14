from ..types import Knowledge, PlayerId, Prompt, RoleId, SawCard, Slot, Swapped, TargetOption
from .base import Role, Table


class Robber(Role):
    id = RoleId.ROBBER
    acts_with_doppelganger = True

    def choices(self, table: Table, me: PlayerId) -> Prompt | None:
        # 必须抢：到时间没选，系统随机抢一名其他玩家
        return Prompt(options=[TargetOption(kind="player", count=1)], required=True)

    def act(self, table: Table, me: PlayerId, targets: list[Slot]) -> list[Knowledge]:
        [target] = targets
        table.swap(me, target)
        return [
            Swapped(step=self.id, slots=(me, target)),
            SawCard(step=self.id, slot=me, role=table.cards[me]),  # 看的是换到手里的新牌
        ]

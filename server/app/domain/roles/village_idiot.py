from ..types import Knowledge, PlayerId, Prompt, RoleId, Shifted, Slot, TargetOption
from .base import Role, Table


class VillageIdiot(Role):
    """白痴：把除自己以外所有玩家的牌，一起传给座位号的下一个人或者上一个人，每张挪一位，跳过自己。
    也可以不挪。只挪不看。"""

    id = RoleId.VILLAGE_IDIOT
    acts_with_doppelganger = True

    def choices(self, table: Table, me: PlayerId) -> Prompt | None:
        return Prompt(options=[TargetOption(kind="direction", count=1)])

    def act(self, table: Table, me: PlayerId, targets: list[Slot]) -> list[Knowledge]:
        [direction] = targets
        others = [p for p in table.players if p != me]
        offset = 1 if direction == "next" else -1
        before = {p: table.cards[p] for p in others}
        for i, player in enumerate(others):
            table.cards[others[(i + offset) % len(others)]] = before[player]
        return [Shifted(step=self.id, direction="next" if offset == 1 else "previous")]

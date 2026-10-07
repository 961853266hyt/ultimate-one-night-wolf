from ..types import (
    CENTER,
    Knowledge,
    PlayerId,
    Prompt,
    RoleId,
    SawCard,
    Slot,
    Swapped,
    TargetOption,
)
from .base import Role, Table


class Witch(Role):
    """可以看一张底牌；看了就必须把它和任意一名玩家（可以是自己）交换。分两次行动。"""

    id = RoleId.WITCH

    def prompt(self, table: Table, me: PlayerId) -> Prompt | None:
        if self._looked_at(table, me) is None:
            return Prompt(options=[TargetOption(kind="center", count=1)])
        if self._swapped(table, me):
            return None
        # 看了就必须换，到时间还没选由系统随机代选
        option = TargetOption(kind="player", count=1, include_self=True)
        return Prompt(options=[option], required=True)

    def act(self, table: Table, me: PlayerId, targets: list[Slot]) -> list[Knowledge]:
        [target] = targets
        looked = self._looked_at(table, me)
        if looked is None:
            return [SawCard(step=self.id, slot=target, role=table.cards[target])]
        table.swap(looked, target)
        facts: list[Knowledge] = [Swapped(step=self.id, slots=(looked, target))]
        if target == me:  # 换给了自己，手里就是刚才看到的那张
            facts.append(SawCard(step=self.id, slot=me, role=table.cards[me]))
        return facts

    def _looked_at(self, table: Table, me: PlayerId) -> Slot | None:
        """看过的那张底牌。"""
        for fact in table.knowledge.get(me, []):
            if isinstance(fact, SawCard) and fact.step is self.id and fact.slot in CENTER:
                return fact.slot
        return None

    def _swapped(self, table: Table, me: PlayerId) -> bool:
        facts = table.knowledge.get(me, [])
        return any(isinstance(fact, Swapped) and fact.step is self.id for fact in facts)

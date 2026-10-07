from ..types import Knowledge, PlayerId, Prompt, RoleId, SawCard, Slot, Swapped, TargetOption
from .base import Role, Table


class Witch(Role):
    """可以看一张底牌；看了就必须把它和任意一名玩家（可以是自己）交换。分两次行动。"""

    id = RoleId.WITCH
    acts_with_doppelganger = True

    def prompt(self, table: Table, me: PlayerId) -> Prompt | None:
        match len(table.my_actions(me)):
            case 0:
                return Prompt(options=[TargetOption(kind="center", count=1)])
            case 1:
                # 看了就必须换，到时间还没选由系统随机代选
                option = TargetOption(kind="player", count=1, include_self=True)
                return Prompt(options=[option], required=True)
            case _:
                return None

    def act(self, table: Table, me: PlayerId, targets: list[Slot]) -> list[Knowledge]:
        [target] = targets
        actions = table.my_actions(me)
        if not actions:
            return [SawCard(step=self.id, slot=target, role=table.cards[target])]
        [[looked]] = actions  # 第一次看的那张底牌
        table.swap(looked, target)
        facts: list[Knowledge] = [Swapped(step=self.id, slots=(looked, target))]
        if target == me:  # 换给了自己，手里就是刚才看到的那张
            facts.append(SawCard(step=self.id, slot=me, role=table.cards[me]))
        return facts

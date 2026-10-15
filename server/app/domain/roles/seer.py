from ..types import CENTER, Knowledge, PlayerId, Prompt, RoleId, SawCard, Slot, TargetOption
from .base import Role, Table


class Seer(Role):
    """看一名其他玩家的牌，或者看两张底牌。底牌一张一张看，分两次行动，前端可以一张一张翻开。"""

    id = RoleId.SEER
    acts_with_doppelganger = True

    def prompt(self, table: Table, me: PlayerId) -> Prompt | None:
        match table.my_actions(me):
            case []:
                return Prompt(
                    options=[
                        TargetOption(kind="player", count=1),
                        TargetOption(kind="center", count=1),
                    ]
                )
            case [[looked]] if looked in CENTER:
                # 看了一张底牌就要再看一张，不能是同一张；到时间还没选由系统随机代选
                option = TargetOption(kind="center", count=1, exclude=[looked])
                return Prompt(options=[option], required=True)
            case _:
                return None

    def act(self, table: Table, me: PlayerId, targets: list[Slot]) -> list[Knowledge]:
        return [SawCard(step=self.id, slot=slot, role=table.cards[slot]) for slot in targets]

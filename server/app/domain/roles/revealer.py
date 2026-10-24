from collections.abc import Mapping

from ..types import Knowledge, PlayerId, Prompt, Revealed, RoleId, Slot, TargetOption, Team
from .base import Role, Table


class Revealer(Role):
    """揭示者：最后醒来，可以翻开一名其他玩家的牌看。好人阵营的牌就一直翻着，所有人都看得到；
    狼人阵营的牌和皮匠就扣回去，只有揭示者自己知道。

    阵营按这张牌最后算作的角色：化身幽灵化身成了狼人，这张牌就算狼人，要扣回去。
    """

    id = RoleId.REVEALER

    def __init__(self, roles: Mapping[RoleId, Role]) -> None:
        self._roles = roles  # 注册表，看翻开的牌是哪个阵营

    def choices(self, table: Table, me: PlayerId) -> Prompt | None:
        return Prompt(options=[TargetOption(kind="player", count=1)])

    def act(self, table: Table, me: PlayerId, targets: list[Slot]) -> list[Knowledge]:
        [slot] = targets
        role = table.cards[slot]
        face_up = self._roles[table.final_roles()[slot]].team is Team.VILLAGE
        if face_up:
            table.flip(slot)
        return [Revealed(step=self.id, slot=slot, role=role, face_up=face_up)]

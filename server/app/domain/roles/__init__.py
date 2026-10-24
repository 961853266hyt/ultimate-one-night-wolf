"""角色注册表。新增角色：写一个文件，再把它加进下面的元组。"""

from ..types import RoleId
from .base import Role, Table
from .copycat import Copycat
from .doppelganger import Doppelganger
from .drunk import Drunk
from .hunter import Hunter
from .insomniac import Insomniac
from .mason import Mason
from .minion import Minion
from .revealer import Revealer
from .robber import Robber
from .seer import Seer
from .tanner import Tanner
from .troublemaker import Troublemaker
from .village_idiot import VillageIdiot
from .villager import Villager
from .werewolf import Werewolf
from .witch import Witch

ROLES: dict[RoleId, Role] = {}
ROLES.update(
    (role.id, role)
    for role in (
        Copycat(),
        Doppelganger(ROLES),  # 化身之后要查化身成的角色，所以拿着整张注册表
        Werewolf(),
        Minion(),
        Mason(),
        Seer(),
        Robber(),
        Witch(),
        Troublemaker(),
        VillageIdiot(),
        Drunk(),
        Insomniac(),
        Revealer(ROLES),  # 翻开的牌要看阵营，所以也拿着整张注册表
        Hunter(),
        Tanner(),
        Villager(),
    )
)

__all__ = ["ROLES", "Role", "Table"]

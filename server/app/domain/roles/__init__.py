"""角色注册表。新增角色：写一个文件，再把它加进下面的元组。"""

from ..types import RoleId
from .base import Role, Table
from .drunk import Drunk
from .hunter import Hunter
from .insomniac import Insomniac
from .mason import Mason
from .minion import Minion
from .robber import Robber
from .seer import Seer
from .tanner import Tanner
from .troublemaker import Troublemaker
from .villager import Villager
from .werewolf import Werewolf

ROLES: dict[RoleId, Role] = {
    role.id: role
    for role in (
        Werewolf(),
        Minion(),
        Mason(),
        Seer(),
        Robber(),
        Troublemaker(),
        Drunk(),
        Insomniac(),
        Hunter(),
        Tanner(),
        Villager(),
    )
}

__all__ = ["ROLES", "Role", "Table"]

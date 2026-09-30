from ..types import RoleId
from .base import Role


class Villager(Role):
    id = RoleId.VILLAGER
    max_copies = 3

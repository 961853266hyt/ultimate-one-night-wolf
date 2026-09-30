from ..types import RoleId, Team
from .base import Role


class Tanner(Role):
    """夜里不醒。自己出局才算赢。"""

    id = RoleId.TANNER
    team = Team.TANNER

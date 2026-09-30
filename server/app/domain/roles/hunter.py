from ..types import RoleId
from .base import Role


class Hunter(Role):
    """夜里不醒。出局时，他投票指向的人也一起出局（见 rules.py）。"""

    id = RoleId.HUNTER

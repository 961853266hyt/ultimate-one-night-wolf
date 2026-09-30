"""夜间的通用规则：计划、目标校验、超时代选。每个角色具体做什么在 roles/ 里。"""

import random
from collections.abc import Iterable

from .errors import ErrorCode, RuleError
from .roles import ROLES
from .types import CENTER, PlayerId, Prompt, RoleId, Slot, TargetOption


def plan_for(deck: Iterable[RoleId]) -> list[RoleId]:
    """牌堆里会醒的角色，按唤醒顺序每种一步。

    牌堆是公开的，所以跳过不在牌堆里的角色不会泄露信息。
    """
    orders = {role: order for role in set(deck) if (order := ROLES[role].night_order) is not None}
    return sorted(orders, key=orders.__getitem__)


def candidates(players: list[PlayerId], me: PlayerId, option: TargetOption) -> list[Slot]:
    if option.kind == "center":
        return list(CENTER)
    return [p for p in players if p != me]


def check_targets(
    players: list[PlayerId], me: PlayerId, prompt: Prompt, targets: list[Slot]
) -> None:
    distinct = len(set(targets)) == len(targets)
    if distinct and any(_fits(players, me, option, targets) for option in prompt.options):
        return
    raise RuleError(ErrorCode.BAD_TARGETS)


def random_targets(
    players: list[PlayerId], me: PlayerId, prompt: Prompt, rng: random.Random
) -> list[Slot]:
    option = prompt.options[0]
    return rng.sample(candidates(players, me, option), option.count)


def _fits(players: list[PlayerId], me: PlayerId, option: TargetOption, targets: list[Slot]) -> bool:
    pool = candidates(players, me, option)
    return len(targets) == option.count and all(target in pool for target in targets)

"""夜间的通用规则：唤醒顺序、计划、目标校验、超时代选。每个角色具体做什么在 roles/ 里。"""

import random
from collections.abc import Collection

from .errors import ErrorCode, RuleError
from .types import CENTER, PlayerId, Prompt, RoleId, Slot, TargetOption

# 夜里的唤醒顺序，照官方规则书。不在这里的角色夜里不醒。
# 位置就是顺序：新角色要排在谁后面，就插在谁的下一行。
NIGHT_ORDER: tuple[RoleId, ...] = (
    RoleId.COPYCAT,
    RoleId.DOPPELGANGER,
    RoleId.WEREWOLF,
    RoleId.MINION,
    RoleId.MASON,
    RoleId.SEER,
    RoleId.ROBBER,
    RoleId.WITCH,
    RoleId.TROUBLEMAKER,
    RoleId.DRUNK,
    RoleId.INSOMNIAC,
)


def plan_for(deck: Collection[RoleId]) -> list[RoleId]:
    """牌堆里会醒的角色，按唤醒顺序每种一步。

    牌堆是公开的，所以跳过不在牌堆里的角色不会泄露信息。
    """
    return [role for role in NIGHT_ORDER if role in deck]


def candidates(players: list[PlayerId], me: PlayerId, option: TargetOption) -> list[Slot]:
    if option.kind == "center":
        return list(CENTER)
    return [p for p in players if option.include_self or p != me]


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

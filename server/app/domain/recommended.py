"""按人数自动推荐的牌堆。房主没有自定义配牌时用它；房间视图里也会带上，前端「恢复推荐」直接拿来用。"""

from .types import MAX_PLAYERS, MIN_PLAYERS, RoleId

# 人数 → 推荐的牌堆，每副都是「人数 + 3」张，每档可以单独调。
# 守夜人要成对才好玩，所以推荐里不放，只在自定义配牌里出现。
RECOMMENDED: dict[int, list[RoleId]] = {
    3: [
        RoleId.WEREWOLF,
        RoleId.WEREWOLF,
        RoleId.SEER,
        RoleId.ROBBER,
        RoleId.TROUBLEMAKER,
        RoleId.VILLAGER,
    ],
    4: [
        RoleId.WEREWOLF,
        RoleId.WEREWOLF,
        RoleId.SEER,
        RoleId.ROBBER,
        RoleId.TROUBLEMAKER,
        RoleId.DRUNK,
        RoleId.VILLAGER,
    ],
    5: [
        RoleId.WEREWOLF,
        RoleId.WEREWOLF,
        RoleId.SEER,
        RoleId.ROBBER,
        RoleId.TROUBLEMAKER,
        RoleId.DRUNK,
        RoleId.INSOMNIAC,
        RoleId.VILLAGER,
    ],
    6: [
        RoleId.WEREWOLF,
        RoleId.WEREWOLF,
        RoleId.MINION,
        RoleId.SEER,
        RoleId.ROBBER,
        RoleId.TROUBLEMAKER,
        RoleId.DRUNK,
        RoleId.INSOMNIAC,
        RoleId.VILLAGER,
    ],
    7: [
        RoleId.WEREWOLF,
        RoleId.WEREWOLF,
        RoleId.MINION,
        RoleId.SEER,
        RoleId.ROBBER,
        RoleId.TROUBLEMAKER,
        RoleId.DRUNK,
        RoleId.INSOMNIAC,
        RoleId.TANNER,
        RoleId.VILLAGER,
    ],
    8: [
        RoleId.WEREWOLF,
        RoleId.WEREWOLF,
        RoleId.MINION,
        RoleId.SEER,
        RoleId.ROBBER,
        RoleId.TROUBLEMAKER,
        RoleId.DRUNK,
        RoleId.INSOMNIAC,
        RoleId.HUNTER,
        RoleId.TANNER,
        RoleId.VILLAGER,
    ],
    9: [
        RoleId.WEREWOLF,
        RoleId.WEREWOLF,
        RoleId.MINION,
        RoleId.SEER,
        RoleId.ROBBER,
        RoleId.TROUBLEMAKER,
        RoleId.DRUNK,
        RoleId.INSOMNIAC,
        RoleId.HUNTER,
        RoleId.TANNER,
        RoleId.VILLAGER,
        RoleId.VILLAGER,
    ],
    10: [
        RoleId.WEREWOLF,
        RoleId.WEREWOLF,
        RoleId.MINION,
        RoleId.SEER,
        RoleId.ROBBER,
        RoleId.TROUBLEMAKER,
        RoleId.DRUNK,
        RoleId.INSOMNIAC,
        RoleId.HUNTER,
        RoleId.TANNER,
        RoleId.VILLAGER,
        RoleId.VILLAGER,
        RoleId.VILLAGER,
    ],
}


def recommended_deck(n_players: int) -> list[RoleId]:
    """这么多人时推荐的牌堆。不到 3 人按 3 人算，超过 10 人按 10 人算。"""
    n = min(max(n_players, MIN_PLAYERS), MAX_PLAYERS)
    return list(RECOMMENDED[n])  # 给一份副本，调用方改了也动不到这张表

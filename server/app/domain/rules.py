"""投票结算和胜负判定，按官方规则书。胜负只看夜里换完之后手里的牌。"""

from collections import Counter

from pydantic import BaseModel

from .roles import ROLES
from .types import PlayerId, RoleId, Slot, Team


class Result(BaseModel):
    deaths: list[PlayerId]
    winning_teams: list[Team]
    winners: list[PlayerId]


def resolve(
    cards: dict[Slot, RoleId], players: list[PlayerId], votes: dict[PlayerId, PlayerId]
) -> Result:
    dead = deaths(cards, votes)
    teams = winning_teams(cards, players, dead)
    return Result(
        deaths=[p for p in players if p in dead],
        winning_teams=teams,
        winners=[p for p in players if ROLES[cards[p]].team in teams],
    )


def lynched(votes: dict[PlayerId, PlayerId]) -> set[PlayerId]:
    """得票最多且至少 2 票的人出局，平票一起出局。没人超过 1 票就没人出局。"""
    counts = Counter(votes.values())
    top = max(counts.values(), default=0)
    if top < 2:
        return set()
    return {player for player, n in counts.items() if n == top}


def deaths(cards: dict[Slot, RoleId], votes: dict[PlayerId, PlayerId]) -> set[PlayerId]:
    """出局的人，包括猎人带走的人。猎人带走的如果也是猎人，会继续连锁。"""
    dead = lynched(votes)
    frontier = list(dead)
    while frontier:
        player = frontier.pop()
        target = votes.get(player)
        if cards[player] == RoleId.HUNTER and target is not None and target not in dead:
            dead.add(target)
            frontier.append(target)
    return dead


def winning_teams(
    cards: dict[Slot, RoleId], players: list[PlayerId], dead: set[PlayerId]
) -> list[Team]:
    """可能有多个阵营同时获胜，也可能所有人都输。"""
    held = {cards[p] for p in players}
    dead_roles = {cards[p] for p in dead}
    teams: list[Team] = []

    if RoleId.TANNER in dead_roles:
        teams.append(Team.TANNER)

    if RoleId.WEREWOLF in held:
        if RoleId.WEREWOLF in dead_roles:
            teams.append(Team.VILLAGE)
        elif RoleId.TANNER not in dead_roles:
            teams.append(Team.WEREWOLF)  # 皮匠出局时，狼人阵营不算赢
    else:
        # 狼全在底牌里：没人出局，好人赢；有爪牙时，只要爪牙以外有人出局，爪牙就赢
        if not dead:
            teams.append(Team.VILLAGE)
        minions = {p for p in players if cards[p] == RoleId.MINION}
        if minions and dead - minions:
            teams.append(Team.WEREWOLF)

    return teams

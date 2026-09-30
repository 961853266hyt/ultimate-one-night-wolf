import random

from app.domain.game import Game
from app.domain.room import Room
from app.domain.types import Phase, RoleId, Timings


class NoShuffle(random.Random):
    """发牌不洗牌：牌堆按顺序发给 p0、p1……，最后 3 张是底牌。其余随机行为照常。"""

    def shuffle(self, x) -> None:  # type: ignore[override]
        pass


def new_game(*roles: RoleId, now: float = 0) -> Game:
    """roles 依次是 p0、p1……的牌，最后 3 张是底牌 C0、C1、C2。"""
    players = [f"p{i}" for i in range(len(roles) - 3)]
    return Game.deal(players, list(roles), Timings(), now, NoShuffle(0))


def skip(game: Game) -> float:
    """跳到当前阶段的截止时间并推进，返回新的 now。"""
    now = game.ends_at
    assert now is not None
    game.tick(now, NoShuffle(0))
    return now


def night_until(game: Game, role: RoleId) -> None:
    """推进到夜里轮到 role 的那一步。"""
    while game.night_role != role:
        assert game.phase in (Phase.DEAL, Phase.NIGHT), f"今晚没有 {role}"
        skip(game)


def until_phase(game: Game, phase: Phase) -> None:
    while game.phase is not phase:
        skip(game)


def new_room(n: int, now: float = 0) -> Room:
    """p0 开房，p0 到 p{n-1} 都已在线。"""
    room = Room.create("ABCD", "p0", "p0", now)
    for i in range(n):
        room.connect(f"p{i}", f"p{i}", now)
    return room

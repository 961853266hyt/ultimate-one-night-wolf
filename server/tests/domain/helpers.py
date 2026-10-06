import random

from app.domain.game import Game
from app.domain.room import Room
from app.domain.types import Phase, RoleId, Timings


class NoShuffle(random.Random):
    """发牌不洗牌：牌堆按顺序发给 p0、p1……，最后 3 张是底牌。其余随机行为照常。"""

    def shuffle(self, x) -> None:  # type: ignore[override]
        pass


def new_game(*roles: RoleId) -> Game:
    """roles 依次是 p0、p1……的牌，最后 3 张是底牌 C0、C1、C2。"""
    players = [f"p{i}" for i in range(len(roles) - 3)]
    return Game.deal(players, list(roles), Timings(), NoShuffle(0))


def skip(game: Game) -> float:
    """推进到下一个阶段或夜里的下一步，返回新的 now。

    看牌不限时，所有人在 now=0 点「我记住了」；夜里跳到这一步的截止时间。
    """
    if game.phase is Phase.DEAL:
        for player in game.players:
            game.confirm_card(player, now=0)
        return 0.0
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
    now = 0.0
    while game.phase is not phase:
        if game.phase is Phase.DAY:
            for player in game.players:  # 白天不限时，所有人都同意投票才往下走
                game.ready_to_vote(player, now)
        else:
            now = skip(game)


def new_room(n: int, now: float = 0) -> Room:
    """p0 开房，p0 到 p{n-1} 都已在线。"""
    room = Room.create("ABCD", "p0", "p0", now)
    for i in range(n):
        room.connect(f"p{i}", f"p{i}", now)
    return room

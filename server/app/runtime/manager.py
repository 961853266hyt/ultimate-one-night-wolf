"""所有房间：房间号 → RoomActor。"""

import asyncio
import random
import secrets
import time
from collections.abc import Callable

from ..domain.room import Room
from ..domain.types import PlayerId
from .actor import RoomActor

CODE_LETTERS = "ABCDEFGHJKLMNPQRSTUVWXYZ"  # 去掉了容易看错的 I 和 O
CODE_LENGTH = 4


class RoomManager:
    def __init__(
        self,
        clock: Callable[[], float] = time.time,
        rng: random.Random | None = None,
        max_rooms: int = 1000,
    ) -> None:
        self._clock = clock
        self._rng = rng or secrets.SystemRandom()  # 发牌和房间号都不能被预测
        self._max_rooms = max_rooms
        self._actors: dict[str, RoomActor] = {}

    def create(self, host: PlayerId, name: str) -> str | None:
        """开房并返回房间号；房间数到了上限就返回 None。"""
        if len(self._actors) >= self._max_rooms:
            return None
        code = self._new_code()
        actor = RoomActor(Room.create(code, host, name, self._clock()), self._clock, self._rng)
        self._actors[code] = actor
        actor.start(on_exit=lambda: self._forget(code, actor))
        return code

    def get(self, code: str) -> RoomActor | None:
        return self._actors.get(code.upper())

    async def close(self) -> None:
        await asyncio.gather(*(actor.stop() for actor in list(self._actors.values())))

    def _forget(self, code: str, actor: RoomActor) -> None:
        if self._actors.get(code) is actor:
            del self._actors[code]

    def _new_code(self) -> str:
        while True:
            code = "".join(self._rng.choice(CODE_LETTERS) for _ in range(CODE_LENGTH))
            if code not in self._actors:
                return code

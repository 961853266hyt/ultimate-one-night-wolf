import random

import pytest

from app.runtime.manager import CODE_LETTERS, RoomManager
from tests.runtime.fakes import FakeClock, settle

pytestmark = pytest.mark.anyio


async def test_rooms_get_short_distinct_codes():
    manager = RoomManager(rng=random.Random(0))
    codes = [manager.create(f"p{i}", "阿胡") for i in range(100)]
    await manager.close()

    assert len(set(codes)) == 100
    assert all(code and len(code) == 4 and set(code) <= set(CODE_LETTERS) for code in codes)


async def test_codes_are_case_insensitive():
    manager = RoomManager()
    code = manager.create("p0", "阿胡")
    assert code is not None and manager.get(code.lower()) is manager.get(code)
    await manager.close()


async def test_the_number_of_rooms_is_capped():
    manager = RoomManager(max_rooms=1)
    assert manager.create("p0", "阿胡") is not None
    assert manager.create("p1", "小明") is None
    await manager.close()


async def test_a_room_that_closes_itself_is_forgotten():
    clock = FakeClock()
    manager = RoomManager(clock=clock)
    code = manager.create("p0", "阿胡")  # 开房的人一直没连上来
    assert code is not None
    actor = manager.get(code)
    assert actor is not None

    clock.now += 600
    actor.poke()
    await settle()

    assert manager.get(code) is None

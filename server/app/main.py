"""应用入口：uv run uvicorn app.main:create_app --factory"""

from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI

from .api import http, ws
from .api.auth import Auth
from .config import Config
from .runtime.manager import RoomManager


def create_app(config: Config | None = None) -> FastAPI:
    config = config or Config.from_env()
    manager = RoomManager(max_rooms=config.max_rooms)

    @asynccontextmanager
    async def lifespan(app: FastAPI) -> AsyncIterator[None]:
        yield
        await manager.close()

    app = FastAPI(title="ultimate-one-night-wolf", lifespan=lifespan)
    app.state.auth = Auth(config.secret_key)
    app.state.manager = manager
    app.include_router(http.router)
    app.include_router(ws.router)

    @app.get("/healthz")
    async def healthz() -> dict[str, bool]:
        return {"ok": True}

    return app

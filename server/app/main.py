"""应用入口：uv run uvicorn app.main:create_app --factory"""

import os
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.responses import FileResponse

from .api import http, ws
from .api.auth import Auth
from .config import Config
from .runtime.manager import RoomManager
from .version import VERSION


def create_app(config: Config | None = None) -> FastAPI:
    config = config or Config.from_env()
    manager = RoomManager(max_rooms=config.max_rooms)

    @asynccontextmanager
    async def lifespan(app: FastAPI) -> AsyncIterator[None]:
        yield
        await manager.close()

    app = FastAPI(title="ultimate-one-night-wolf", version=VERSION, lifespan=lifespan)
    app.state.auth = Auth(config.secret_key)
    app.state.manager = manager
    app.include_router(http.router)
    app.include_router(ws.router)

    @app.get("/healthz")
    async def healthz() -> dict[str, bool | str]:
        return {"ok": True, "version": VERSION}

    # 部署时由同一个进程托管前端构建产物（本地开发走 vite，不设这个变量）
    static_dir = os.environ.get("UONW_STATIC_DIR")
    if static_dir:
        _mount_spa(app, Path(static_dir))

    return app


def _mount_spa(app: FastAPI, root: Path) -> None:
    root = root.resolve()

    @app.get("/{path:path}", include_in_schema=False)
    async def spa(path: str) -> FileResponse:
        file = (root / path).resolve()
        if path and file.is_relative_to(root) and file.is_file():
            return FileResponse(file)
        return FileResponse(root / "index.html")  # /r/ABCD 这类前端路由

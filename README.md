# ultimate-one-night-wolf

网页版《一夜终极狼人》。React + FastAPI。

- `server/`：游戏服务端
- `docs/design.md`：系统设计

## 服务端

```bash
cd server
uv sync
uv run pytest
```

规则引擎在 `server/app/domain/`：纯 Python，不依赖网络，也不读时钟。

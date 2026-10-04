# ultimate-one-night-wolf

网页版《一夜终极狼人》。React + FastAPI。

- `server/`：游戏服务端
- `web/`：前端
- `docs/design.md`：系统设计

## 本地开发

两个终端：

```bash
cd server && uv run uvicorn app.main:create_app --factory --reload --port 8000
```

```bash
cd web && pnpm install && pnpm dev
```

打开 http://localhost:5173。前端通过 Vite 代理访问 `/api` 和 `/ws`，所以浏览器看来始终是同源的。

- **用手机玩**：手机和电脑连同一个 Wi-Fi，打开 `pnpm dev` 打印出来的 Network 地址
- **一个人测试多个玩家**：在网址后面加 `?as=2`、`?as=3`，同一个浏览器里就是不同的玩家
- **改了协议**：在 `web/` 下运行 `pnpm gen:types`，重新生成 `src/api/protocol.gen.ts`
- **加界面组件**：界面用 [shadcn/ui](https://ui.shadcn.com)（Base UI + Tailwind），在 `web/` 下运行 `pnpm dlx shadcn@latest add <组件名>`，生成的源码在 `src/components/ui/`

## 测试

```bash
cd server && uv run pytest
cd web && pnpm typecheck
```

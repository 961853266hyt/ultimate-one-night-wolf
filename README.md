# ultimate-one-night-wolf

网页版《一夜终极狼人》。React + FastAPI。

- `server/`：游戏服务端
- `web/`：前端
- `docs/design.md`：系统设计
- `CHANGELOG.md`：更新日志

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

## 发版

前后端共用一个版本号。平时把改动记在 `CHANGELOG.md` 的「未发布」下面，发版时：

1. 改 `server/pyproject.toml` 和 `web/package.json` 里的 `version`，再在 `server/` 下运行 `uv lock`
2. 把 CHANGELOG 的「未发布」改成版本号和日期，上面再留一个空的「未发布」
3. 提交，打 tag：`git tag -a v0.2.0 -m v0.2.0`，合到 main 后自动部署

两边版本号没改齐，`uv run pytest` 会报错。线上版本用 `curl <地址>/healthz` 查看。

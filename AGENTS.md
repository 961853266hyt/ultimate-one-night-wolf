# AGENTS.md

一夜终极狼人网页版：手机优先的 React 前端 + FastAPI 服务端，WebSocket 通信，一个容器部署。

## 目录

- `server/`：服务端（FastAPI + Pydantic，uv 管理）。分层 `api → runtime → protocol → domain`，只能往下依赖，`domain` 是纯 Python 规则，不碰网络和系统时钟
- `web/`：前端（React + Vite + Tailwind + shadcn/Base UI，pnpm 管理）
- `docs/design.md`：系统设计；`CONTRIBUTING.md`：开发流程；`CHANGELOG.md`：更新日志

## 常用命令

```bash
cd server && uv run uvicorn app.main:create_app --factory --reload --port 8000   # 后端
cd web && pnpm install && pnpm dev                                               # 前端，http://localhost:5173
cd server && uv run pytest     # 后端测试
cd web && pnpm typecheck       # 前端类型检查
cd web && pnpm gen:types       # 改了 server/app/protocol.py 之后重新生成 src/api/protocol.gen.ts
```

改完代码，提交前这两项检查都要通过：`uv run pytest` 和 `pnpm typecheck`。

## 必须守住的

- **服务端权威、信息不泄露**：客户端只发意图；服务端只把每个人自己能看到的信息发给他。不要把别人的身份放进任何发给客户端的数据里
- **状态只在内存、只跑一个进程**：不要加 `--workers`，也不要引入数据库
- 游戏规则写在服务端；前端关于角色的展示（名字、图标、说明）都在 `web/src/roles/catalog.ts`

## 代码风格

- 注释、界面文案用中文，跟周围代码的密度和语气保持一致
- 颜色只用 `web/src/index.css` 里的语义令牌（`bg-primary`、`text-werewolf`……），不直接写色值
- 界面按竖屏手机设计；优先复用 `components/ui`（shadcn）和 `components/layout` 里已有的组件
- 提交信息用英文祈使句，例如 `Add a menu drawer to the home page`

## 分支和发版

- 平时在 `develop` 上提交，发版时合进 `main`。**推送 `main` 会触发自动部署**，没被明确要求时不要推
- 每次改动都记到 `CHANGELOG.md` 的「未发布」下面，按 Added / Changed / Fixed / Removed 分类
- 发版：`server/pyproject.toml` 和 `web/package.json` 的版本号一起改，再在 `server/` 下运行 `uv lock`；CHANGELOG 的「未发布」改成版本号和日期；打 tag `vX.Y.Z`

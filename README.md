# 一夜终极狼人 · 网页版

<p align="center">
  <img src="web/public/icon.svg" width="96" alt="">
</p>

一个可以自己部署的《一夜终极狼人》（One Night Ultimate Werewolf）助手。大家围坐在一起，每人用手机打开同一个房间，网页替你发牌、按顺序叫醒角色、记录夜里发生的事、统计投票、公布结果，不用再找人当法官，也不用闭眼听 App 念台词。

- **不用注册**：打开网页起个名字就能玩，把房间号或链接发给朋友就能进房
- **手机优先**：界面为竖屏手机设计，可以添加到手机桌面当 App 用；断线、刷新、切后台回来都会回到原来的座位
- **信息不泄露**：服务端只把每个人自己能看到的信息发给他，抓包和看页面源码都看不出别人的身份
- **一个容器就能跑**：一条 `docker compose` 命令部署，不需要数据库，2 核 2G 的小服务器就够

## 支持的角色

| 类型 | 角色 |
| --- | --- |
| 基础版 | 狼人、爪牙、守夜人、预言家、强盗、捣蛋鬼、酒鬼、失眠者、猎人、皮匠、村民 |
| 扩展 | 女巫（破晓）、化身幽灵、模仿者（吸血鬼） |

支持 3–10 人。房主可以在大厅里自己配牌，默认按人数给出推荐牌组。

## 怎么玩

1. 一个人点「创建房间」，把房间链接或 4 位房间号发给其他人
2. 人到齐后，房主调整牌组（或者直接用推荐的），点开始
3. 每人看自己的牌，夜里轮到你时，手机会提示你行动
4. 天亮后大家自由讨论，然后同时投票，网页公布所有人的牌和夜里发生的全部事情

讨论和投票都不限时，节奏由大家自己掌握。如果夜里结束后所有人都是好人阵营，会跳过投票直接亮牌。

## 自己部署

需要一台装了 Docker 的服务器（或者你自己的电脑），开放 80 端口：

```bash
git clone https://github.com/961853266hyt/ultimate-one-night-wolf.git wolf
cd wolf
echo "UONW_SECRET_KEY=$(openssl rand -hex 32)" > .env
docker compose up -d --build
```

浏览器打开 `http://<服务器 IP>` 就能玩了。用 `curl http://<服务器 IP>/healthz` 可以检查服务是否正常、当前是哪个版本。

更新到最新版：

```bash
git pull && docker compose up -d --build
```

### 在海外服务器上构建

为了照顾国内服务器，Dockerfile 默认从国内镜像源下载依赖。服务器在海外的话，改用官方源会更快：

```bash
docker compose build \
  --build-arg DOCKER_REGISTRY=docker.io \
  --build-arg NPM_REGISTRY=https://registry.npmjs.org \
  --build-arg PYPI_INDEX=https://pypi.org/simple
docker compose up -d
```

### 配置

在 `.env` 里设置：

| 变量 | 说明 | 默认值 |
| --- | --- | --- |
| `UONW_SECRET_KEY` | 签发访客身份用的密钥。**请固定设置**，否则每次重启都会随机生成，所有玩家的身份都会失效 | 每次启动随机生成 |
| `UONW_MAX_ROOMS` | 同时存在的房间数上限 | `1000` |

想改端口的话，修改 `docker-compose.yml` 里的 `"80:8000"`，比如改成 `"8080:8000"`。

### 注意事项

- **房间状态只存在内存里**：重启或更新时，正在进行的对局会丢失，建议在没人玩的时候操作
- **只能跑一个进程**：不要加 `--workers`，也不要开多个副本
- 邀请链接和 WebSocket 地址都根据当前访问的域名自动生成，换域名、加 HTTPS 都不用改代码。想要 HTTPS，可以在容器前面加一层 Caddy 或 Nginx（记得转发 WebSocket）

一步步的服务器部署教程（以阿里云轻量应用服务器为例）见 [docs/deploy.md](docs/deploy.md)。

### 推送代码后自动部署（可选）

仓库自带一个 GitHub Actions 工作流 [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml)：推送到 `main` 后，在 Actions 上构建镜像，再通过 SSH 发到你的服务器重启。fork 之后，在仓库的 Settings → Secrets 里配置：

| Secret | 说明 |
| --- | --- |
| `SSH_HOST` | 服务器地址，用 root 登录 |
| `SSH_PRIVATE_KEY` | 登录服务器用的私钥 |
| `UONW_SECRET_KEY` | 可选；不配的话第一次部署时在服务器上随机生成一个 |

## 参与开发

技术栈是 React + FastAPI，前后端通过 WebSocket 通信。本地开发、测试和发版流程见 [CONTRIBUTING.md](CONTRIBUTING.md)，系统设计见 [docs/design.md](docs/design.md)，每个版本的改动见 [CHANGELOG.md](CHANGELOG.md)。

欢迎提 Issue 和 Pull Request。

# 部署到阿里云轻量应用服务器

一个容器同时跑后端（FastAPI + WebSocket）并托管前端静态文件，不需要 nginx。

## 1. 买/领服务器

- 控制台选 **轻量应用服务器**，地域选离朋友近的国内节点。
- 镜像选 **Docker 基础镜像**（应用镜像里），省得自己装 Docker。选 Ubuntu 也行，见下方第 2 步。
- 2核2G 就够。

## 2. 放行端口

控制台 → 服务器 → **防火墙** → 添加规则：TCP 80（用 HTTP 访问）。

## 3. 登录并装 Docker（用了 Docker 镜像可跳过）

```bash
ssh root@<公网IP>
curl -fsSL https://get.docker.com | sh
```

国内服务器拉 Docker Hub 镜像可能很慢，在控制台 → 镜像加速器里拿到你的专属加速地址，写入：

```bash
mkdir -p /etc/docker
echo '{"registry-mirrors":["https://<你的加速地址>"]}' > /etc/docker/daemon.json
systemctl restart docker
```

## 4. 拉代码并启动

```bash
git clone <你的仓库地址> wolf && cd wolf
echo "UONW_SECRET_KEY=$(openssl rand -hex 32)" > .env
docker compose up -d --build
```

浏览器打开 `http://<公网IP>`，把房间链接发给朋友即可。

> 首次构建要下载 node/python 基础镜像和依赖，国内可能要几分钟。
> 仓库没放 GitHub 的话，可以在本机 `rsync -az --exclude node_modules --exclude .venv --exclude web/dist ./ root@<IP>:~/wolf/` 上传。

## 5. 日常运维

```bash
docker compose logs -f           # 看日志
docker compose restart           # 重启（进行中的房间会丢，状态在内存里）
git pull && docker compose up -d --build   # 更新版本
curl localhost/healthz           # 健康检查
```

## 注意

- **只能单实例、单进程**：房间状态在内存里，别加 `--workers` 或多副本。
- `.env` 里的 `UONW_SECRET_KEY` 要固定。不设的话每次重启都会随机生成，所有人的访客身份失效。
- 用 IP + HTTP 访问不需要备案。想用域名必须先备案；要 HTTPS 则需域名和证书（可在容器前加 Caddy）。
- 复制邀请链接、WebSocket 都用当前页面的 host 自动推导，不用改前端配置。

## 配置

在 `.env` 里设置：

| 变量 | 说明 | 默认值 |
| --- | --- | --- |
| `UONW_SECRET_KEY` | 签发访客身份用的密钥，**请固定设置** | 每次启动随机生成 |
| `UONW_MAX_ROOMS` | 同时存在的房间数上限 | `1000` |

想改端口，修改 `docker-compose.yml` 里的 `"80:8000"`，比如改成 `"8080:8000"`。

## 在海外服务器上构建

Dockerfile 默认从国内镜像源下载依赖。服务器在海外的话，改用官方源会更快：

```bash
docker compose build \
  --build-arg DOCKER_REGISTRY=docker.io \
  --build-arg NPM_REGISTRY=https://registry.npmjs.org \
  --build-arg PYPI_INDEX=https://pypi.org/simple
docker compose up -d
```

## 推送代码后自动部署（可选）

仓库自带 GitHub Actions 工作流 `.github/workflows/deploy.yml`：推送到 `main` 后在 Actions 上构建镜像，再通过 SSH 发到服务器重启。在仓库的 Settings → Secrets 里配置：

| Secret | 说明 |
| --- | --- |
| `SSH_HOST` | 服务器地址，用 root 登录 |
| `SSH_PRIVATE_KEY` | 登录服务器用的私钥 |
| `UONW_SECRET_KEY` | 可选；不配的话第一次部署时在服务器上随机生成一个 |

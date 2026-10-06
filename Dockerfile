# 默认使用国内镜像源（国内服务器直连 Docker Hub / npm / PyPI 官方源很慢甚至超时）；
# 在海外部署时可覆盖：
#   --build-arg DOCKER_REGISTRY=docker.io --build-arg NPM_REGISTRY=https://registry.npmjs.org
#   --build-arg PYPI_INDEX=https://pypi.org/simple
ARG DOCKER_REGISTRY=docker.m.daocloud.io
ARG NPM_REGISTRY=https://registry.npmmirror.com
ARG PYPI_INDEX=https://mirrors.aliyun.com/pypi/simple/

# 阶段 1：构建前端
FROM ${DOCKER_REGISTRY}/library/node:22-slim AS web
ARG NPM_REGISTRY
ENV COREPACK_NPM_REGISTRY=${NPM_REGISTRY}
RUN corepack enable
WORKDIR /web
COPY web/package.json web/pnpm-lock.yaml ./
RUN pnpm config set registry ${NPM_REGISTRY} && pnpm install --frozen-lockfile
COPY web/ ./
RUN pnpm build

# 阶段 2：后端 + 托管前端静态文件
FROM ${DOCKER_REGISTRY}/library/python:3.13-slim
ARG PYPI_INDEX
ENV UV_DEFAULT_INDEX=${PYPI_INDEX} PIP_INDEX_URL=${PYPI_INDEX}
RUN pip install --no-cache-dir uv
WORKDIR /app
COPY server/pyproject.toml server/uv.lock ./
# uv.lock 里记录的是官方源下载地址，先导出成 requirements，才能走上面的镜像源
RUN uv export --frozen --no-dev --no-hashes --no-emit-project -o requirements.txt \
 && uv venv && uv pip install -r requirements.txt
COPY server/app ./app
COPY --from=web /web/dist ./static
ENV UONW_STATIC_DIR=/app/static PATH="/app/.venv/bin:$PATH"
EXPOSE 8000
# 房间状态在进程内存里，只能单进程，不要加 --workers
CMD ["uvicorn", "app.main:create_app", "--factory", "--host", "0.0.0.0", "--port", "8000"]

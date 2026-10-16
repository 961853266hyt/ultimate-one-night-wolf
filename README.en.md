# One Night Ultimate Werewolf · Web

[简体中文](README.md) | English

<p align="center">
  <img src="web/public/icon.svg" width="96" alt="">
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white" alt="React">
  <img src="https://img.shields.io/badge/FastAPI-009688?logo=fastapi&logoColor=white" alt="FastAPI">
  <img src="https://img.shields.io/badge/WebSocket-010101" alt="WebSocket">
</p>

A self-hosted companion for the board game *One Night Ultimate Werewolf*

## Screenshots

<p align="center">
  <img src="docs/screenshots/en-wake.png" width="260" alt="Waking the werewolves: full-screen Werewolf card and &quot;Werewolf, wake up&quot;">
  <img src="docs/screenshots/en-night.png" width="260" alt="The center cards at night: three glowing card backs">
</p>

## Deploy

```bash
git clone https://github.com/961853266hyt/ultimate-one-night-wolf.git wolf && cd wolf
echo "UONW_SECRET_KEY=$(openssl rand -hex 32)" > .env
docker compose up -d --build
```

The Dockerfile downloads dependencies from mirrors in mainland China by default. Outside China, build from the official registries instead:

```bash
docker compose build \
  --build-arg DOCKER_REGISTRY=docker.io \
  --build-arg NPM_REGISTRY=https://registry.npmjs.org \
  --build-arg PYPI_INDEX=https://pypi.org/simple
docker compose up -d
```

## Architecture

```mermaid
flowchart LR
  P["Players' phones<br/>React"] -- "HTTP /api<br/>WebSocket /ws" --> G
  subgraph C["Docker container · one process · state in memory"]
    G["FastAPI gateway<br/>auth · validation"] --> R["Room actor<br/>one per room"]
    R --> D["Rules engine<br/>pure Python"]
  end
  R -. "each player gets only what they may see" .-> P
```

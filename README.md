# 一夜终极狼人 · 网页版

简体中文 | [English](README.en.md)

<p align="center">
  <img src="web/public/icon.svg" width="96" alt="">
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white" alt="React">
  <img src="https://img.shields.io/badge/FastAPI-009688?logo=fastapi&logoColor=white" alt="FastAPI">
  <img src="https://img.shields.io/badge/WebSocket-010101" alt="WebSocket">
</p>

一个自部署的《一夜终极狼人》桌游助手

## 截图

<p align="center">
  <img src="docs/screenshots/zh-wake.png" width="260" alt="夜里叫醒狼人：全屏显示狼人卡图和「狼人请睁眼」">
  <img src="docs/screenshots/zh-night.png" width="260" alt="夜里的牌堆：三张带绿光的卡背">
</p>

## 部署

```bash
git clone https://github.com/961853266hyt/ultimate-one-night-wolf.git wolf && cd wolf
echo "UONW_SECRET_KEY=$(openssl rand -hex 32)" > .env
docker compose up -d --build
```

## 架构

```mermaid
flowchart LR
  P["玩家手机<br/>React"] -- "HTTP /api<br/>WebSocket /ws" --> G
  subgraph C["Docker 容器 · 单进程 · 状态在内存"]
    G["FastAPI 网关<br/>鉴权 · 校验"] --> R["房间 Actor<br/>每个房间一个"]
    R --> D["规则引擎<br/>纯 Python"]
  end
  R -. "每人只收到自己能看的视图" .-> P
```

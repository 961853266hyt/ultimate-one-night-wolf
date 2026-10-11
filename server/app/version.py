"""版本号，前后端共用一个：发版时 pyproject.toml 和 web/package.json 一起改，测试会检查两边一致。"""

import tomllib
from pathlib import Path

# 本地开发和 Docker 镜像里，pyproject.toml 都在 app/ 的上一级
_PYPROJECT = Path(__file__).resolve().parents[1] / "pyproject.toml"

VERSION: str = tomllib.loads(_PYPROJECT.read_text(encoding="utf-8"))["project"]["version"]

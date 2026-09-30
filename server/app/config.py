"""运行配置，全部来自环境变量。"""

import os
import secrets
from dataclasses import dataclass
from typing import Self


@dataclass(frozen=True)
class Config:
    secret_key: str
    max_rooms: int = 1000

    @classmethod
    def from_env(cls) -> Self:
        # 没配密钥就每次启动随机生成一个：不会被伪造，代价是重启后所有访客身份都会失效
        return cls(
            secret_key=os.environ.get("UONW_SECRET_KEY") or secrets.token_urlsafe(32),
            max_rooms=int(os.environ.get("UONW_MAX_ROOMS", "1000")),
        )

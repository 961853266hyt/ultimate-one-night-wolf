"""访客身份。token = player_id + HMAC 签名，服务端不用保存任何东西。"""

import base64
import hashlib
import hmac
import secrets

from ..domain.types import PlayerId


class Auth:
    def __init__(self, secret: str) -> None:
        self._key = secret.encode()

    def issue(self) -> tuple[PlayerId, str]:
        player = f"p_{secrets.token_hex(6)}"
        return player, self._sign(player)

    def verify(self, token: str) -> PlayerId | None:
        player, _, _ = token.partition(".")
        if player and hmac.compare_digest(self._sign(player).encode(), token.encode()):
            return player
        return None

    def _sign(self, player: PlayerId) -> str:
        mac = hmac.new(self._key, player.encode(), hashlib.sha256).digest()
        return f"{player}.{base64.urlsafe_b64encode(mac).rstrip(b'=').decode()}"

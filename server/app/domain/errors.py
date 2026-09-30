from enum import StrEnum


class ErrorCode(StrEnum):
    NOT_MEMBER = "not_member"
    NOT_HOST = "not_host"
    NOT_PLAYING = "not_playing"
    WRONG_PHASE = "wrong_phase"
    ROOM_FULL = "room_full"
    GAME_IN_PROGRESS = "game_in_progress"
    PLAYER_COUNT = "player_count"
    PLAYERS_OFFLINE = "players_offline"
    DECK_SIZE = "deck_size"
    TOO_MANY_COPIES = "too_many_copies"
    UNKNOWN_PLAYER = "unknown_player"
    CANNOT_KICK_SELF = "cannot_kick_self"
    NOT_YOUR_TURN = "not_your_turn"
    ALREADY_ACTED = "already_acted"
    BAD_TARGETS = "bad_targets"
    ALREADY_VOTED = "already_voted"


class RuleError(Exception):
    """指令违反了游戏规则。"""

    def __init__(self, code: ErrorCode) -> None:
        super().__init__(code)
        self.code = code

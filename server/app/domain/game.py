"""一局游戏的状态机：deal → night[1..k] → day → vote → reveal。

夜里过后玩家手里全是好人，就跳过 day 和 vote 直接 reveal，好人赢。这是家规，官方规则照样投票。

时间（now）和随机数（rng）都由调用方传入，这里不读时钟，也不用全局随机数。
"""

import random
from typing import Self

from pydantic import BaseModel, Field

from . import night, rules
from .errors import ErrorCode, RuleError
from .roles import ROLES
from .rules import Result
from .types import CENTER, Knowledge, Phase, PlayerId, Prompt, RoleId, Slot, Timings


class NightLogEntry(BaseModel):
    step: RoleId
    player: PlayerId
    targets: list[Slot]
    auto: bool = False  # 超时后由系统代选
    learned: list[Knowledge] = Field(default_factory=list)  # 这次行动得知的信息，揭晓时逐条描述


class Game(BaseModel):
    players: list[PlayerId]  # 座位顺序
    timings: Timings
    dealt: dict[Slot, RoleId]  # 发牌时每个位置上的牌
    cards: dict[Slot, RoleId]  # 现在每个位置上的牌，夜里会被换
    phase: Phase = Phase.DEAL
    ends_at: float | None = None
    night_plan: list[RoleId] = Field(default_factory=list)
    night_index: int = 0
    acted: set[PlayerId] = Field(default_factory=set)  # 当前这一步里行动过的人
    knowledge: dict[PlayerId, list[Knowledge]] = Field(default_factory=dict)
    night_log: list[NightLogEntry] = Field(default_factory=list)
    confirmed: set[PlayerId] = Field(default_factory=set)  # deal 阶段看好牌的人
    ready: set[PlayerId] = Field(default_factory=set)  # day 阶段同意投票的人
    votes: dict[PlayerId, PlayerId] = Field(default_factory=dict)
    result: Result | None = None

    @classmethod
    def deal(
        cls,
        players: list[PlayerId],
        deck: list[RoleId],
        timings: Timings,
        rng: random.Random,
    ) -> Self:
        if len(deck) != len(players) + len(CENTER):
            raise RuleError(ErrorCode.DECK_SIZE)
        cards = list(deck)
        rng.shuffle(cards)
        dealt = dict(zip([*players, *CENTER], cards, strict=True))
        # 看牌不限时，所有人都点了「我记住了」才入夜
        return cls(
            players=list(players),
            timings=timings,
            dealt=dealt,
            cards=dict(dealt),
            night_plan=night.plan_for(deck),
        )

    # ------------------------------------------------------------ 查询

    @property
    def night_role(self) -> RoleId | None:
        return self.night_plan[self.night_index] if self.phase is Phase.NIGHT else None

    def acting_role(self, player: PlayerId) -> RoleId:
        """夜里以什么身份行动：发到的牌，而不是现在手里的牌。"""
        return self.dealt[player]

    def players_acting_as(self, role: RoleId) -> list[PlayerId]:
        return [p for p in self.players if self.acting_role(p) == role]

    def wakers(self) -> list[PlayerId]:
        role = self.night_role
        return [] if role is None else self.players_acting_as(role)

    def prompt_for(self, player: PlayerId) -> Prompt | None:
        role = self.night_role
        if role is None or player not in self.wakers():
            return None
        return ROLES[role].prompt(self, player)

    def swap(self, a: Slot, b: Slot) -> None:
        self.cards[a], self.cards[b] = self.cards[b], self.cards[a]

    # ------------------------------------------------------------ 玩家指令

    def confirm_card(self, player: PlayerId, now: float) -> None:
        self._expect(Phase.DEAL, player)
        self.confirmed.add(player)
        if self.confirmed >= set(self.players):
            self._enter_night(now)

    def night_action(self, player: PlayerId, targets: list[Slot]) -> None:
        self._expect(Phase.NIGHT, player)
        prompt = self.prompt_for(player)
        if prompt is None:
            acted = player in self.acted
            raise RuleError(ErrorCode.ALREADY_ACTED if acted else ErrorCode.NOT_YOUR_TURN)
        night.check_targets(self.players, player, prompt, targets)
        self._perform(player, targets)
        # 不动 ends_at：每一步都要走满，提前结束等于告诉所有人这个角色不在底牌里

    def ready_to_vote(self, player: PlayerId, now: float) -> None:
        self._expect(Phase.DAY, player)
        self.ready.add(player)
        if self.ready >= set(self.players):
            self._enter_vote(now)

    def vote(self, player: PlayerId, target: PlayerId, now: float) -> None:
        self._expect(Phase.VOTE, player)
        if player in self.votes:
            raise RuleError(ErrorCode.ALREADY_VOTED)
        if target == player or target not in self.players:
            raise RuleError(ErrorCode.BAD_TARGETS)
        self.votes[player] = target
        if len(self.votes) == len(self.players):
            self._reveal()

    # ------------------------------------------------------------ 时钟

    def tick(self, now: float, rng: random.Random) -> None:
        """夜里这一步到了截止时间就进入下一步，新的一步从 now 开始计时。只有夜里限时。"""
        if self.phase is not Phase.NIGHT or self.ends_at is None or now < self.ends_at:
            return
        self._finish_step(rng)
        if self.night_index + 1 < len(self.night_plan):
            self.night_index += 1
            self._enter_step(now)
        else:
            self._end_night(now)

    # ------------------------------------------------------------ 内部

    def _expect(self, phase: Phase, player: PlayerId) -> None:
        if player not in self.players:
            raise RuleError(ErrorCode.NOT_PLAYING)
        if self.phase is not phase:
            raise RuleError(ErrorCode.WRONG_PHASE)

    def _enter_night(self, now: float) -> None:
        if not self.night_plan:
            self._end_night(now)
            return
        self.phase = Phase.NIGHT
        self.night_index = 0
        self._enter_step(now)

    def _enter_step(self, now: float) -> None:
        self.acted = set()
        self.ends_at = now + self.timings.night_step
        role = ROLES[self.night_plan[self.night_index]]
        for player in self.wakers():
            self._learn(player, role.wake_info(self, player))

    def _finish_step(self, rng: random.Random) -> None:
        for player in self.wakers():
            prompt = self.prompt_for(player)
            if prompt is not None and prompt.required:
                targets = night.random_targets(self.players, player, prompt, rng)
                self._perform(player, targets, auto=True)

    def _perform(self, player: PlayerId, targets: list[Slot], auto: bool = False) -> None:
        role = ROLES[self.night_plan[self.night_index]]
        facts = role.act(self, player, targets)
        self._learn(player, facts)
        self.acted.add(player)
        entry = NightLogEntry(
            step=role.id, player=player, targets=targets, auto=auto, learned=facts
        )
        self.night_log.append(entry)

    def _learn(self, player: PlayerId, facts: list[Knowledge]) -> None:
        if facts:
            self.knowledge.setdefault(player, []).extend(facts)

    def _end_night(self, now: float) -> None:
        # 看的是夜里换完之后的牌：酒鬼可能从底牌换来一张狼
        if rules.all_village(self.cards, self.players):
            self._reveal()  # 没有票，没人出局，好人赢
        else:
            self._enter_day(now)

    def _enter_day(self, now: float) -> None:
        self.phase = Phase.DAY
        self.ends_at = None  # 讨论不限时，所有人都同意投票才进入投票

    def _enter_vote(self, now: float) -> None:
        self.phase = Phase.VOTE
        self.ends_at = None  # 投票也不限时，所有人都投完才揭晓

    def _reveal(self) -> None:
        self.result = rules.resolve(self.cards, self.players, self.votes)
        self.phase = Phase.REVEAL
        self.ends_at = None

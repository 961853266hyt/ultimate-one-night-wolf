/** 夜里得到的信息，变成给人看的「线索」。 */
import { CENTER, type Copied, type Knowledge, type PlayerView, type RoleId } from '@/api/types'
import { t } from '@/i18n'
import type { Phrase } from './phrase'
import { slotLabeler, type SlotLabeler } from './seats'

export interface Clue {
  /** 在哪个角色的回合得知的。 */
  step: RoleId
  text: Phrase
}

/** 我这一局夜里得知的全部线索，按得知的先后排。 */
export function cluesOf(view: PlayerView): Clue[] {
  const label = slotLabeler(view)
  return view.me.knowledge.map((fact) => ({
    step: fact.step,
    text: describeKnowledge(fact, view.me.id, label),
  }))
}

/** 用「我」的口吻描述一条信息。 */
export function describeKnowledge(fact: Knowledge, me: string, label: SlotLabeler): Phrase {
  const text = t().clues
  switch (fact.type) {
    case 'saw_card':
      return fact.slot === me ? text.yourCardNow(fact.role) : text.slotIs(label(fact.slot), fact.role)
    case 'saw_players': {
      const names = fact.players.map(label)
      if (fact.step === 'werewolf') return text.wolfMates(names)
      if (fact.step === 'minion') return text.wolvesAre(names)
      return text.alsoRole(names, fact.role)
    }
    case 'swapped': {
      const [a, b] = fact.slots
      if (a === me) return text.youSwappedWith(label(b))
      if (b === me) return text.youSwappedWith(label(a)) // 女巫把底牌换给了自己
      return text.youSwapped(label(a), label(b))
    }
    case 'copied':
      return text.copied(label(fact.slot), isCenter(fact.slot), fact.step !== 'copycat', fact.role)
  }
}

/**
 * 夜间记录里的「看了 A 号底牌，变成了狼人」（模仿者）、「看了 2 号阿杰的牌，化身成了预言家」（化身幽灵）。
 * 前面不带主语，由夜间记录补上是谁。
 */
export function describeCopy(fact: Copied, label: SlotLabeler): Phrase {
  return t().log.copied(label(fact.slot), isCenter(fact.slot), fact.step !== 'copycat', fact.role)
}

export interface CenterSightings {
  /** 这一步翻开看到、现在还在原处的底牌。自己接着又换走的（女巫）不算，那个位置已经是别的牌了。 */
  now: Map<string, RoleId>
  /** 更早的步骤里看过的底牌。现在可能已经被别人换过，只标一下看过。 */
  before: Set<string>
}

/** 夜里看过哪些底牌。step 是现在这一步。 */
export function centerSightings(knowledge: readonly Knowledge[], step: RoleId): CenterSightings {
  const now = new Map<string, RoleId>()
  const before = new Set<string>()
  for (const fact of knowledge) {
    if ((fact.type === 'saw_card' || fact.type === 'copied') && isCenter(fact.slot)) {
      if (fact.step === step) now.set(fact.slot, fact.role)
      else before.add(fact.slot)
    }
  }
  for (const fact of knowledge) {
    if (fact.type === 'swapped' && fact.step === step) fact.slots.forEach((slot) => now.delete(slot))
  }
  now.forEach((_, slot) => before.delete(slot))
  return { now, before }
}

function isCenter(slot: string): boolean {
  return (CENTER as readonly string[]).includes(slot)
}

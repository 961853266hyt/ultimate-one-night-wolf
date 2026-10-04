/** 夜里得到的信息，变成给人看的「线索」。 */
import type { Knowledge, PlayerView, RoleId } from '@/api/types'
import { mention, type Phrase } from './phrase'
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
  switch (fact.type) {
    case 'saw_card':
      return fact.slot === me
        ? ['你现在手里的牌是', mention(fact.role)]
        : [`${label(fact.slot)}是`, mention(fact.role)]
    case 'saw_players': {
      const names = fact.players.map(label).join('、')
      if (fact.step === 'werewolf') return [names ? `你的狼同伴：${names}` : '你是唯一的狼']
      if (fact.step === 'minion') return [names ? `狼是：${names}` : '没有玩家拿着狼牌']
      return names
        ? [`${names}也是`, mention(fact.role)]
        : ['另一张', mention(fact.role), '在底牌里']
    }
    case 'swapped': {
      const [a, b] = fact.slots
      return a === me ? [`你和${label(b)}换了牌`] : [`你交换了${label(a)}和${label(b)}的牌`]
    }
  }
}

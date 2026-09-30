import { CENTER, type Knowledge, type MemberView, type PlayerView } from '../api/types'
import { ROLE_NAME } from './text'

/** 这一局的玩家，按座位排好。 */
export function seated(view: PlayerView): MemberView[] {
  return view.room.members
    .filter((member) => member.seat !== null)
    .sort((a, b) => (a.seat ?? 0) - (b.seat ?? 0))
}

/** 一个位置的称呼：玩家的名字、「你」，或者「底牌 2」。 */
export function slotName(view: PlayerView, slot: string): string {
  if (slot === view.me.id) return '你'
  const center = (CENTER as readonly string[]).indexOf(slot)
  if (center >= 0) return `底牌 ${center + 1}`
  return view.room.members.find((member) => member.id === slot)?.name ?? '?'
}

export function describeKnowledge(view: PlayerView, fact: Knowledge): string {
  const name = (slot: string) => slotName(view, slot)
  switch (fact.type) {
    case 'saw_card':
      return fact.slot === view.me.id
        ? `你现在手里的牌是${ROLE_NAME[fact.role]}`
        : `${name(fact.slot)}是${ROLE_NAME[fact.role]}`
    case 'saw_players': {
      const names = fact.players.map(name).join('、')
      if (fact.step === 'werewolf') return names ? `你的狼同伴：${names}` : '你是唯一的狼'
      if (fact.step === 'minion') return names ? `狼是：${names}` : '没有玩家拿着狼牌'
      return names ? `${names}也是${ROLE_NAME[fact.role]}` : `另一张${ROLE_NAME[fact.role]}在底牌里`
    }
    case 'swapped': {
      const [a, b] = fact.slots
      return a === view.me.id ? `你和${name(b)}换了牌` : `你交换了${name(a)}和${name(b)}的牌`
    }
  }
}

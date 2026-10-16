/**
 * 座位和称呼。
 *
 * 界面组件只认这里的 Seat，不直接读 PlayerView：服务端的视图怎么变，改这一个文件就够了。
 */
import { CENTER, type MemberView, type PlayerView } from '@/api/types'
import { t } from '@/i18n'

/** 牌桌上的一个座位。 */
export interface Seat {
  /** 玩家 id，也是这个座位在协议里的 slot。 */
  id: string
  /** 给人看的座位号，从 1 开始。 */
  number: number
  name: string
  online: boolean
  isMe: boolean
  isHost: boolean
  /** 机器人：房主替它操作。 */
  isBot: boolean
}

/**
 * 在座的玩家，按座位号排好。
 *
 * 大厅里是各自选的座位，中间可以有空座位；开局之后是这一局的座位，中途进来旁观的人不算。
 */
export function seatsOf(view: PlayerView): Seat[] {
  const toSeat = (member: MemberView, number: number): Seat => ({
    id: member.id,
    number,
    name: memberName(member),
    online: member.online,
    isMe: member.id === view.me.id,
    isHost: member.id === view.room.host,
    isBot: member.bot,
  })

  return view.room.members
    .flatMap((member) => (member.seat === null ? [] : [toSeat(member, member.seat + 1)]))
    .sort((a, b) => a.number - b.number)
}

/** 「2 号阿杰」。 */
export function seatLabel(seat: Seat): string {
  return t().seat.label(seat.number, seat.name)
}

/**
 * 给人看的名字。机器人的名字是服务端用中文起的（「机器人2」），这里按 id 里的编号用当前语言重新叫。
 */
export function memberName(member: MemberView): string {
  const number = member.bot ? Number(member.id.replace(/^bot-/, '')) : NaN
  return Number.isInteger(number) ? t().seat.bot(number) : member.name
}

/** 底牌的字母：C0、C1、C2 依次是 A、B、C。 */
export function centerLetter(slot: string): string {
  return String.fromCharCode(65 + (CENTER as readonly string[]).indexOf(slot))
}

export function isCenter(slot: string): boolean {
  return (CENTER as readonly string[]).includes(slot)
}

/** 把 slot 变成称呼的函数。 */
export type SlotLabeler = (slot: string) => string

/**
 * 句子里怎么称呼一个位置：自己是「你」，其他人是「2 号阿杰」，底牌是「A 号底牌」。
 * 先建好再反复用，免得每次都去找座位。
 */
export function slotLabeler(view: PlayerView): SlotLabeler {
  const seats = new Map(seatsOf(view).map((seat) => [seat.id, seat]))
  return (slot) => {
    if (slot === view.me.id) return t().seat.you
    if (isCenter(slot)) return t().seat.center(centerLetter(slot))
    const seat = seats.get(slot)
    return seat ? seatLabel(seat) : '?'
  }
}

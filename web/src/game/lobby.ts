/** 大厅里的规则：能不能开局、要几张牌。合不合法最终由服务端判断。 */
import { CENTER, type RoleId } from '@/api/types'
import type { Seat } from './seats'

export const MIN_PLAYERS = 3
export const MAX_PLAYERS = 10

/** 服务端接受的牌数：最少人数和最多人数时各要几张。 */
export const MIN_DECK = MIN_PLAYERS + CENTER.length
export const MAX_DECK = MAX_PLAYERS + CENTER.length

/** 这么多人要几张牌：每人 1 张，再加 3 张底牌。不到 3 人时按 3 人算，和服务端推荐的牌堆一致。 */
export function deckSizeFor(players: number): number {
  return Math.min(Math.max(players, MIN_PLAYERS), MAX_PLAYERS) + CENTER.length
}

/** 还不能开局的原因；可以开局时返回 null。房间有 size 个座位，坐满才能开局。 */
export function startBlocker(seats: readonly Seat[], size: number, deck: readonly RoleId[]): string | null {
  if (seats.length < size) return `还差 ${size - seats.length} 人坐满`
  const offline = seats.filter((seat) => !seat.online)
  if (offline.length) return `${offline.map((seat) => seat.name).join('、')}离线，回来后才能开始`
  const missing = deckSizeFor(size) - deck.length
  if (missing > 0) return `牌少了 ${missing} 张，补上才能开始`
  if (missing < 0) return `牌多了 ${-missing} 张，拿掉才能开始`
  return null
}

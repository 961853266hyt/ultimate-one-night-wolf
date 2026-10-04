/** 大厅里的规则：能不能开局、要画几个空座位。合不合法最终由服务端判断。 */
import type { Seat } from './seats'

export const MIN_PLAYERS = 3
export const MAX_PLAYERS = 10

/** 还不能开局的原因；可以开局时返回 null。 */
export function startBlocker(seats: readonly Seat[]): string | null {
  if (seats.length < MIN_PLAYERS) {
    return `还差 ${MIN_PLAYERS - seats.length} 人，至少 ${MIN_PLAYERS} 人才能开始`
  }
  if (seats.length > MAX_PLAYERS) return `最多 ${MAX_PLAYERS} 人`
  const offline = seats.filter((seat) => !seat.online)
  if (offline.length) return `${offline.map((seat) => seat.name).join('、')}离线，回来后才能开始`
  return null
}

/** 座位凑满一整行，并且至少留一个空位提醒还能拉人，直到满员。 */
export function emptySeatCount(taken: number): number {
  const shown = Math.min(MAX_PLAYERS, Math.ceil((taken + 1) / 3) * 3)
  return Math.max(0, shown - taken)
}

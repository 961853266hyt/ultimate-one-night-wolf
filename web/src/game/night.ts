/** 夜里的唤醒顺序。 */
import type { RoleId } from '@/api/types'

/** 和服务端 server/app/domain/night.py 的 NIGHT_ORDER 保持一致。不在这里的角色夜里不醒。 */
export const NIGHT_ORDER: readonly RoleId[] = [
  'werewolf',
  'minion',
  'mason',
  'seer',
  'robber',
  'troublemaker',
  'drunk',
  'insomniac',
]

/** 这副牌里夜里会醒的角色，按唤醒顺序每种一个。牌堆是公开的，所以大家都可以看。 */
export function nightPlan(deck: readonly RoleId[]): RoleId[] {
  return NIGHT_ORDER.filter((role) => deck.includes(role))
}

/** 这个角色这局夜里第几个醒，从 1 开始；夜里不醒就是 null。 */
export function wakeOrder(deck: readonly RoleId[], role: RoleId): number | null {
  const index = nightPlan(deck).indexOf(role)
  return index >= 0 ? index + 1 : null
}

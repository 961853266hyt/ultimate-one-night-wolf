/** 牌堆。 */
import type { RoleId } from '@/api/types'

/** 牌堆里每种角色各有几张，按第一次出现的顺序。 */
export function countRoles(deck: readonly RoleId[]): [RoleId, number][] {
  const counts = new Map<RoleId, number>()
  for (const role of deck) counts.set(role, (counts.get(role) ?? 0) + 1)
  return [...counts]
}

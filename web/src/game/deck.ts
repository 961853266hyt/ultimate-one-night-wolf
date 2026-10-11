/**
 * 牌盒和牌堆。
 *
 * 服务端的牌堆只是一串角色，两张狼人就是两个 werewolf。配牌时把它当成一盒实体牌：
 * 同一种角色有几张就是几张，各有各的 id，牌库里点了哪张、本局里拿掉哪张都分得清。
 */
import type { RoleId } from '@/api/types'
import { ROLES } from '@/roles/catalog'

/** 牌盒里的一张牌。 */
export interface BoxCard {
  /** 比如 villager-2。 */
  id: string
  role: RoleId
  /** 这种角色的第几张，从 1 开始。 */
  copy: number
}

/** 牌盒里所有的牌：每个角色放满张数上限，按角色目录的顺序排。牌库和本局都按这个顺序摆。 */
export const CARD_BOX: readonly BoxCard[] = (Object.keys(ROLES) as RoleId[]).flatMap((role) =>
  Array.from({ length: ROLES[role].maxCopies }, (_, index) => ({
    id: `${role}-${index + 1}`,
    role,
    copy: index + 1,
  })),
)

/** 配牌时和这张牌一起进出的牌，包括它自己。成对的角色第 1、2 张是一对，第 3、4 张是一对。 */
export function cardsMovedWith(card: BoxCard): string[] {
  if (!ROLES[card.role].pairs) return [card.id]
  const pair = Math.ceil(card.copy / 2)
  return CARD_BOX.filter((other) => other.role === card.role && Math.ceil(other.copy / 2) === pair)
    .map((other) => other.id)
}

/** 牌堆用的是牌盒里的哪几张：同一种角色从第 1 张开始拿，按牌盒的顺序排好。 */
export function boxCardsOf(deck: readonly RoleId[]): BoxCard[] {
  const counts = new Map<RoleId, number>()
  for (const role of deck) counts.set(role, (counts.get(role) ?? 0) + 1)
  return CARD_BOX.filter((card) => card.copy <= (counts.get(card.role) ?? 0))
}

/** 选中的几张牌，变回服务端要的牌堆。 */
export function deckOf(cardIds: readonly string[]): RoleId[] {
  return CARD_BOX.filter((card) => cardIds.includes(card.id)).map((card) => card.role)
}

/** 两副牌的角色和张数都一样，不管顺序。 */
export function sameRoles(a: readonly RoleId[], b: readonly RoleId[]): boolean {
  const key = (deck: readonly RoleId[]) => [...deck].sort().join()
  return key(a) === key(b)
}

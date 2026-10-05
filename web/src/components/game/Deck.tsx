import type { RoleId } from '@/api/types'
import { boxCardsOf } from '@/game/deck'
import { cn } from '@/lib/utils'
import { ROLES } from '@/roles/catalog'
import { CardGrid, CardSlot, EmptyCardSlot } from './CardGrid'
import { RoleButton } from './RoleDetails'

interface DeckTrayProps {
  deck: readonly RoleId[]
  /** 一共要几张，少了的画成虚线空位。 */
  size: number
  /** 房主用：点空位去补牌。 */
  onFill?: () => void
}

/** 大厅里这局的牌：一张牌一个头像，点头像看介绍。 */
export function DeckTray({ deck, size, onFill }: DeckTrayProps) {
  const missing = Math.max(0, size - deck.length)
  return (
    <CardGrid>
      {boxCardsOf(deck).map((card) => (
        <CardSlot key={card.id} role={card.role} />
      ))}
      {Array.from({ length: missing }, (_, index) =>
        onFill ? (
          <EmptyCardSlot key={`empty-${index}`} warning onSelect={onFill}>
            补一张
          </EmptyCardSlot>
        ) : (
          <EmptyCardSlot key={`empty-${index}`}>待补</EmptyCardSlot>
        ),
      )}
    </CardGrid>
  )
}

/** 可以点开角色详情的小标签。 */
const CHIP = 'inline-flex h-8 items-center gap-1.5 rounded-full border text-[13px] transition-colors hover:bg-muted'

/** 这局夜里的唤醒顺序，白天讨论时照着回忆谁可能换过谁的牌。 */
export function NightOrder({ roles }: { roles: readonly RoleId[] }) {
  return (
    <ol className="flex flex-wrap justify-center gap-1.5">
      {roles.map((role, index) => (
        <li key={role}>
          <RoleButton role={role} className={cn(CHIP, 'pr-2.5 pl-1.5')}>
            <span className="flex size-5 items-center justify-center rounded-full bg-muted font-mono text-[11px]">
              {index + 1}
            </span>
            {ROLES[role].name}
          </RoleButton>
        </li>
      ))}
    </ol>
  )
}

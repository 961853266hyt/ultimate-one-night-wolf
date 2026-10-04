import type { RoleId } from '@/api/types'
import { countRoles } from '@/game/deck'
import { cn } from '@/lib/utils'
import { ROLES } from '@/roles/catalog'
import { RoleButton } from './RoleDetails'
import { TeamDot } from './RoleText'

/** 可以点开角色详情的小标签。 */
const CHIP = 'inline-flex h-8 items-center gap-1.5 rounded-full border text-[13px] transition-colors hover:bg-muted'

/** 这局有哪些牌：每种角色一个小标签，多张的标出张数。 */
export function DeckSummary({ deck }: { deck: readonly RoleId[] }) {
  return (
    <ul className="flex flex-wrap justify-center gap-1.5">
      {countRoles(deck).map(([role, count]) => (
        <li key={role}>
          <RoleButton role={role} className={cn(CHIP, 'px-2.5')}>
            <TeamDot team={ROLES[role].team} />
            {ROLES[role].name}
            {count > 1 && <span className="text-muted-foreground">×{count}</span>}
          </RoleButton>
        </li>
      ))}
    </ul>
  )
}

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

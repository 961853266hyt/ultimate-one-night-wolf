import type { RoleId } from '@/api/types'
import { countRoles, ROLES } from '@/game/roles'
import { TeamDot } from './RoleText'

/** 这局有哪些牌：每种角色一个小标签，多张的标出张数。 */
export function DeckSummary({ deck }: { deck: readonly RoleId[] }) {
  return (
    <ul className="flex flex-wrap justify-center gap-1.5">
      {countRoles(deck).map(([role, count]) => (
        <li
          key={role}
          className="inline-flex h-7 items-center gap-1.5 rounded-full border px-2.5 text-[13px]"
        >
          <TeamDot team={ROLES[role].team} />
          {ROLES[role].name}
          {count > 1 && <span className="text-muted-foreground">×{count}</span>}
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
        <li
          key={role}
          className="inline-flex h-7 items-center gap-1.5 rounded-full border pr-2.5 pl-1 text-[13px]"
        >
          <span className="flex size-5 items-center justify-center rounded-full bg-muted font-mono text-[11px]">
            {index + 1}
          </span>
          {ROLES[role].name}
        </li>
      ))}
    </ol>
  )
}

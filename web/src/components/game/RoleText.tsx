import { Fragment } from 'react'
import type { RoleId, Team } from '@/api/types'
import { mergeText, type Phrase } from '@/game/phrase'
import { ROLES } from '@/game/roles'
import { autospace } from '@/lib/autospace'
import { cn } from '@/lib/utils'
import { TEAM_DOT, TEAM_TEXT } from './roleStyles'

/** 阵营小圆点。 */
export function TeamDot({ team, className }: { team: Team; className?: string }) {
  return <span aria-hidden className={cn('size-1.5 shrink-0 rounded-full', TEAM_DOT[team], className)} />
}

/** 角色名，按阵营上色，换行时不拆开。 */
export function RoleName({ role, className }: { role: RoleId; className?: string }) {
  const { name, team } = ROLES[role]
  return (
    <strong className={cn('font-semibold whitespace-nowrap', TEAM_TEXT[team], className)}>
      {name}
    </strong>
  )
}

/** 「强盗 → 狼人」：夜里牌被换过就划掉原来的；没换过只显示一个。 */
export function RoleChange({ from, to }: { from: RoleId; to: RoleId }) {
  if (from === to) return <RoleName role={to} />
  return (
    <span>
      <s className="text-muted-foreground">{ROLES[from].name}</s> → <RoleName role={to} />
    </span>
  )
}

/** 渲染 game/ 拼好的一句话，句子里的角色名带阵营颜色。 */
export function PhraseText({ phrase }: { phrase: Phrase }) {
  return (
    <>
      {mergeText(phrase).map((part, index) =>
        typeof part === 'string' ? (
          <Fragment key={index}>{autospace(part)}</Fragment>
        ) : (
          <RoleName key={index} role={part.role} />
        ),
      )}
    </>
  )
}

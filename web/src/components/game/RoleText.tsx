import { Fragment } from 'react'
import type { RoleId, Team } from '@/api/types'
import { mergeText, type Phrase } from '@/game/phrase'
import { autospace } from '@/lib/autospace'
import { cn } from '@/lib/utils'
import { ROLES, TEAMS } from '@/roles/catalog'
import { RoleButton } from './RoleDetails'

/** 阵营小圆点。 */
export function TeamDot({ team, className }: { team: Team; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn('size-1.5 shrink-0 rounded-full', TEAMS[team].dotClass, className)}
    />
  )
}

interface RoleNameProps {
  role: RoleId
  className?: string
  /** 能不能点开角色详情。放在别的按钮里面、或者不该让人看的地方，传 false。 */
  interactive?: boolean
}

/** 角色名，按阵营上色，换行时不拆开。默认可以点开角色详情，虚线下划线提示能点。 */
export function RoleName({ role, className, interactive = true }: RoleNameProps) {
  const { name, team } = ROLES[role]
  const style = cn('font-semibold whitespace-nowrap', TEAMS[team].textClass, className)
  if (!interactive) return <strong className={style}>{name}</strong>
  return (
    <RoleButton
      role={role}
      className={cn(style, 'underline decoration-current/40 decoration-dotted underline-offset-4')}
    >
      {name}
    </RoleButton>
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

/** 按阵营排好的角色列表，菜单里的角色介绍和「角色」页共用。 */
import type { RoleId, Team } from '@/api/types'
import { cn } from '@/lib/utils'
import { ROLES, TEAMS } from '@/roles/catalog'
import { RoleAvatar } from './RoleAvatar'
import { RoleButton } from './RoleDetails'

const TEAM_ORDER: Team[] = ['village', 'werewolf', 'tanner']

/** 每个阵营有哪些角色，阵营内按 ROLES 里的顺序。 */
export const ROLES_BY_TEAM = TEAM_ORDER.map((team) => ({
  team,
  roles: (Object.keys(ROLES) as RoleId[]).filter((role) => ROLES[role].team === team),
}))

/** 一行角色：头像、名字、一句话简介。点了打开角色详情。 */
export function RoleRow({ role }: { role: RoleId }) {
  const { name, team, summary } = ROLES[role]
  return (
    <RoleButton role={role} className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left hover:bg-muted">
      <RoleAvatar role={role} className="size-10 shrink-0" />
      <span className="flex min-w-0 flex-col">
        <span className={cn('text-sm font-semibold', TEAMS[team].textClass)}>{name}</span>
        <span className="truncate text-xs text-muted-foreground">{summary}</span>
      </span>
    </RoleButton>
  )
}

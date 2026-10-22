/** 按阵营分好的角色，「角色」页按它分成好人、狼人、第三方三页。 */
import type { RoleId, Team } from '@/api/types'
import { ROLES } from '@/roles/catalog'

const TEAM_ORDER: Team[] = ['village', 'werewolf', 'tanner']

/** 每个阵营有哪些角色，阵营内按 ROLES 里的顺序。 */
export const ROLES_BY_TEAM = TEAM_ORDER.map((team) => ({
  team,
  roles: (Object.keys(ROLES) as RoleId[]).filter((role) => ROLES[role].team === team),
}))

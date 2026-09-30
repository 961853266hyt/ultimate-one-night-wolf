import type { RoleId, Team } from '../api/types'
import { ROLE_HINT, ROLE_NAME, ROLE_TEAM, TEAM_NAME } from '../game/text'

const TEAM_STYLE: Record<Team, string> = {
  village: 'from-sky-600 to-indigo-800',
  werewolf: 'from-rose-600 to-red-900',
  tanner: 'from-amber-500 to-orange-800',
}

/** 发到手里的那张牌。夜里被换走了也不会变，想知道现在是什么只能靠失眠者这类角色。 */
export function RoleCard({ role, compact = false }: { role: RoleId; compact?: boolean }) {
  const team = ROLE_TEAM[role]
  return (
    <div className={`rounded-2xl bg-linear-to-br p-5 ${TEAM_STYLE[team]}`}>
      <p className="text-xs text-white/70">你发到的牌 · {TEAM_NAME[team]}</p>
      <p className={`font-semibold ${compact ? 'text-2xl' : 'text-4xl'}`}>{ROLE_NAME[role]}</p>
      {!compact && <p className="mt-3 text-sm text-white/85">{ROLE_HINT[role]}</p>}
    </div>
  )
}

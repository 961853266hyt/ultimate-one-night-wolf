import { useState } from 'react'
import type { Team } from '@/api/types'
import { RoleThumbnail } from '@/components/game/RoleArtCard'
import { RoleButton } from '@/components/game/RoleDetails'
import { ROLES_BY_TEAM } from '@/components/game/RoleList'
import { Page, PageContent } from '@/components/layout/Page'
import { TabHeader } from '@/components/layout/TabHeader'
import { cn } from '@/lib/utils'
import { useT } from '@/i18n'

/** 「角色」页：顶上切换阵营（往下滑时停在标题下面），下面这个阵营的角色一行三张牌，点一张看详情。 */
export function RolesScreen() {
  const t = useT()
  const [team, setTeam] = useState<Team>('village')
  const roles = ROLES_BY_TEAM.find((group) => group.team === team)?.roles ?? []
  return (
    <Page>
      <TabHeader title={t.tabs.roles} />
      <div className="sticky top-15 z-20 bg-background/95 px-5 pb-3 backdrop-blur">
        <TeamTabs value={team} onChange={setTeam} />
      </div>
      <PageContent className="pt-2">
        <ul className="grid grid-cols-3 gap-x-3 gap-y-3.5">
          {roles.map((role) => (
            <li key={role}>
              <RoleButton role={role} className="block w-full rounded-[10px]">
                <RoleThumbnail role={role} className="w-full rounded-[10px] shadow-sm" />
              </RoleButton>
            </li>
          ))}
        </ul>
      </PageContent>
    </Page>
  )
}

/** 好人阵营、狼人阵营、第三方：三段的开关，后面写着这个阵营有几个角色。 */
function TeamTabs({ value, onChange }: { value: Team; onChange: (team: Team) => void }) {
  const t = useT()
  return (
    <div role="group" aria-label={t.rolesPage.team} className="grid grid-cols-3 gap-0.5 rounded-lg bg-muted p-0.5">
      {ROLES_BY_TEAM.map(({ team, roles }) => (
        <button
          key={team}
          type="button"
          aria-pressed={value === team}
          onClick={() => onChange(team)}
          className={cn(
            'flex h-9 items-center justify-center gap-1.5 rounded-md text-sm font-medium outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50',
            value === team ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {t.rolesPage.tabs[team]}
          <span className="font-mono text-xs opacity-60">{roles.length}</span>
        </button>
      ))}
    </div>
  )
}

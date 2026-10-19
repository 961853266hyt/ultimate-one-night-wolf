import { RoleRow, ROLES_BY_TEAM } from '@/components/game/RoleList'
import { Page, PageContent } from '@/components/layout/Page'
import { TabHeader } from '@/components/layout/TabHeader'
import { TEAMS } from '@/roles/catalog'
import { useT } from '@/i18n'

/** 「角色」页：所有角色按阵营排好，点一个看详情。 */
export function RolesScreen() {
  const t = useT()
  return (
    <Page>
      <TabHeader title={t.tabs.roles} />
      <PageContent className="gap-6 pt-2">
        {ROLES_BY_TEAM.map(({ team, roles }) => (
          <section key={team} className="flex flex-col gap-1">
            <h2 className="text-[13px] font-semibold text-muted-foreground">
              {t.menu.teamGroup(TEAMS[team].name, roles.length)}
            </h2>
            <ul className="-mx-2 flex flex-col">
              {roles.map((role) => (
                <li key={role}>
                  <RoleRow role={role} />
                </li>
              ))}
            </ul>
          </section>
        ))}
      </PageContent>
    </Page>
  )
}

/**
 * 首页右上角的菜单：点开从右边滑出一个抽屉，里面是角色介绍和关于。
 */
import { Collapsible } from '@base-ui/react/collapsible'
import { ChevronDown, Menu, X } from 'lucide-react'
import type { ReactNode } from 'react'
import type { RoleId, Team } from '@/api/types'
import { RoleAvatar } from '@/components/game/RoleAvatar'
import { RoleButton } from '@/components/game/RoleDetails'
import { GitHubIcon } from '@/components/icons/GitHubIcon'
import { Button } from '@/components/ui/button'
import { Drawer, DrawerClose, DrawerContent, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer'
import { cn } from '@/lib/utils'
import { ROLES, TEAMS } from '@/roles/catalog'

const AUTHOR_URL = 'https://github.com/961853266hyt'
const SOURCE_URL = `${AUTHOR_URL}/ultimate-one-night-wolf`

const TEAM_ORDER: Team[] = ['village', 'werewolf', 'tanner']

/** 每个阵营有哪些角色，阵营内按 ROLES 里的顺序。 */
const ROLES_BY_TEAM = TEAM_ORDER.map((team) => ({
  team,
  roles: (Object.keys(ROLES) as RoleId[]).filter((role) => ROLES[role].team === team),
}))

export function HomeMenu() {
  return (
    <Drawer swipeDirection="right">
      <DrawerTrigger
        render={<Button variant="ghost" size="icon-xl" aria-label="菜单" className="text-muted-foreground" />}
      >
        <Menu className="size-5" />
      </DrawerTrigger>
      <DrawerContent>
        <div className="flex h-15 shrink-0 items-center justify-between pr-2 pl-5 pt-[env(safe-area-inset-top)]">
          <DrawerTitle>菜单</DrawerTitle>
          <DrawerClose
            render={<Button variant="ghost" size="icon-xl" aria-label="关闭" className="text-muted-foreground" />}
          >
            <X className="size-5" />
          </DrawerClose>
        </div>

        <div className="flex flex-1 flex-col gap-8 overflow-y-auto px-5 pt-2 pb-[max(1.75rem,env(safe-area-inset-bottom))]">
          <MenuSection title="角色介绍">
            {ROLES_BY_TEAM.map(({ team, roles }) => (
              <TeamGroup key={team} team={team} roles={roles} />
            ))}
          </MenuSection>

          <MenuSection title="关于">
            <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2.5 text-sm">
              <dt className="text-muted-foreground">版本</dt>
              <dd className="font-mono">v{__APP_VERSION__}</dd>
              <dt className="text-muted-foreground">作者</dt>
              <dd>
                <a href={AUTHOR_URL} target="_blank" rel="noreferrer" className="underline-offset-2 hover:underline">
                  geli
                </a>
              </dd>
              <dt className="text-muted-foreground">源码</dt>
              <dd>
                <a
                  href={SOURCE_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 underline-offset-2 hover:underline"
                >
                  <GitHubIcon className="size-3.5" />
                  GitHub
                </a>
              </dd>
            </dl>
          </MenuSection>
        </div>
      </DrawerContent>
    </Drawer>
  )
}

function MenuSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-[13px] font-semibold text-muted-foreground">{title}</h2>
      {children}
    </section>
  )
}

/** 一个阵营的角色，点阵营名收起或展开。默认展开。 */
function TeamGroup({ team, roles }: { team: Team; roles: RoleId[] }) {
  return (
    <Collapsible.Root defaultOpen>
      <Collapsible.Trigger className="group -mx-2 flex w-[calc(100%+1rem)] items-center justify-between rounded-lg px-2 py-2 text-xs text-muted-foreground outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50">
        <span>
          {TEAMS[team].name} · {roles.length}
        </span>
        <ChevronDown className="size-4 transition-transform duration-200 group-data-panel-open:rotate-180" />
      </Collapsible.Trigger>
      {/* 高度跟着内容走，开合时有个过渡 */}
      <Collapsible.Panel className="h-(--collapsible-panel-height) overflow-hidden transition-[height] duration-200 ease-out data-ending-style:h-0 data-starting-style:h-0">
        <ul className="-mx-2 flex flex-col">
          {roles.map((role) => (
            <li key={role}>
              <RoleRow role={role} />
            </li>
          ))}
        </ul>
      </Collapsible.Panel>
    </Collapsible.Root>
  )
}

/** 一行角色：头像、名字、一句话简介。点了打开角色详情。 */
function RoleRow({ role }: { role: RoleId }) {
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

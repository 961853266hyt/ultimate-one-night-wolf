/**
 * 顶栏右上角的菜单：点开从右边滑出一个抽屉，里面是角色介绍，最底下是版本和作者的落款。首页和房间里共用。
 */
import { Collapsible } from '@base-ui/react/collapsible'
import { ChevronDown, Menu, MessageSquareWarning, X } from 'lucide-react'
import type { ReactNode } from 'react'
import type { RoleId, Team } from '@/api/types'
import { RoleAvatar } from '@/components/game/RoleAvatar'
import { RoleButton } from '@/components/game/RoleDetails'
import { GitHubIcon } from '@/components/icons/GitHubIcon'
import { Button, buttonVariants } from '@/components/ui/button'
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

interface AppMenuProps {
  /** 贴在抽屉底部、不跟着列表滚动的操作，比如房间里的「离开房间」。 */
  footer?: ReactNode
}

export function AppMenu({ footer }: AppMenuProps) {
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

        <div className="flex-1 overflow-y-auto px-5 pt-2 pb-6">
          <Fold label="角色介绍" className="text-[13px] font-semibold">
            <div className="flex flex-col gap-1 pt-1">
              {ROLES_BY_TEAM.map(({ team, roles }) => (
                <Fold key={team} label={`${TEAMS[team].name} · ${roles.length}`} className="text-xs">
                  <ul className="-mx-2 flex flex-col">
                    {roles.map((role) => (
                      <li key={role}>
                        <RoleRow role={role} />
                      </li>
                    ))}
                  </ul>
                </Fold>
              ))}
            </div>
          </Fold>
        </div>

        {/* 贴在抽屉最底下：反馈问题、房间里的「离开房间」，落款永远在最后 */}
        <div className="flex shrink-0 flex-col gap-3 border-t px-5 pt-2 pb-[max(1rem,env(safe-area-inset-bottom))]">
          {/* 和房间里的「离开房间」一样大、一样居中，上下两个按钮的图标和字对齐 */}
          <a
            href={feedbackUrl()}
            target="_blank"
            rel="noreferrer"
            className={cn(buttonVariants({ variant: 'outline', size: 'xl' }), 'w-full')}
          >
            <MessageSquareWarning aria-hidden className="size-4.5" />
            反馈问题
          </a>
          {footer}
          <Credits />
        </div>
      </DrawerContent>
    </Drawer>
  )
}

/**
 * 反馈问题：打开仓库的新建 Issue 页面，正文先填好模板和排查要用的版本、页面、设备。
 * 链接在点开菜单时才生成，页面地址是当时的。
 */
function feedbackUrl(): string {
  const body = [
    '**遇到了什么问题**',
    '',
    '',
    '**怎么能再碰到一次**',
    '',
    '',
    '---',
    `版本：v${__APP_VERSION__}`,
    `页面：${location.pathname}`,
    `设备：${navigator.userAgent}`,
  ].join('\n')
  return `${SOURCE_URL}/issues/new?${new URLSearchParams({ body })}`
}

/** 落款：版本、作者、源码。小字、淡色、居中，不当菜单项。 */
function Credits() {
  return (
    <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground/70">
      <span>一夜狼 v{__APP_VERSION__}</span>
      <span aria-hidden>·</span>
      <span>
        by{' '}
        <a href={AUTHOR_URL} target="_blank" rel="noreferrer" className="underline-offset-2 hover:text-foreground hover:underline">
          geli
        </a>
      </span>
      <span aria-hidden>·</span>
      <a
        href={SOURCE_URL}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-1 underline-offset-2 hover:text-foreground hover:underline"
      >
        <GitHubIcon className="size-3" />
        GitHub
      </a>
    </p>
  )
}

interface FoldProps {
  label: string
  /** 标题的字号、字重。 */
  className?: string
  children: ReactNode
}

/** 点标题收起或展开下面的内容，默认展开。角色介绍和每个阵营都用它。 */
function Fold({ label, className, children }: FoldProps) {
  return (
    <Collapsible.Root defaultOpen>
      <Collapsible.Trigger
        className={cn(
          'group -mx-2 flex w-[calc(100%+1rem)] items-center justify-between rounded-lg px-2 py-2 text-muted-foreground outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50',
          className,
        )}
      >
        <span>{label}</span>
        <ChevronDown className="size-4 transition-transform duration-200 group-data-panel-open:rotate-180" />
      </Collapsible.Trigger>
      {/* 高度跟着内容走，开合时有个过渡。收起时不卸载，里面阵营的开合状态才不会丢 */}
      <Collapsible.Panel
        keepMounted
        className="h-(--collapsible-panel-height) overflow-hidden transition-[height] duration-200 ease-out data-ending-style:h-0 data-starting-style:h-0">
        {children}
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

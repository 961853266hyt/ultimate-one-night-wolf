/**
 * 顶栏右上角的菜单：点开从右边滑出一个抽屉。上面是角色介绍，可以滚动；分割线下面贴底的是通用设置
 * （语言、深浅色）、反馈问题，最后是版本和作者的落款。首页和房间里共用。
 */
import { Collapsible } from '@base-ui/react/collapsible'
import { ChevronDown, Menu, MessageSquareWarning, Monitor, Moon, Sun, X, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import type { RoleId, Team } from '@/api/types'
import { RoleAvatar } from '@/components/game/RoleAvatar'
import { RoleButton } from '@/components/game/RoleDetails'
import { GitHubIcon } from '@/components/icons/GitHubIcon'
import { Button, buttonVariants } from '@/components/ui/button'
import { Drawer, DrawerClose, DrawerContent, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer'
import { LOCALE_NAME, LOCALES, setLocale, t as tr, useLocale, useT } from '@/i18n'
import { cn } from '@/lib/utils'
import { ROLES, TEAMS } from '@/roles/catalog'
import { setTheme, THEMES, useTheme, type Theme } from '@/theme'

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
  const t = useT()
  return (
    <Drawer swipeDirection="right">
      <DrawerTrigger
        render={<Button variant="ghost" size="icon-xl" aria-label={t.common.menu} className="text-muted-foreground" />}
      >
        <Menu className="size-5" />
      </DrawerTrigger>
      <DrawerContent>
        <div className="flex h-15 shrink-0 items-center justify-between pr-2 pl-5 pt-[env(safe-area-inset-top)]">
          <DrawerTitle>{t.common.menu}</DrawerTitle>
          <DrawerClose
            render={<Button variant="ghost" size="icon-xl" aria-label={t.common.close} className="text-muted-foreground" />}
          >
            <X className="size-5" />
          </DrawerClose>
        </div>

        <div className="flex-1 overflow-y-auto px-5 pt-2 pb-6">
          <Fold label={t.menu.roles} className="text-[13px] font-semibold">
            <div className="flex flex-col gap-1 pt-1">
              {ROLES_BY_TEAM.map(({ team, roles }) => (
                <Fold key={team} label={t.menu.teamGroup(TEAMS[team].name, roles.length)} className="text-xs">
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

        {/* 贴在抽屉最底下：通用设置、反馈问题、房间里的「离开房间」，落款永远在最后 */}
        <div className="flex shrink-0 flex-col gap-3 border-t px-5 pt-2 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <div className="flex flex-col">
            <LanguageRow />
            <ThemeRow />
          </div>
          {/* 和房间里的「离开房间」一样大、一样居中，上下两个按钮的图标和字对齐 */}
          <a
            href={feedbackUrl()}
            target="_blank"
            rel="noreferrer"
            className={cn(buttonVariants({ variant: 'outline', size: 'xl' }), 'w-full')}
          >
            <MessageSquareWarning aria-hidden className="size-4.5" />
            {t.menu.feedback}
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
  const body = tr().menu.feedbackBody(__APP_VERSION__, location.pathname, navigator.userAgent)
  return `${SOURCE_URL}/issues/new?${new URLSearchParams({ body })}`
}

/** 落款：版本、作者、源码。小字、淡色、居中，不当菜单项。 */
function Credits() {
  const t = useT()
  return (
    // 英文一行放不下时整段换行，每一段自己不拆开
    <p className="flex flex-wrap items-center justify-center gap-x-1.5 gap-y-0.5 text-xs whitespace-nowrap text-muted-foreground/70">
      <span>{t.menu.credits(__APP_VERSION__)}</span>
      <span aria-hidden>·</span>
      <span>
        by{' '}
        <a href={AUTHOR_URL} target="_blank" rel="noreferrer" className="underline-offset-2 hover:text-foreground hover:underline">
          geli
        </a>
      </span>
      <span aria-hidden>·</span>
      {/* 只放图标；读屏软件念 aria-label */}
      <a
        href={SOURCE_URL}
        target="_blank"
        rel="noreferrer"
        aria-label="GitHub"
        className="-m-1 inline-flex p-1 hover:text-foreground"
      >
        <GitHubIcon className="size-3.5" />
      </a>
    </p>
  )
}

/** 界面语言：「语言  中文 | English」。选项用各自的语言写，看不懂当前语言也找得到。 */
function LanguageRow() {
  const t = useT()
  const locale = useLocale()
  return (
    <SettingRow label={t.menu.language}>
      {LOCALES.map((option) => (
        <SegmentButton
          key={option}
          lang={option === 'zh' ? 'zh-CN' : 'en'}
          pressed={locale === option}
          onClick={() => setLocale(option)}
        >
          {LOCALE_NAME[option]}
        </SegmentButton>
      ))}
    </SettingRow>
  )
}

const THEME_ICON: Record<Theme, LucideIcon> = { light: Sun, dark: Moon, system: Monitor }

/** 深浅色：「外观  ☀ ☾ 🖥」，三个图标分别是浅色、深色、跟随系统（电脑），读屏软件念 aria-label。 */
function ThemeRow() {
  const t = useT()
  const theme = useTheme()
  return (
    <SettingRow label={t.menu.theme}>
      {THEMES.map((option) => {
        const Icon = THEME_ICON[option]
        return (
          <SegmentButton
            key={option}
            pressed={theme === option}
            onClick={() => setTheme(option)}
            label={t.menu.themes[option]}
          >
            <Icon aria-hidden className="size-3.5" />
          </SegmentButton>
        )
      })}
    </SettingRow>
  )
}

/** 一行设置：左边灰字标题，右边一组分段按钮。 */
function SettingRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <span className="text-[13px] font-semibold text-muted-foreground">{label}</span>
      <div role="group" aria-label={label} className="flex gap-0.5 rounded-lg bg-muted p-0.5">
        {children}
      </div>
    </div>
  )
}

interface SegmentButtonProps {
  pressed: boolean
  onClick: () => void
  /** 只放图标时，给读屏软件念的名字。 */
  label?: string
  lang?: string
  children: ReactNode
}

function SegmentButton({ pressed, onClick, label, lang, children }: SegmentButtonProps) {
  return (
    <button
      type="button"
      lang={lang}
      aria-pressed={pressed}
      aria-label={label}
      title={label}
      onClick={onClick}
      className={cn(
        'flex h-7 min-w-9 items-center justify-center rounded-md px-2.5 text-xs font-medium outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50',
        pressed ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
      )}
    >
      {children}
    </button>
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

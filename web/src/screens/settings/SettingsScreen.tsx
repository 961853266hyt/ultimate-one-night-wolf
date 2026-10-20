/**
 * 「设置」标签页：上面是界面语言、深浅色；下面「关于」里是反馈问题、请作者喝杯咖啡，紧跟着版本和作者的落款。
 */
import { ArrowUpRight, Coffee, Monitor, MessageSquareWarning, Moon, Sun, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { GitHubIcon } from '@/components/icons/GitHubIcon'
import { Page, PageContent } from '@/components/layout/Page'
import { TabHeader } from '@/components/layout/TabHeader'
import { LOCALE_NAME, LOCALES, setLocale, t as tr, useLocale, useT } from '@/i18n'
import { cn } from '@/lib/utils'
import { setTheme, THEMES, useTheme, type Theme } from '@/theme'

const AUTHOR_URL = 'https://github.com/961853266hyt'
const SOURCE_URL = `${AUTHOR_URL}/ultimate-one-night-wolf`
const COFFEE_URL = 'https://buymeacoffee.com/higeli'

export function SettingsScreen() {
  const t = useT()
  return (
    <Page>
      <TabHeader title={t.tabs.settings} />
      <PageContent className="gap-6 pt-2">
        <div className="flex flex-col rounded-xl border px-3.5 py-1">
          <LanguageRow />
          <ThemeRow />
        </div>
        <section className="flex flex-col gap-2">
          <h2 className="text-[13px] font-semibold text-muted-foreground">{t.menu.about}</h2>
          <div className="flex flex-col divide-y rounded-xl border">
            <LinkRow href={feedbackUrl()} icon={MessageSquareWarning}>
              {t.menu.feedback}
            </LinkRow>
            <LinkRow href={COFFEE_URL} icon={Coffee} className="text-coffee">
              {t.menu.coffee}
            </LinkRow>
          </div>
          <div className="pt-2">
            <Credits />
          </div>
        </section>
      </PageContent>
    </Page>
  )
}

/**
 * 反馈问题：打开仓库的新建 Issue 页面，正文先填好模板和排查要用的版本、页面、设备。
 * 链接在打开设置页时生成。
 */
function feedbackUrl(): string {
  const body = tr().menu.feedbackBody(__APP_VERSION__, location.pathname, navigator.userAgent)
  return `${SOURCE_URL}/issues/new?${new URLSearchParams({ body })}`
}

/** 「关于」里的一行：图标、文字，右边一个斜箭头表示在新页面打开。 */
function LinkRow({
  href,
  icon: Icon,
  className,
  children,
}: {
  href: string
  icon: LucideIcon
  className?: string
  children: ReactNode
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className={cn(
        'flex items-center gap-3 px-3.5 py-3 text-sm font-medium outline-none transition-colors first:rounded-t-xl last:rounded-b-xl hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50',
        className,
      )}
    >
      <Icon aria-hidden className="size-4.5" />
      <span className="flex-1">{children}</span>
      <ArrowUpRight aria-hidden className="size-4 opacity-50" />
    </a>
  )
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

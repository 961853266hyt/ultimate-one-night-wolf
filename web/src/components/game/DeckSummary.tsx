/**
 * 大厅底部的「本局设置」摘要：一排叠在一起的角色头像、张数（用的是首页的板子就写板子名）、阵营比例和夜间操作时间。
 * 点开看完整设置：房主进配牌，其他人只能看。
 */
import { ChevronRight, Timer } from 'lucide-react'
import type { BoardKind, RoleId, Team } from '@/api/types'
import { cn } from '@/lib/utils'
import { ROLES, TEAMS } from '@/roles/catalog'
import { RoleAvatar } from './RoleAvatar'
import { useT } from '@/i18n'

/** 头像最多叠几个，多出来的显示「+N」。 */
const MAX_FACES = 4

const TEAM_ORDER: readonly Team[] = ['village', 'werewolf', 'tanner']

interface DeckSummaryProps {
  deck: readonly RoleId[]
  /** 房间几个座位。 */
  seats: number
  /** 按座位数一共要几张。 */
  need: number
  /** 夜里每一步几秒。 */
  nightStep: number
  /** 座位数和牌对得上哪个板子；房主自己配的是 null。 */
  board: BoardKind | null
  onOpen: () => void
}

export function DeckSummary({ deck, seats, need, nightStep, board, onOpen }: DeckSummaryProps) {
  const faces = deck.slice(0, MAX_FACES)
  const extra = deck.length - faces.length
  // 牌数对上是平常的样子，少了橙色，多了红色
  const tone = deck.length < need ? 'warning' : deck.length > need ? 'destructive' : null
  const t = useT()

  return (
    <button
      type="button"
      onClick={onOpen}
      aria-haspopup="dialog"
      className={cn(
        'flex w-full items-center gap-3 rounded-xl border px-3.5 py-2.5 text-left outline-none transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50',
        tone === 'warning' && 'border-warning/50 bg-warning/5',
        tone === 'destructive' && 'border-destructive/50 bg-destructive/5',
      )}
    >
      <span aria-hidden className="flex shrink-0 pl-1.5">
        {faces.map((role, index) => (
          <RoleAvatar key={index} role={role} className="-ml-1.5 size-7 ring-2 ring-background" />
        ))}
        {extra > 0 && (
          <span className="-ml-1.5 flex size-7 items-center justify-center rounded-full bg-muted text-[11px] text-muted-foreground ring-2 ring-background">
            +{extra}
          </span>
        )}
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span
          className={cn(
            'text-sm font-medium',
            tone === 'warning' && 'text-warning',
            tone === 'destructive' && 'text-destructive',
          )}
        >
          {board
            ? t.settings.summaryBoard(seats, t.boards.kinds[board].name)
            : t.settings.summaryTitle(seats, t.settings.cardsOf(deck.length, tone ? need : undefined))}
        </span>
        <span className="truncate text-xs text-muted-foreground">
          {teamCounts(deck)} ·{' '}
          {/* 地方不够写「夜间操作时间」，用时钟图标代替，读屏软件照样念出来 */}
          <Timer aria-hidden className="inline size-3 align-[-1px]" />
          <span className="sr-only">{t.settings.nightTimeSr}</span> {t.settings.summaryTime(nightStep)}
        </span>
      </span>
      <ChevronRight aria-hidden className="size-4 shrink-0 text-muted-foreground" />
    </button>
  )
}

/** 「好人 4 · 狼人 2」：按阵营数牌，没有的阵营不写。 */
function teamCounts(deck: readonly RoleId[]): string {
  return TEAM_ORDER
    .map((team) => [team, deck.filter((role) => ROLES[role].team === team).length] as const)
    .filter(([, count]) => count > 0)
    .map(([team, count]) => `${TEAMS[team].short} ${count}`)
    .join(' · ')
}

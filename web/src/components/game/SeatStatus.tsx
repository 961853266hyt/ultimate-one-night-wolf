import { cva, type VariantProps } from 'class-variance-authority'
import { CircleCheck, CircleX, WifiOff, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

const statusVariants = cva(
  'flex h-7 w-full items-center justify-center gap-1 rounded-md border px-1 text-xs whitespace-nowrap',
  {
    variants: {
      tone: {
        done: 'text-success',
        waiting: 'text-muted-foreground',
        offline: 'bg-muted/60 text-muted-foreground',
        win: 'font-medium text-success',
        lose: 'font-medium text-destructive',
      },
    },
    defaultVariants: { tone: 'waiting' },
  },
)

type Tone = NonNullable<VariantProps<typeof statusVariants>['tone']>

const TONE_ICON: Partial<Record<Tone, LucideIcon>> = {
  done: CircleCheck,
  win: CircleCheck,
  lose: CircleX,
  offline: WifiOff,
}

/** 座位下面的状态条：已就位、已投票、胜负…… */
export function SeatStatus({ tone = 'waiting', children }: { tone?: Tone; children: ReactNode }) {
  const Icon = TONE_ICON[tone]
  return (
    <span className={statusVariants({ tone })}>
      {Icon && <Icon aria-hidden className="size-3.5" />}
      {children}
    </span>
  )
}

interface SeatProgressProps {
  done: boolean
  doneText: string
  pendingText: string
}

/**
 * 等所有人都做完一件事时用：看好牌、准备投票、投票。没做完是灰字，做完只剩一个绿勾，
 * doneText 留给读屏软件。
 */
export function SeatProgress({ done, doneText, pendingText }: SeatProgressProps) {
  if (!done) return <SeatStatus>{pendingText}</SeatStatus>
  return (
    <span className={statusVariants({ tone: 'done' })}>
      <CircleCheck aria-hidden className="size-4" />
      <span className="sr-only">{doneText}</span>
    </span>
  )
}

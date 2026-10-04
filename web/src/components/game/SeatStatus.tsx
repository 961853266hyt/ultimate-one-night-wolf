import { cva, type VariantProps } from 'class-variance-authority'
import { CircleCheck, WifiOff, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

const statusVariants = cva(
  'flex h-7 w-full items-center justify-center gap-1 rounded-md border px-1 text-xs whitespace-nowrap',
  {
    variants: {
      tone: {
        done: 'text-success',
        waiting: 'text-muted-foreground',
        offline: 'bg-muted/60 text-muted-foreground',
        empty: 'border-dashed text-muted-foreground',
        win: 'font-medium text-success',
        out: 'border-destructive/25 bg-destructive/10 font-medium text-destructive',
      },
    },
    defaultVariants: { tone: 'waiting' },
  },
)

type Tone = NonNullable<VariantProps<typeof statusVariants>['tone']>

const TONE_ICON: Partial<Record<Tone, LucideIcon>> = {
  done: CircleCheck,
  win: CircleCheck,
  offline: WifiOff,
}

/** 座位下面的状态条：已就位、已投票、出局…… */
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

/** 等所有人都做完一件事时用：看好牌、准备投票、投票。做完是绿勾，没做完是灰字。 */
export function SeatProgress({ done, doneText, pendingText }: SeatProgressProps) {
  return <SeatStatus tone={done ? 'done' : 'waiting'}>{done ? doneText : pendingText}</SeatStatus>
}

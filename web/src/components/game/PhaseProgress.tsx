import { cn } from '@/lib/utils'

interface Props {
  /** 当前第几步，从 1 开始。 */
  current: number
  total: number
  label: string
}

/** 分段进度条，夜里每醒一个角色走一格。 */
export function PhaseProgress({ current, total, label }: Props) {
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={1}
      aria-valuemax={total}
      aria-valuenow={current}
      className="flex gap-1"
    >
      {Array.from({ length: total }, (_, index) => (
        <span
          key={index}
          className={cn('h-0.5 flex-1 rounded-full', index < current ? 'bg-foreground' : 'bg-border')}
        />
      ))}
    </div>
  )
}

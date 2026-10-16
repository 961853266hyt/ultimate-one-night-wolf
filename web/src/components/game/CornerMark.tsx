import { ArrowLeftRight, Check, Eye } from 'lucide-react'
import { cn } from '@/lib/utils'

export type Mark = 'check' | 'seen' | 'swapped'

const MARK_STYLE = {
  check: { Icon: Check, className: '-top-1 -right-1 bg-foreground text-background' },
  seen: { Icon: Eye, className: '-top-1 -left-1 bg-muted-foreground text-background' },
  swapped: { Icon: ArrowLeftRight, className: '-bottom-1 -left-1 bg-muted-foreground text-background' },
}

/** 头像或牌角上的小圆标：打勾表示选中，眼睛表示夜里看过，双箭头表示夜里被换过牌。父元素要是 relative。 */
export function CornerMark({ mark }: { mark: Mark }) {
  const { Icon, className } = MARK_STYLE[mark]
  return (
    <span
      aria-hidden
      className={cn(
        'absolute flex size-5 items-center justify-center rounded-full border-2 border-background',
        className,
      )}
    >
      <Icon className="size-2.5" strokeWidth={3.5} />
    </span>
  )
}

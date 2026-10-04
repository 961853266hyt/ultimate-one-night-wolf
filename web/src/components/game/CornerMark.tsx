import { Check, X } from 'lucide-react'
import { cn } from '@/lib/utils'

export type Mark = 'check' | 'out'

const MARK_STYLE = {
  check: { Icon: Check, className: '-top-1 -right-1 bg-foreground text-background' },
  out: { Icon: X, className: '-right-1 -bottom-1 bg-destructive text-white' },
}

/** 头像或牌角上的小圆标：打勾表示选中，红叉表示出局。父元素要是 relative。 */
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

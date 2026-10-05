/**
 * 按住才能看的身份牌，松手自动盖回去。面对面玩时，防止旁边的人瞄到。
 */
import { Eye } from 'lucide-react'
import type { RoleId } from '@/api/types'
import { buttonVariants } from '@/components/ui/button'
import { usePressAndHold } from '@/hooks/usePressAndHold'
import { cn } from '@/lib/utils'
import { RoleCard } from './RoleCard'
import { RoleName } from './RoleText'

// 手机上长按会弹菜单、选中文字或者滚动页面，都要关掉
const HOLDABLE = 'touch-none select-none [-webkit-touch-callout:none]'

/** 看牌阶段的大牌。 */
export function PeekRoleCard({ role, wakeOrder }: { role: RoleId; wakeOrder: number | null }) {
  const { held, handlers } = usePressAndHold()
  return (
    <button
      type="button"
      aria-label="按住查看你的身份"
      className={cn('rounded-2xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50', HOLDABLE)}
      {...handlers}
    >
      <RoleCard role={role} faceUp={held} wakeOrder={wakeOrder} />
    </button>
  )
}

/** 一行的小版本，白天和投票时回看自己发到的牌。 */
export function PeekRoleRow({ role }: { role: RoleId }) {
  const { held, handlers } = usePressAndHold()
  return (
    <div className="flex items-center gap-3 rounded-xl border px-3.5 py-3">
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-xs text-muted-foreground">你发到的牌 · 夜里可能被换过</span>
        {held ? (
          <RoleName role={role} interactive={false} className="text-[17px]" />
        ) : (
          <span aria-hidden className="text-[17px] font-semibold tracking-[0.3em] text-muted-foreground/40">
            ●●●
          </span>
        )}
      </div>
      <button
        type="button"
        className={cn(buttonVariants({ variant: 'outline', size: 'lg' }), HOLDABLE)}
        {...handlers}
      >
        <Eye aria-hidden />
        按住查看
      </button>
    </div>
  )
}

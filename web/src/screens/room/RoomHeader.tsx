import { LogOut } from 'lucide-react'
import type { ComponentProps } from 'react'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { AppMenu } from '@/components/layout/AppMenu'
import { Button } from '@/components/ui/button'
import { useCountdown } from '@/hooks/useCountdown'
import { cn } from '@/lib/utils'

interface RoomHeaderProps {
  /** 「夜晚 · 3/6」这样的阶段说明。 */
  phase: string
  endsAt: number | null
  clockOffset: number
  connected: boolean
  /** 这一局还没打完：离开前先确认一下。 */
  confirmLeave: boolean
  onLeave: () => void
}

/** 房间里的顶栏：阶段、倒计时、菜单。离开房间放在菜单底部。 */
export function RoomHeader(props: RoomHeaderProps) {
  const { phase, endsAt, clockOffset, connected, confirmLeave, onLeave } = props
  return (
    <header className="sticky top-0 z-20 flex h-15 items-center justify-between gap-2 bg-background/95 pr-2 pl-5 backdrop-blur">
      <div className="flex min-w-0 items-center gap-2.5">
        <span className="truncate text-[13px] text-muted-foreground">{phase}</span>
        {!connected && <span className="shrink-0 text-xs text-destructive">重连中…</span>}
      </div>
      <div className="flex shrink-0 items-center">
        <Countdown endsAt={endsAt} clockOffset={clockOffset} />
        <AppMenu footer={<LeaveButton confirm={confirmLeave} onLeave={onLeave} />} />
      </div>
    </header>
  )
}

function Countdown({ endsAt, clockOffset }: { endsAt: number | null; clockOffset: number }) {
  const seconds = useCountdown(endsAt, clockOffset)
  if (seconds === null) return null
  return (
    <span
      role="timer"
      aria-label={`还剩 ${seconds} 秒`}
      className={cn(
        'px-1.5 font-mono text-[15px] font-medium tabular-nums',
        seconds <= 5 && 'text-destructive',
      )}
    >
      {Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, '0')}
    </span>
  )
}

function LeaveButton({ confirm, onLeave }: { confirm: boolean; onLeave: () => void }) {
  if (!confirm) return <LeaveMenuButton onClick={onLeave} />
  return (
    <ConfirmDialog
      trigger={<LeaveMenuButton />}
      title="这一局还没结束，确定离开吗？"
      description="你的座位会保留到这局结束。"
      confirmLabel="离开"
      cancelLabel="留下"
      onConfirm={onLeave}
    />
  )
}

function LeaveMenuButton(props: ComponentProps<typeof Button>) {
  return (
    <Button variant="destructive" size="xl" className="w-full" {...props}>
      <LogOut className="size-4.5" />
      离开房间
    </Button>
  )
}

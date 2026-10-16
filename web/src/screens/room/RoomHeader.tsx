import { LogOut } from 'lucide-react'
import type { ComponentProps } from 'react'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { AppMenu } from '@/components/layout/AppMenu'
import { Button } from '@/components/ui/button'
import { useCountdown } from '@/hooks/useCountdown'
import { cn } from '@/lib/utils'
import { useT } from '@/i18n'

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
  const t = useT()
  return (
    <header className="sticky top-0 z-20 flex h-15 items-center justify-between gap-2 bg-background/95 pr-2 pl-5 backdrop-blur">
      <div className="flex min-w-0 items-center gap-2.5">
        <span className="truncate text-[13px] text-muted-foreground">{phase}</span>
        {!connected && <span className="shrink-0 text-xs text-destructive">{t.room.reconnecting}</span>}
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
  const t = useT()
  if (seconds === null) return null
  return (
    <span
      role="timer"
      aria-label={t.room.secondsLeft(seconds)}
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
  const t = useT()
  if (!confirm) return <LeaveMenuButton onClick={onLeave} />
  return (
    <ConfirmDialog
      trigger={<LeaveMenuButton />}
      title={t.room.leaveTitle}
      description={t.room.leaveDescription}
      confirmLabel={t.room.leave}
      cancelLabel={t.room.stay}
      onConfirm={onLeave}
    />
  )
}

function LeaveMenuButton(props: ComponentProps<typeof Button>) {
  const t = useT()
  return (
    <Button variant="destructive" size="xl" className="w-full" {...props}>
      <LogOut className="size-4.5" />
      {t.room.leaveRoom}
    </Button>
  )
}

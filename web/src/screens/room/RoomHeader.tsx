import { LogOut } from 'lucide-react'
import type { ComponentProps } from 'react'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { Button } from '@/components/ui/button'
import { useCountdown } from '@/hooks/useCountdown'
import { cn } from '@/lib/utils'

interface RoomHeaderProps {
  code: string
  /** 「夜晚 · 3/6」这样的阶段说明。 */
  phase: string
  endsAt: number | null
  clockOffset: number
  connected: boolean
  /** 这一局还没打完：离开前先确认一下。 */
  confirmLeave: boolean
  onLeave: () => void
}

/** 房间里的顶栏：房间号、阶段、倒计时、离开。 */
export function RoomHeader(props: RoomHeaderProps) {
  const { code, phase, endsAt, clockOffset, connected, confirmLeave, onLeave } = props
  return (
    <header className="sticky top-0 z-20 flex h-15 items-center justify-between gap-2 border-b bg-background/95 pr-2 pl-5 backdrop-blur">
      <div className="flex min-w-0 items-center gap-2.5">
        <span className="rounded-md border px-2 py-0.5 font-mono text-[13px] tracking-widest">{code}</span>
        <span className="truncate text-[13px] text-muted-foreground">{phase}</span>
        {!connected && <span className="shrink-0 text-xs text-destructive">重连中…</span>}
      </div>
      <div className="flex shrink-0 items-center">
        <Countdown endsAt={endsAt} clockOffset={clockOffset} />
        <LeaveButton confirm={confirmLeave} onLeave={onLeave} />
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
  if (!confirm) return <LeaveIconButton onClick={onLeave} />
  return (
    <ConfirmDialog
      trigger={<LeaveIconButton />}
      title="这一局还没结束，确定离开吗？"
      description="你的座位会保留到这局结束。"
      confirmLabel="离开"
      cancelLabel="留下"
      onConfirm={onLeave}
    />
  )
}

function LeaveIconButton(props: ComponentProps<typeof Button>) {
  return (
    <Button
      variant="ghost"
      size="icon-xl"
      aria-label="离开房间"
      className="text-muted-foreground"
      {...props}
    >
      <LogOut className="size-5" />
    </Button>
  )
}

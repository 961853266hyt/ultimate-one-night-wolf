import { Plus } from 'lucide-react'
import type { ReactNode } from 'react'
import { Badge } from '@/components/ui/badge'
import { seatLabel, type Seat } from '@/game/seats'
import { cn } from '@/lib/utils'
import type { Mark } from './CornerMark'
import { PlayerAvatar } from './PlayerAvatar'
import { SeatStatus } from './SeatStatus'

/** 座位网格，一行三个。里面放 SeatTile 和 EmptySeatTile。 */
export function SeatGrid({ children }: { children: ReactNode }) {
  return <ul className="grid w-full grid-cols-3 gap-x-3 gap-y-5">{children}</ul>
}

interface SeatTileProps {
  seat: Seat
  /** 头像左上角的小标签，比如「房主」。 */
  badge?: string
  /** 最下面的状态条，见 SeatStatus。 */
  status?: ReactNode
  /** 名字和状态条之间的补充信息，比如揭晓时的身份变化。 */
  children?: ReactNode
  /** 置灰：离线、出局。 */
  muted?: boolean
  selected?: boolean
  /** 头像角上的记号。不传时，选中就打勾。 */
  mark?: Mark
  /** 传了就能点。 */
  onSelect?: () => void
}

/** 一个座位：头像、座位号和名字，下面可以挂补充信息和状态条。 */
export function SeatTile({
  seat,
  badge,
  status,
  children,
  muted = false,
  selected = false,
  mark,
  onSelect,
}: SeatTileProps) {
  return (
    <li className="flex min-w-0 flex-col items-center gap-1.5">
      <Tappable onTap={onSelect} pressed={selected} label={seatLabel(seat)}>
        <span className="relative">
          <PlayerAvatar
            name={seat.name}
            tone={seat.isMe ? 'me' : muted ? 'muted' : 'default'}
            selected={selected}
            mark={mark ?? (selected ? 'check' : undefined)}
          />
          {badge && <Badge className="absolute -top-2 -left-6">{badge}</Badge>}
        </span>
        <span
          className={cn(
            'max-w-full truncate text-[13px]',
            muted && 'text-muted-foreground',
            selected && 'font-semibold',
          )}
        >
          <span className="font-mono font-normal text-muted-foreground">{seat.number}</span>{' '}
          {seat.name}
          {seat.isMe && <span className="font-normal text-muted-foreground"> · 你</span>}
        </span>
      </Tappable>
      {children}
      {status}
    </li>
  )
}

/** 大厅里还没人坐的座位。点一下邀请朋友。 */
export function EmptySeatTile({ number, onInvite }: { number: number; onInvite?: () => void }) {
  return (
    <li className="flex min-w-0 flex-col items-center gap-1.5">
      <Tappable onTap={onInvite} label={`${number} 号空座位，邀请朋友`}>
        <PlayerAvatar tone="empty">
          <Plus className="size-5" strokeWidth={1.6} />
        </PlayerAvatar>
        <span className="text-[13px] text-muted-foreground">
          <span className="font-mono">{number}</span> 等待
        </span>
      </Tappable>
      <SeatStatus tone="empty">空座位</SeatStatus>
    </li>
  )
}

interface TappableProps {
  onTap?: () => void
  pressed?: boolean
  /** 读屏软件念的名字。 */
  label: string
  children: ReactNode
}

/** 能点时是按钮，不能点时是普通的块，样子一样。 */
function Tappable({ onTap, pressed, label, children }: TappableProps) {
  const className = 'flex max-w-full flex-col items-center gap-1.5'
  if (!onTap) return <div className={className}>{children}</div>
  return (
    <button
      type="button"
      onClick={onTap}
      aria-pressed={pressed}
      aria-label={label}
      className={cn(
        className,
        'rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
      )}
    >
      {children}
    </button>
  )
}

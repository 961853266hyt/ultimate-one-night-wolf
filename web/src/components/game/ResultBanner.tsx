import type { ReactNode } from 'react'
import type { RoleId, Team } from '@/api/types'
import { Badge } from '@/components/ui/badge'
import { seatLabel, type Seat } from '@/game/seats'
import { cn } from '@/lib/utils'
import { TEAMS } from '@/roles/catalog'
import { RoleAvatar } from './RoleAvatar'
import { RoleName } from './RoleText'
import { useT } from '@/i18n'

interface ResultBannerProps {
  headline: string
  /** 只有一个阵营获胜时，标题用这个阵营的颜色。 */
  team: Team | null
  /** 我赢了还是输了；旁观的人是 null。 */
  outcome: 'won' | 'lost' | null
  /** 标题下面的说明，见 OutcomeRow。 */
  children?: ReactNode
}

/** 揭晓页顶部：输赢、哪个阵营获胜，下面一两行讲清楚谁出局、谁拿着狼牌。 */
export function ResultBanner({ headline, team, outcome, children }: ResultBannerProps) {
  const t = useT()
  return (
    <header className="flex flex-col items-center gap-2 text-center">
      {outcome === 'won' && <Badge className="bg-success/10 text-success">{t.reveal.youWon}</Badge>}
      {outcome === 'lost' && <Badge variant="destructive">{t.reveal.youLost}</Badge>}
      <h1 className={cn('text-[30px] leading-tight font-semibold', team && TEAMS[team].textClass)}>{headline}</h1>
      <div className="flex flex-col items-center gap-1.5">{children}</div>
    </header>
  )
}

interface OutcomeRowProps {
  label: string
  seats: readonly { seat: Seat; role: RoleId }[]
  /** 一个人都没有时写的话。 */
  empty: string
  /** 小标签里写不写角色名。狼人那一行都是狼，不用写。 */
  showRole?: boolean
}

/** 「出局 [2 号阿杰 · 捣蛋鬼]」：左边灰字，右边每个人一个带卡图的小标签。 */
export function OutcomeRow({ label, seats, empty, showRole = false }: OutcomeRowProps) {
  return (
    <p className="flex flex-wrap items-center justify-center gap-1.5 text-sm">
      <span className="text-muted-foreground">{label}</span>
      {seats.length === 0 && <span className="text-muted-foreground">{empty}</span>}
      {seats.map(({ seat, role }) => (
        <span key={seat.id} className="flex items-center gap-1 rounded-full bg-muted py-0.5 pr-2.5 pl-0.5 text-xs">
          <RoleAvatar role={role} className="size-5" />
          {seatLabel(seat)}
          {showRole && (
            <>
              <span className="text-muted-foreground">·</span>
              <RoleName role={role} />
            </>
          )}
        </span>
      ))}
    </p>
  )
}

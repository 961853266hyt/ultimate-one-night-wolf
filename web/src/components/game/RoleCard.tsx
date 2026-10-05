import type { RoleId } from '@/api/types'
import { ROLES, TEAMS } from '@/roles/catalog'
import { CardBack } from './PlayingCard'
import { RoleAvatar } from './RoleAvatar'
import { TeamDot } from './RoleText'

interface RoleCardProps {
  role: RoleId
  faceUp: boolean
  /** 这局夜里第几个醒；夜里不醒就是 null。 */
  wakeOrder: number | null
}

/** 一张大的身份牌。扣着时是牌背，翻开时是角色、阵营和能力说明。 */
export function RoleCard({ role, faceUp, wakeOrder }: RoleCardProps) {
  if (!faceUp) {
    return (
      <CardBack className="h-74 w-60 rounded-2xl" iconClassName="size-9">
        <span className="text-xs text-background/60">按住查看</span>
      </CardBack>
    )
  }

  const { name, team, ability } = ROLES[role]
  return (
    <div className="flex h-74 w-60 flex-col rounded-2xl border border-foreground bg-background p-4">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <TeamDot team={team} />
          {TEAMS[team].name}
        </span>
        <span>{wakeOrder ? `夜里第 ${wakeOrder} 个醒` : '夜里不醒'}</span>
      </div>
      <div className="flex flex-1 flex-col items-center justify-center gap-3">
        <RoleAvatar role={role} className="size-24" />
        <span className="text-[32px] leading-none font-semibold tracking-wide">{name}</span>
      </div>
      <p className="text-center text-[13px] leading-relaxed text-muted-foreground">{ability}</p>
    </div>
  )
}

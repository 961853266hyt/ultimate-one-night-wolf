import { useState } from 'react'
import type { RoleId } from '@/api/types'
import { CardBack } from './PlayingCard'
import { RoleArtCard } from './RoleArtCard'

interface RoleCardProps {
  role: RoleId
  /** 这局夜里第几个醒；夜里不醒就是 null。 */
  wakeOrder: number | null
  revealed: boolean
  onReveal: () => void
}

/** 看牌阶段的身份牌。扣着时点一下翻开；翻开后和角色详情里的牌一样，点一下看说明。 */
export function RoleCard({ role, wakeOrder, revealed, onReveal }: RoleCardProps) {
  const [expanded, setExpanded] = useState(false)

  if (!revealed) {
    return (
      <button
        type="button"
        onClick={onReveal}
        aria-label="翻开你的身份"
        className="rounded-[24px] outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <CardBack className="aspect-[200/274] w-74 rounded-[24px] shadow-lg" iconClassName="size-9">
          <span className="text-xs text-background/60">点一下翻开</span>
        </CardBack>
      </button>
    )
  }

  return (
    <RoleArtCard
      role={role}
      wakeOrder={wakeOrder}
      expanded={expanded}
      onToggle={() => setExpanded(!expanded)}
      className="shadow-lg duration-300 animate-in fade-in-0 zoom-in-95 motion-reduce:animate-none"
    />
  )
}

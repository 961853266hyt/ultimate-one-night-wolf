import type { RoleId } from '@/api/types'
import { CardBack } from './PlayingCard'
import { RoleArtCard } from './RoleArtCard'
import { RoleButton } from './RoleDetails'
import { useT } from '@/i18n'

interface RoleCardProps {
  role: RoleId
  revealed: boolean
  onReveal: () => void
}

/** 看牌阶段的身份牌。扣着时点一下翻开；翻开后是卡图，点一下打开角色详情看介绍。 */
export function RoleCard({ role, revealed, onReveal }: RoleCardProps) {
  const t = useT()

  if (!revealed) {
    return (
      <button
        type="button"
        onClick={onReveal}
        aria-label={t.deal.flipYourCard}
        className="rounded-[24px] outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <CardBack className="aspect-[200/274] w-74 rounded-[24px] shadow-lg" iconClassName="size-24">
          <span className="text-xs text-card-back-foreground/60">{t.deal.tapToFlip}</span>
        </CardBack>
      </button>
    )
  }

  return (
    <RoleButton role={role} className="rounded-[24px]">
      <RoleArtCard role={role} className="shadow-lg duration-300 animate-in fade-in-0 zoom-in-95 motion-reduce:animate-none" />
    </RoleButton>
  )
}

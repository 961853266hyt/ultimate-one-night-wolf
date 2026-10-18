import { useEffect } from 'react'
import type { RoleId } from '@/api/types'
import { usePressAndHold } from '@/hooks/usePressAndHold'
import { cn } from '@/lib/utils'
import { CardBack } from './PlayingCard'
import { RoleDetailCard } from './RoleArtCard'
import { useT } from '@/i18n'

// 手机上长按会弹菜单、选中文字或者滚动页面，都要关掉
const HOLDABLE = 'touch-none select-none [-webkit-touch-callout:none]'

interface RoleCardProps {
  role: RoleId
  /** 第一次按住看到了牌：看过才能点「我记住了」。 */
  onSeen: () => void
}

/**
 * 看牌阶段的身份牌：平时扣着，按住才翻开，松手就盖回去，面对面玩时旁边的人瞄不到。
 * 翻开的是带角色介绍的小号详情牌：看身份的同时就知道这个角色夜里做什么。
 * 牌面一直垫在牌背下面，只是看不见，按下去马上就出来，不会先闪一下。
 */
export function RoleCard({ role, onSeen }: RoleCardProps) {
  const { held, handlers } = usePressAndHold()
  const t = useT()
  useEffect(() => {
    if (held) onSeen()
  }, [held, onSeen])

  return (
    <button
      type="button"
      aria-label={t.deal.holdToView}
      aria-pressed={held}
      className={cn('relative rounded-[17px] outline-none focus-visible:ring-3 focus-visible:ring-ring/50', HOLDABLE)}
      {...handlers}
    >
      <CardBack className="aspect-[200/274] w-52 rounded-[17px] shadow-lg" iconClassName="size-16">
        <span className="text-xs text-card-back-foreground/60">{t.deal.holdToView}</span>
      </CardBack>
      {/* 没按着时对读屏软件也藏起来，免得念出卡图的名字 */}
      <span
        aria-hidden={!held}
        className={cn('absolute inset-0 text-left transition-opacity duration-150', held ? 'opacity-100' : 'opacity-0')}
      >
        <RoleDetailCard role={role} size="sm" className="shadow-lg" />
      </span>
    </button>
  )
}

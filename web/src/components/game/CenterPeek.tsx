/**
 * 夜里翻底牌：点一张底牌放大，先看到牌背；点牌背翻过来，露出角色。
 *
 * 点牌背就是行动本身，会发给服务端；牌面要等服务端回了「看到了什么」才知道，
 * 所以翻转等结果到了才开始，中间显示「翻开中…」。已经翻开的牌再点开，直接是正面。
 */
import { X } from 'lucide-react'
import { useState } from 'react'
import type { RoleId } from '@/api/types'
import { Button } from '@/components/ui/button'
import { Dialog, DialogClose, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { CardBack } from './PlayingCard'
import { RoleArtCard } from './RoleArtCard'

interface CenterPeekProps {
  /** 放大的是哪张底牌，null 时关着。 */
  slot: string | null
  /** A、B、C。 */
  letter: string
  /** 已经知道的牌面；不传就是还扣着。 */
  role?: RoleId
  /** 能不能翻：轮到你、这张牌可以选。 */
  canFlip: boolean
  /** 翻开之后的下一步提示，比如「再翻开 1 张底牌」。 */
  hint?: string
  onFlip: () => void
  onClose: () => void
}

export function CenterPeek({ slot, letter, role, canFlip, hint, onFlip, onClose }: CenterPeekProps) {
  return (
    <Dialog open={slot !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        showCloseButton={false}
        overlayClassName="bg-black/70"
        className="w-auto max-w-none justify-items-center gap-6 bg-transparent p-0 ring-0 sm:max-w-none"
      >
        {/* 换一张牌就重新挂载，翻没翻的状态不会带过去 */}
        {slot !== null && (
          <PeekCard key={slot} letter={letter} role={role} canFlip={canFlip} hint={hint} onFlip={onFlip} />
        )}
      </DialogContent>
    </Dialog>
  )
}

type PeekCardProps = Omit<CenterPeekProps, 'slot' | 'onClose'>

function PeekCard({ letter, role, canFlip, hint, onFlip }: PeekCardProps) {
  const [requested, setRequested] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const faceUp = role !== undefined
  const waiting = requested && !faceUp

  const flip = () => {
    if (!canFlip || requested) return
    setRequested(true)
    onFlip()
  }

  return (
    <>
      <DialogTitle className="text-base font-medium text-white">{letter} 号底牌</DialogTitle>

      {/* 正反两面叠在一起，整张转 180 度。打开时已经是正面的，第一次渲染就在正面，不会转 */}
      <div className="perspective-[1200px]">
        <div
          className={cn(
            'relative aspect-[200/274] w-74 transition-transform duration-700 ease-[cubic-bezier(0.4,0,0.2,1)] transform-3d motion-reduce:transition-none',
            faceUp && 'rotate-y-180',
          )}
        >
          <button
            type="button"
            onClick={flip}
            disabled={!canFlip || requested}
            aria-label={`翻开 ${letter} 号底牌`}
            className="absolute inset-0 rounded-[24px] outline-none backface-hidden focus-visible:ring-3 focus-visible:ring-white/60"
          >
            <CardBack className="size-full rounded-[24px] shadow-2xl" iconClassName="size-24">
              <span className="text-xs text-card-back-foreground/60">
                {waiting ? '翻开中…' : canFlip ? '点一下翻开' : ''}
              </span>
            </CardBack>
          </button>
          <div className="absolute inset-0 rotate-y-180 backface-hidden">
            {role && <RoleArtCard role={role} expanded={expanded} onToggle={() => setExpanded(!expanded)} />}
          </div>
        </div>
      </div>

      {faceUp && hint && <p className="max-w-74 text-center text-sm text-white/80">{hint}</p>}
      {/* 和角色详情弹窗一样的圆形关闭按钮 */}
      <DialogClose
        render={
          <Button
            variant="ghost"
            size="icon-xl"
            aria-label={faceUp ? '放回' : '先不看'}
            className="rounded-full bg-white/15 text-white hover:bg-white/25 hover:text-white"
          />
        }
      >
        <X className="size-5" />
      </DialogClose>
    </>
  )
}

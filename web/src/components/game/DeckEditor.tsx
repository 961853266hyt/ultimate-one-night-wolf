/**
 * 房主调整这局用哪些牌。上面是牌库，点一下放进本局；下面是本局，点「−」放回牌库，点头像看介绍。
 *
 * 改完点「完成」才发给服务端，中途关掉就当没改过。
 */
import { Minus, RotateCcw, X } from 'lucide-react'
import { useState } from 'react'
import type { RoleId } from '@/api/types'
import { Button } from '@/components/ui/button'
import { Drawer, DrawerClose, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
import { boxCardsOf, CARD_BOX, deckOf, sameRoles } from '@/game/deck'
import { deckSizeFor, MAX_DECK, MIN_DECK } from '@/game/lobby'
import { cn } from '@/lib/utils'
import { ROLES } from '@/roles/catalog'
import { CardGrid, CardSlot, EmptyCardSlot } from './CardGrid'

interface DeckEditorProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** 房间现在用的牌。每次打开都从这里开始改。 */
  deck: readonly RoleId[]
  /** 现在有几个人，决定要几张牌。 */
  players: number
  /** 按现在的人数推荐的牌，服务端给的。 */
  recommended: readonly RoleId[]
  /** 点「完成」时调用。和按人数推荐的一样时传 null，之后有人进出，牌会自动跟着变。 */
  onSave: (deck: RoleId[] | null) => void
}

export function DeckEditor({ open, onOpenChange, deck, players, recommended, onSave }: DeckEditorProps) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange} showSwipeHandle>
      <DrawerContent className="mx-auto w-full max-w-md">
        {/* 关上之后里面会卸载，下次打开重新从房间现在的牌开始 */}
        <DeckEditorBody
          deck={deck}
          players={players}
          recommended={recommended}
          onSave={(next) => {
            onSave(next)
            onOpenChange(false)
          }}
        />
      </DrawerContent>
    </Drawer>
  )
}

/** 牌堆里的牌在牌盒里的 id。 */
function idsOf(deck: readonly RoleId[]): string[] {
  return boxCardsOf(deck).map((card) => card.id)
}

const SECTION_LABEL = 'text-[13px] font-semibold text-muted-foreground'

type BodyProps = Pick<DeckEditorProps, 'deck' | 'players' | 'recommended' | 'onSave'>

function DeckEditorBody({ deck, players, recommended, onSave }: BodyProps) {
  // 存牌盒里的 id 而不是角色：同一种角色的几张也分得清，牌库里点了哪张，就是哪张空出来
  const [picked, setPicked] = useState(() => idsOf(deck))
  const need = deckSizeFor(players)
  const chosen = deckOf(picked)
  const isRecommended = sameRoles(chosen, recommended)
  const missing = need - picked.length
  const savable = picked.length >= MIN_DECK && picked.length <= MAX_DECK

  const take = (id: string) => setPicked((current) => [...current, id])
  const putBack = (id: string) => setPicked((current) => current.filter((other) => other !== id))

  // 牌数对上是黑色，少了橙色，多了红色
  const countTone = missing > 0 ? 'text-warning' : missing < 0 ? 'text-destructive' : 'text-foreground'

  return (
    <>
      <DrawerHeader className="flex-row items-center justify-between py-1 pr-2 pl-5">
        <DrawerTitle className="text-[17px] font-semibold">调整角色</DrawerTitle>
        <DrawerClose render={<Button variant="ghost" size="icon-xl" aria-label="取消" />}>
          <X className="size-5" />
        </DrawerClose>
      </DrawerHeader>

      <section className="flex min-h-0 flex-1 flex-col gap-3.5 overflow-y-auto px-5 pt-2 pb-6">
        <h3 className={SECTION_LABEL}>牌库</h3>
        <CardGrid>
          {CARD_BOX.map((card) => {
            const { name } = ROLES[card.role]
            return picked.includes(card.id) ? (
              // 放进本局的牌在牌库里留个空位，别的牌不挪地方
              <EmptyCardSlot key={card.id}>
                {name}
                <span className="sr-only">，已放进本局</span>
              </EmptyCardSlot>
            ) : (
              <CardSlot
                key={card.id}
                role={card.role}
                onSelect={() => take(card.id)}
                selectLabel={`把${name}放进本局`}
              />
            )
          })}
        </CardGrid>
      </section>

      <section className="flex shrink-0 flex-col gap-4 border-t bg-muted/50 px-5 pt-4 pb-[max(1.75rem,env(safe-area-inset-bottom))]">
        <header className="flex min-h-8 items-center justify-between gap-3">
          <div className="flex items-baseline gap-2.5">
            <h3 className={SECTION_LABEL}>本局</h3>
            <p aria-live="polite" className="text-[13px] text-muted-foreground">
              {players} 人 ·{' '}
              <span className={cn('font-mono font-medium', countTone)}>
                {picked.length}/{need}
              </span>{' '}
              张
            </p>
          </div>
          {isRecommended ? (
            <span className="text-xs text-muted-foreground">按人数推荐</span>
          ) : (
            <Button variant="outline" className="text-xs" onClick={() => setPicked(idsOf(recommended))}>
              <RotateCcw aria-hidden className="size-3.5" />
              恢复推荐
            </Button>
          )}
        </header>

        <CardGrid>
          {CARD_BOX.filter((card) => picked.includes(card.id)).map((card) => (
            <CardSlot
              key={card.id}
              role={card.role}
              corner={<PutBackButton name={ROLES[card.role].name} onClick={() => putBack(card.id)} />}
            />
          ))}
          {Array.from({ length: Math.max(0, missing) }, (_, index) => (
            <EmptyCardSlot key={`empty-${index}`}>空位</EmptyCardSlot>
          ))}
        </CardGrid>

        <Button size="xl" disabled={!savable} onClick={() => onSave(isRecommended ? null : chosen)}>
          {savable ? '完成' : picked.length < MIN_DECK ? `至少要 ${MIN_DECK} 张牌` : `最多 ${MAX_DECK} 张牌`}
        </Button>
      </section>
    </>
  )
}

/** 本局里每张牌右上角的「−」：点了放回牌库。 */
function PutBackButton({ name, onClick }: { name: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`把${name}放回牌库`}
      // 看得见的圆点只有 20px，能按的范围放大到 28px，手指好点
      className="group/put-back absolute -top-2.5 left-[calc(50%+6px)] flex size-7 items-center justify-center rounded-full outline-none"
    >
      <span className="flex size-5 items-center justify-center rounded-full border-2 border-background bg-foreground text-background transition-transform group-hover/put-back:scale-110 group-focus-visible/put-back:ring-3 group-focus-visible/put-back:ring-ring/50">
        <Minus aria-hidden className="size-3" strokeWidth={3} />
      </span>
    </button>
  )
}

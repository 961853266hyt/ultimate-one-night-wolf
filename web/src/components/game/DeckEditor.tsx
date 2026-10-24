/**
 * 房主调整本局设置。最上面是房间人数、夜间操作时间、能不能投自己、公开房间和调试模式；中间是牌库，点一下放进本局；
 * 下面是本局，点「−」放回牌库，点头像看介绍。
 *
 * 守夜人这类要成对放的牌，点一张另一张跟着进出。改完点「保存设置」才发给服务端，中途关掉就当没改过。
 */
import { Minus, Plus, RotateCcw, X } from 'lucide-react'
import { useState } from 'react'
import type { RoleId, Settings } from '@/api/types'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Drawer, DrawerClose, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
import { boxCardsOf, CARD_BOX, cardsMovedWith, deckOf, sameRoles, type BoxCard } from '@/game/deck'
import { deckSizeFor, MAX_DECK, MAX_PLAYERS, MIN_DECK, MIN_PLAYERS } from '@/game/lobby'
import { cn } from '@/lib/utils'
import { ROLES } from '@/roles/catalog'
import { CardGrid, CardSlot, EmptyCardSlot } from './CardGrid'
import { useT } from '@/i18n'

interface DeckEditorProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** 房间现在用的牌。每次打开都从这里开始改。 */
  deck: readonly RoleId[]
  /** 房间现在几个座位，决定要几张牌。 */
  seats: number
  /** 已经进来几个真人：座位不能比这更少。机器人会让座，不算。 */
  occupied: number
  /** 每种座位数推荐的牌，服务端给的。 */
  recommended: Readonly<Record<string, readonly RoleId[]>>
  /** 夜里每一步几秒，现在的设置。 */
  nightStep: number
  /** 能不能投自己，现在的设置。 */
  selfVote: boolean
  /** 在不在「房间」列表里，现在的设置。 */
  isPublic: boolean
  /** 调试模式开没开，现在的设置。 */
  debug: boolean
  /** 点「保存设置」时调用。牌和按座位数推荐的一样时 deck 传 null，之后改座位数，牌会自动跟着变。 */
  onSave: (settings: Settings) => void
}

export function DeckEditor({
  open,
  onOpenChange,
  deck,
  seats,
  occupied,
  recommended,
  nightStep,
  selfVote,
  isPublic,
  debug,
  onSave,
}: DeckEditorProps) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange} showSwipeHandle>
      <DrawerContent className="mx-auto w-full max-w-md">
        {/* 关上之后里面会卸载，下次打开重新从房间现在的牌开始 */}
        <DeckEditorBody
          deck={deck}
          seats={seats}
          occupied={occupied}
          recommended={recommended}
          nightStep={nightStep}
          selfVote={selfVote}
          isPublic={isPublic}
          debug={debug}
          onSave={(settings) => {
            onSave(settings)
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

type BodyProps = Pick<
  DeckEditorProps,
  'deck' | 'seats' | 'occupied' | 'recommended' | 'nightStep' | 'selfVote' | 'isPublic' | 'debug' | 'onSave'
>

function DeckEditorBody({
  deck,
  seats,
  occupied,
  recommended,
  nightStep,
  selfVote,
  isPublic,
  debug,
  onSave,
}: BodyProps) {
  // 存牌盒里的 id 而不是角色：同一种角色的几张也分得清，牌库里点了哪张，就是哪张空出来
  const [picked, setPicked] = useState(() => idsOf(deck))
  const [size, setSize] = useState(seats)
  const [step, setStep] = useState(nightStep)
  const [canVoteSelf, setCanVoteSelf] = useState(selfVote)
  const [listed, setListed] = useState(isPublic)
  const [debugMode, setDebugMode] = useState(debug)
  const t = useT()
  const need = deckSizeFor(size)
  const chosen = deckOf(picked)
  const recommendedFor = (n: number) => recommended[n] ?? []
  const isRecommended = sameRoles(chosen, recommendedFor(size))
  const missing = need - picked.length
  const savable = picked.length >= MIN_DECK && picked.length <= MAX_DECK

  const take = (card: BoxCard) => {
    const moved = cardsMovedWith(card)
    setPicked((current) => [...current, ...moved.filter((id) => !current.includes(id))])
  }
  const putBack = (card: BoxCard) => {
    const moved = cardsMovedWith(card)
    setPicked((current) => current.filter((id) => !moved.includes(id)))
  }
  // 改人数时，牌还是推荐的那副，就换成新人数的推荐；自己配过的牌不动
  const resize = (next: number) => {
    if (isRecommended) setPicked(idsOf(recommendedFor(next)))
    setSize(next)
  }

  // 牌数对上是黑色，少了橙色，多了红色
  const countTone = missing > 0 ? 'text-warning' : missing < 0 ? 'text-destructive' : 'text-foreground'

  return (
    <>
      <DrawerHeader className="flex-row items-center justify-between py-1 pr-2 pl-5">
        <DrawerTitle className="text-[17px] font-semibold">{t.settings.title}</DrawerTitle>
        <DrawerClose render={<Button variant="ghost" size="icon-xl" aria-label={t.common.cancel} />}>
          <X className="size-5" />
        </DrawerClose>
      </DrawerHeader>

      <section className="flex min-h-0 flex-1 flex-col gap-3.5 overflow-y-auto px-5 pt-2 pb-6">
        <div className="flex flex-col gap-3 rounded-xl border px-3.5 py-3">
          <div className="flex items-center justify-between gap-3">
            <h3 className={SECTION_LABEL}>{t.settings.roomSize}</h3>
            <SeatCountStepper value={size} min={Math.max(MIN_PLAYERS, occupied)} onChange={resize} />
          </div>
          <div className="flex items-center justify-between gap-3">
            <h3 className={SECTION_LABEL}>{t.settings.nightTime}</h3>
            <NightStepPicker value={step} onChange={setStep} />
          </div>
          <label className="flex items-center justify-between gap-3">
            <span className={SECTION_LABEL}>{t.settings.selfVote}</span>
            <Switch checked={canVoteSelf} onCheckedChange={setCanVoteSelf} />
          </label>
          <label className="flex items-center justify-between gap-3">
            <span className={SECTION_LABEL}>{t.settings.public}</span>
            <Switch checked={listed} onCheckedChange={setListed} />
          </label>
          <label className="flex items-center justify-between gap-3">
            <span className={SECTION_LABEL}>{t.settings.debug}</span>
            <Switch checked={debugMode} onCheckedChange={setDebugMode} />
          </label>
        </div>

        <h3 className={cn(SECTION_LABEL, 'mt-2')}>{t.settings.box}</h3>
        <CardGrid>
          {CARD_BOX.map((card) => {
            const { name, pairs } = ROLES[card.role]
            return picked.includes(card.id) ? (
              // 放进本局的牌在牌库里留个空位，别的牌不挪地方
              <EmptyCardSlot key={card.id}>
                {name}
                <span className="sr-only">{t.settings.inDeck}</span>
              </EmptyCardSlot>
            ) : (
              <CardSlot
                key={card.id}
                role={card.role}
                onSelect={() => take(card)}
                selectLabel={t.settings.take(name, pairs === true)}
              />
            )
          })}
        </CardGrid>
      </section>

      <section className="flex shrink-0 flex-col gap-4 border-t bg-muted/50 px-5 pt-4 pb-[max(1.75rem,env(safe-area-inset-bottom))]">
        <header className="flex min-h-8 items-center justify-between gap-3">
          <div className="flex items-baseline gap-2.5">
            <h3 className={SECTION_LABEL}>{t.settings.inGame}</h3>
            <p aria-live="polite" className="text-[13px] text-muted-foreground">
              {t.settings.deckCount(size)}{' '}
              <span className={cn('font-mono font-medium', countTone)}>
                {picked.length}/{need}
              </span>{' '}
              {t.settings.cards}
            </p>
          </div>
          {isRecommended ? (
            <span className="text-xs text-muted-foreground">{t.settings.recommended}</span>
          ) : (
            <Button variant="outline" className="text-xs" onClick={() => setPicked(idsOf(recommendedFor(size)))}>
              <RotateCcw aria-hidden className="size-3.5" />
              {t.settings.resetRecommended}
            </Button>
          )}
        </header>

        <CardGrid>
          {CARD_BOX.filter((card) => picked.includes(card.id)).map((card) => (
            <CardSlot
              key={card.id}
              role={card.role}
              corner={<PutBackButton role={card.role} onClick={() => putBack(card)} />}
            />
          ))}
          {Array.from({ length: Math.max(0, missing) }, (_, index) => (
            <EmptyCardSlot key={`empty-${index}`}>{t.settings.emptySlot}</EmptyCardSlot>
          ))}
        </CardGrid>

        <Button
          size="xl"
          disabled={!savable}
          onClick={() =>
            onSave({
              seats: size,
              deck: isRecommended ? null : chosen,
              timings: { night_step: step },
              self_vote: canVoteSelf,
              public: listed,
              debug: debugMode,
            })
          }
        >
          {savable ? t.settings.save : picked.length < MIN_DECK ? t.settings.atLeast(MIN_DECK) : t.settings.atMost(MAX_DECK)}
        </Button>
      </section>
    </>
  )
}

/** 房间几个座位：− 数字 +。不能少于已经进来的人，最多 10 个。 */
function SeatCountStepper({ value, min, onChange }: { value: number; min: number; onChange: (value: number) => void }) {
  const t = useT()
  const step = 'flex size-7 items-center justify-center rounded-md outline-none transition-colors hover:bg-background focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-35 disabled:hover:bg-transparent'
  return (
    <div role="group" aria-label={t.settings.roomSize} className="flex items-center gap-1 rounded-lg bg-muted p-0.5">
      <button type="button" aria-label={t.settings.fewerSeats} disabled={value <= min} onClick={() => onChange(value - 1)} className={step}>
        <Minus aria-hidden className="size-3.5" />
      </button>
      <span aria-live="polite" className="min-w-11 text-center text-xs font-medium">
        {t.settings.people(value)}
      </span>
      <button
        type="button"
        aria-label={t.settings.moreSeats}
        disabled={value >= MAX_PLAYERS}
        onClick={() => onChange(value + 1)}
        className={step}
      >
        <Plus aria-hidden className="size-3.5" />
      </button>
    </div>
  )
}

/** 夜里每一步可以选的秒数。服务端允许 5–60 秒。 */
const NIGHT_STEPS = [10, 15, 20, 30, 45, 60]

/** 选夜里每一步几秒。房间里现在的值不在选项里时，也列出来。 */
function NightStepPicker({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  const options = NIGHT_STEPS.includes(value) ? NIGHT_STEPS : [...NIGHT_STEPS, value].sort((a, b) => a - b)
  const t = useT()
  return (
    <div role="group" aria-label={t.settings.nightTime} className="flex gap-0.5 rounded-lg bg-muted p-0.5">
      {options.map((option) => (
        <button
          key={option}
          type="button"
          aria-pressed={value === option}
          aria-label={t.settings.seconds(option)}
          onClick={() => onChange(option)}
          className={cn(
            'h-7 min-w-9 rounded-md px-1.5 font-mono text-xs font-medium outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50',
            value === option ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {t.settings.secondsShort(option)}
        </button>
      ))}
    </div>
  )
}

/** 本局里每张牌右上角的「−」：点了放回牌库。 */
function PutBackButton({ role, onClick }: { role: RoleId; onClick: () => void }) {
  const { name, pairs } = ROLES[role]
  const t = useT()
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={t.settings.putBack(name, pairs === true)}
      // 看得见的圆点只有 20px，能按的范围放大到 28px，手指好点
      className="group/put-back absolute -top-2.5 left-[calc(50%+6px)] flex size-7 items-center justify-center rounded-full outline-none"
    >
      <span className="flex size-5 items-center justify-center rounded-full border-2 border-background bg-foreground text-background transition-transform group-hover/put-back:scale-110 group-focus-visible/put-back:ring-3 group-focus-visible/put-back:ring-ring/50">
        <Minus aria-hidden className="size-3" strokeWidth={3} />
      </span>
    </button>
  )
}

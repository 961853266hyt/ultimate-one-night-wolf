/**
 * 给座位做标记：猜他是什么角色，头像就换成那个角色的卡图。
 *
 * 每个人有两套身份可以标：发到的牌（初始身份）和夜里换完之后的牌（最终身份）。座位标题右边的开关
 * 切换看哪一套，点头像标的也是正在看的那一套。自己的初始身份就是发到的牌，直接显示，不用标。
 * 白天讨论时，三张底牌也能这样标，跟着同一个开关。
 *
 * 只是自己的备忘：存在这台设备上，不发给服务器，别人看不到。刷新不丢，回到大厅（下一局之前）清空。
 * 开局之后到投票都显示；揭晓时大家都亮了牌，就不显示了。
 */
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { storageKey } from '@/api/session'
import type { Phase, PlayerView, RoleId } from '@/api/types'
import { Button } from '@/components/ui/button'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
import { boxCardsOf, type BoxCard } from '@/game/deck'
import { centerLetter, type Seat } from '@/game/seats'
import { cn } from '@/lib/utils'
import { ROLES } from '@/roles/catalog'
import { CardGrid, CardSlot } from './CardGrid'
import { CornerMark } from './CornerMark'
import { useT } from '@/i18n'

/** 看哪一套身份：发到的牌，还是夜里换完之后的牌。 */
export type Identity = 'initial' | 'final'

type Notes = Record<Identity, Record<string, RoleId>>

const EMPTY: Notes = { initial: {}, final: {} }

interface SeatNotesValue {
  /** 这一局里头像显示身份：开局之后到投票。不显示时头像照旧是座位号。 */
  active: boolean
  /** 正在看的那一套。发牌时只有初始身份。 */
  identity: Identity
  /** 能不能切换：发牌之后才能切。 */
  switchable: boolean
  setIdentity: (identity: Identity) => void
  /** 这个座位在正在看的那一套里是什么角色，没标就是 undefined。 */
  roleOf: (seat: Seat) => RoleId | undefined
  /** 能不能标：自己的初始身份是确定的，不用标。 */
  canEdit: (seat: Seat) => boolean
  /** 打开抽屉，给这个座位标正在看的那一套。 */
  edit: (seat: Seat) => void
  /** 底牌在正在看的那一套里标的是什么角色，没标就是 undefined。 */
  roleOfCenter: (slot: string) => RoleId | undefined
  /** 打开抽屉，给这张底牌标正在看的那一套。 */
  editCenter: (slot: string) => void
}

/** 正在标的是谁：一个座位或者一张底牌。 */
interface NoteTarget {
  id: string
  /** 抽屉的标题，比如「给 2 号添加备注」。 */
  title: string
  isMe: boolean
}

const SeatNotesContext = createContext<SeatNotesValue>({
  active: false,
  identity: 'initial',
  switchable: false,
  setIdentity: () => {},
  roleOf: () => undefined,
  canEdit: () => false,
  edit: () => {},
  roleOfCenter: () => undefined,
  editCenter: () => {},
})

export function useSeatNotes(): SeatNotesValue {
  return useContext(SeatNotesContext)
}

const SWITCHABLE: readonly Phase[] = ['night', 'day', 'vote']

export function SeatNotesProvider({ view, children }: { view: PlayerView; children: ReactNode }) {
  const [notes, setNotes] = useStoredNotes(view.room.code, view.me.id, view.phase === 'lobby')
  const active = view.phase !== 'lobby' && view.phase !== 'reveal'
  const switchable = SWITCHABLE.includes(view.phase)

  // 每次进白天都先看初始身份；回大厅、开新一局也是
  const [chosen, setIdentity] = useState<Identity>('initial')
  useEffect(() => {
    if (view.phase !== 'night' && view.phase !== 'vote') setIdentity('initial')
  }, [view.phase])
  const identity = switchable ? chosen : 'initial'

  // 发牌时牌还没翻开，自己的头像先不露底；入夜之后就显示发到的牌
  const myCard = view.phase === 'deal' ? null : view.me.card
  // 有机器人的一局：房主和机器人互相看得到发到的牌，直接画在头像上，不用备注
  const known = view.me.known_dealt

  // 抽屉关上时还留着是谁，收起的动画里标题不会突然变空
  const [editing, setEditing] = useState<NoteTarget | null>(null)
  const t = useT()
  const [open, setOpen] = useState(false)

  const value = useMemo<SeatNotesValue>(() => {
    const knownIn = (which: Identity, seat: Seat) =>
      which === 'initial' && (seat.isMe || known[seat.id] !== undefined)
    const roleIn = (which: Identity, seat: Seat) => {
      if (which !== 'initial') return notes[which][seat.id]
      if (seat.isMe) return myCard ?? undefined
      return known[seat.id] ?? notes.initial[seat.id]
    }
    return {
      active,
      identity,
      switchable,
      setIdentity,
      roleOf: (seat) => (active ? roleIn(identity, seat) : undefined),
      canEdit: (seat) => !knownIn(identity, seat),
      edit: (seat) => {
        setEditing({ id: seat.id, title: seat.isMe ? t.notes.addForSelf : t.notes.addFor(seat.number), isMe: seat.isMe })
        setOpen(true)
      },
      roleOfCenter: (slot) => (active ? notes[identity][slot] : undefined),
      editCenter: (slot) => {
        setEditing({ id: slot, title: t.notes.addForCenter(centerLetter(slot)), isMe: false })
        setOpen(true)
      },
    }
  }, [active, identity, switchable, notes, myCard, known, t])

  const pick = (role: RoleId | null) => {
    if (editing) {
      setNotes((current) => {
        const { [editing.id]: _, ...rest } = current[identity]
        return { ...current, [identity]: role ? { ...rest, [editing.id]: role } : rest }
      })
    }
    setOpen(false)
  }

  // 抽屉里顺便写上另一套标了什么，比如标最终身份时看得到初始身份猜的是谁
  const other: Identity = identity === 'initial' ? 'final' : 'initial'
  const otherRole =
    editing && (other === 'initial' && editing.isMe ? myCard : notes[other][editing.id])
  const otherNote = t.notes.other(t.notes.identity[other], otherRole ? ROLES[otherRole].name : t.notes.none)

  return (
    <SeatNotesContext.Provider value={value}>
      {children}
      <NoteDrawer
        open={open}
        onOpenChange={setOpen}
        title={editing?.title ?? ''}
        identity={identity}
        otherNote={switchable ? otherNote : null}
        cards={boxCardsOf(view.room.deck)}
        note={editing ? notes[identity][editing.id] : undefined}
        onPick={pick}
      />
    </SeatNotesContext.Provider>
  )
}

/** 座位标题右边的开关：看初始身份还是最终身份。发牌之后才有。 */
export function IdentitySwitch() {
  const { switchable, identity, setIdentity } = useSeatNotes()
  if (!switchable) return null
  return <IdentityToggle value={identity} onChange={setIdentity} />
}

/** 「初始 / 最终」两段的开关，只管样子。揭晓页拿它切换看发到的牌还是最后的牌。 */
export function IdentityToggle({ value, onChange }: { value: Identity; onChange: (value: Identity) => void }) {
  const t = useT()
  return (
    <div role="group" aria-label={t.notes.whichIdentity} className="flex gap-0.5 rounded-lg bg-muted p-0.5">
      {(['initial', 'final'] as const).map((option) => (
        <button
          key={option}
          type="button"
          aria-pressed={value === option}
          aria-label={t.notes.identity[option]}
          onClick={() => onChange(option)}
          className={cn(
            'h-7 rounded-md px-2.5 text-xs font-medium outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50',
            value === option
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {t.notes.identityShort[option]}
        </button>
      ))}
    </div>
  )
}

/**
 * 存在 localStorage 里的标记，每个房间、每个身份一份：房主替机器人操作时，机器人有它自己的一套。
 * inLobby 时清空：回到大厅就是下一局了。
 */
function useStoredNotes(code: string, me: string, inLobby: boolean) {
  const key = storageKey(`notes.${code}.${me}`)
  const [notes, setNotes] = useState<Notes>(() => load(key))

  useEffect(() => {
    if (inLobby) setNotes(EMPTY)
  }, [inLobby])

  useEffect(() => {
    const empty = !Object.keys(notes.initial).length && !Object.keys(notes.final).length
    if (empty) localStorage.removeItem(key)
    else localStorage.setItem(key, JSON.stringify(notes))
  }, [key, notes])

  return [notes, setNotes] as const
}

function load(key: string): Notes {
  try {
    const saved = JSON.parse(localStorage.getItem(key) ?? '{}') as Partial<Notes>
    // 以前只存一套，格式不一样，直接不要了
    return { initial: saved.initial ?? {}, final: saved.final ?? {} }
  } catch {
    return EMPTY
  }
}

interface NoteDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  /** 标的是哪一套。 */
  identity: Identity
  /** 另一套标了什么，写在标题下面作参考；发牌时只有一套，就是 null。 */
  otherNote: string | null
  /** 本局的每一张牌，重复的角色有几张就列几张：抽屉也拿来看这局配了什么。 */
  cards: readonly BoxCard[]
  note: RoleId | undefined
  /** 选了一个角色；null 是清除标记。 */
  onPick: (role: RoleId | null) => void
}

function NoteDrawer({
  open,
  onOpenChange,
  title,
  identity,
  otherNote,
  cards,
  note,
  onPick,
}: NoteDrawerProps) {
  const t = useT()
  return (
    <Drawer open={open} onOpenChange={onOpenChange} showSwipeHandle>
      <DrawerContent className="mx-auto w-full max-w-md">
        <DrawerHeader className="items-center gap-1.5">
          <DrawerTitle>{title}</DrawerTitle>
          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="rounded-full bg-foreground px-2 py-0.5 font-medium text-background">
              {t.notes.identity[identity]}
            </span>
            {otherNote}
          </p>
        </DrawerHeader>
        <div className="flex flex-col gap-3.5 px-5 pt-4 pb-[max(2rem,env(safe-area-inset-bottom))]">
          <h3 className="text-[13px] font-semibold text-muted-foreground">
            {t.settings.inGame} · {t.settings.cardsOf(cards.length)}
          </h3>
          <CardGrid>
            {cards.map((card) => (
              <CardSlot
                key={card.id}
                role={card.role}
                onSelect={() => onPick(card.role)}
                selectLabel={t.notes.markAs(ROLES[card.role].name)}
                // 同一种角色有好几张时，只在第一张上打勾
                corner={card.role === note && card.copy === 1 ? <PickedMark /> : undefined}
              />
            ))}
          </CardGrid>
          {note && (
            <Button variant="outline" size="xl" className="mt-2.5" onClick={() => onPick(null)}>
              {t.notes.clear}
            </Button>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  )
}

/** 当前标记的角色右上角打个勾。和 CardSlot 里 size-12 的头像对齐。 */
function PickedMark() {
  return (
    <span className="pointer-events-none absolute top-0 left-1/2 size-12 -translate-x-1/2">
      <CornerMark mark="check" />
    </span>
  )
}

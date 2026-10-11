/**
 * 给别人的头像做标记：猜他是什么角色，头像就换成那个角色的卡图。
 *
 * 只是自己的备忘：存在这台设备上，不发给服务器，别人看不到。刷新不丢，回到大厅（下一局之前）清空。
 * 开局之后到投票都显示；揭晓时大家都亮了牌，就不显示了。
 */
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { storageKey } from '@/api/session'
import type { PlayerView, RoleId } from '@/api/types'
import { Button } from '@/components/ui/button'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
import type { Seat } from '@/game/seats'
import { ROLES } from '@/roles/catalog'
import { CardGrid, CardSlot } from './CardGrid'
import { CornerMark } from './CornerMark'

type Notes = Record<string, RoleId>

interface SeatNotesValue {
  /** 这个座位的标记，没有就是 undefined。 */
  noteOf: (seat: string) => RoleId | undefined
  /** 打开抽屉，给这个座位做标记。 */
  edit: (seat: Seat) => void
}

const SeatNotesContext = createContext<SeatNotesValue>({ noteOf: () => undefined, edit: () => {} })

export function useSeatNotes(): SeatNotesValue {
  return useContext(SeatNotesContext)
}

export function SeatNotesProvider({ view, children }: { view: PlayerView; children: ReactNode }) {
  const [notes, setNotes] = useStoredNotes(view.room.code, view.phase === 'lobby')
  const shown = view.phase !== 'lobby' && view.phase !== 'reveal'

  // 抽屉关上时还留着是谁，收起的动画里标题不会突然变空
  const [editing, setEditing] = useState<Seat | null>(null)
  const [open, setOpen] = useState(false)

  const value = useMemo<SeatNotesValue>(
    () => ({
      noteOf: (seat) => (shown ? notes[seat] : undefined),
      edit: (seat) => {
        setEditing(seat)
        setOpen(true)
      },
    }),
    [notes, shown],
  )

  const pick = (role: RoleId | null) => {
    if (editing) {
      setNotes((current) => {
        const { [editing.id]: _, ...rest } = current
        return role ? { ...rest, [editing.id]: role } : rest
      })
    }
    setOpen(false)
  }

  return (
    <SeatNotesContext.Provider value={value}>
      {children}
      <NoteDrawer
        open={open}
        onOpenChange={setOpen}
        seat={editing}
        roles={rolesIn(view.room.deck)}
        note={editing ? notes[editing.id] : undefined}
        onPick={pick}
      />
    </SeatNotesContext.Provider>
  )
}

/** 存在 localStorage 里的标记，每个房间一份。inLobby 时清空：回到大厅就是下一局了。 */
function useStoredNotes(code: string, inLobby: boolean) {
  const key = storageKey(`notes.${code}`)
  const [notes, setNotes] = useState<Notes>(() => load(key))

  useEffect(() => {
    if (inLobby) setNotes({})
  }, [inLobby])

  useEffect(() => {
    if (Object.keys(notes).length) localStorage.setItem(key, JSON.stringify(notes))
    else localStorage.removeItem(key)
  }, [key, notes])

  return [notes, setNotes] as const
}

function load(key: string): Notes {
  try {
    return JSON.parse(localStorage.getItem(key) ?? '{}') as Notes
  } catch {
    return {}
  }
}

/** 这局牌里有哪些角色，每种一个，按角色目录的顺序。 */
function rolesIn(deck: readonly RoleId[]): RoleId[] {
  return (Object.keys(ROLES) as RoleId[]).filter((role) => deck.includes(role))
}

interface NoteDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  seat: Seat | null
  roles: readonly RoleId[]
  note: RoleId | undefined
  /** 选了一个角色；null 是清除标记。 */
  onPick: (role: RoleId | null) => void
}

function NoteDrawer({ open, onOpenChange, seat, roles, note, onPick }: NoteDrawerProps) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange} showSwipeHandle>
      <DrawerContent className="mx-auto w-full max-w-md">
        <DrawerHeader>
          <DrawerTitle>{seat && `给 ${seat.number} 号添加备注`}</DrawerTitle>
        </DrawerHeader>
        <div className="flex flex-col gap-6 px-5 pt-4 pb-[max(2rem,env(safe-area-inset-bottom))]">
          <CardGrid>
            {roles.map((role) => (
              <CardSlot
                key={role}
                role={role}
                onSelect={() => onPick(role)}
                selectLabel={`标记为${ROLES[role].name}`}
                corner={role === note ? <PickedMark /> : undefined}
              />
            ))}
          </CardGrid>
          {note && (
            <Button variant="outline" size="xl" onClick={() => onPick(null)}>
              清除备注
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

import { ChevronRight, X } from 'lucide-react'
import { useEffect, useRef, useState, useTransition, type FormEvent } from 'react'
import { toast } from 'sonner'
import { useBoards, type Board } from '@/api/boards'
import { createRoom, ensureSession, goToRoom, loadName, saveName, storageKey } from '@/api/session'
import { NameField } from '@/components/common/NameField'
import { DeckTray, NightOrder } from '@/components/game/Deck'
import { RoleAvatar } from '@/components/game/RoleAvatar'
import { Page, PageContent } from '@/components/layout/Page'
import { Button } from '@/components/ui/button'
import { Drawer, DrawerClose, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
import { MAX_PLAYERS, MIN_PLAYERS } from '@/game/lobby'
import { nightPlan } from '@/game/night'
import { cn } from '@/lib/utils'
import { useT } from '@/i18n'

const SEAT_COUNTS = Array.from({ length: MAX_PLAYERS - MIN_PLAYERS + 1 }, (_, index) => MIN_PLAYERS + index)
const HEADING = 'text-[13px] font-semibold text-muted-foreground'

/**
 * 首页：「官方精选」的板子。先选几个人玩，下面列出这个人数的板子，点一个看配了哪些牌，直接开房。
 * 自己配牌、输房间号加入在标签栏中间的「+」里。
 */
export function HomeScreen() {
  const t = useT()
  const { boards, failed } = useBoards()
  const [seats, setSeats] = useStoredSeats()
  // 抽屉关上时还留着是哪个板子，收起的动画里内容不会突然变空
  const [picked, setPicked] = useState<Board | null>(null)
  const [open, setOpen] = useState(false)
  const shown = boards?.filter((board) => board.seats === seats) ?? []
  return (
    <Page>
      <PageContent className="gap-7 pt-8">
        <header className="flex flex-col items-center gap-2.5">
          <img src="/icon.svg" alt="" className="size-12" />
          {/* 英文名长（One Night Ultimate Werewolf），用小一号排成两行 */}
          <h1
            className={cn(
              'text-center leading-tight font-semibold tracking-wide text-balance',
              t.app.name.length > 10 ? 'text-2xl' : 'text-[28px]',
            )}
          >
            {t.app.name}
          </h1>
        </header>

        <section className="flex flex-col gap-3">
          <h2 className={HEADING}>{t.boards.featured}</h2>
          <SeatsPicker value={seats} onChange={setSeats} />
          {failed && <p className="py-10 text-center text-sm text-muted-foreground">{t.boards.failed}</p>}
          {!boards && !failed && <BoardListSkeleton />}
          <ul className="flex flex-col gap-2.5">
            {shown.map((board) => (
              <li key={board.id}>
                <BoardRow
                  board={board}
                  onOpen={() => {
                    setPicked(board)
                    setOpen(true)
                  }}
                />
              </li>
            ))}
          </ul>
        </section>
      </PageContent>

      <Drawer open={open} onOpenChange={setOpen} showSwipeHandle>
        <DrawerContent className="mx-auto w-full max-w-md">{picked && <BoardDetail board={picked} />}</DrawerContent>
      </Drawer>
    </Page>
  )
}

/** 上次选的人数，下次打开首页还是它。 */
function useStoredSeats() {
  const key = storageKey('homeSeats')
  const [seats, setSeats] = useState(() => {
    const saved = Number(localStorage.getItem(key))
    return SEAT_COUNTS.includes(saved) ? saved : 5
  })
  const choose = (next: number) => {
    localStorage.setItem(key, String(next))
    setSeats(next)
  }
  return [seats, choose] as const
}

/** 几个人玩：「3 人」到「10 人」一排胶囊，和房间顶上「替谁操作」一个样子，放不下就横着滑。选中的滚到中间。 */
function SeatsPicker({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  const t = useT()
  const row = useRef<HTMLDivElement>(null)
  const first = useRef(true)
  useEffect(() => {
    const chip = row.current?.querySelector<HTMLElement>('[aria-pressed="true"]')
    if (!row.current || !chip) return
    const left = chip.offsetLeft - (row.current.clientWidth - chip.offsetWidth) / 2
    // 刚打开时直接停在上次选的人数上，之后点了再滑过去
    row.current.scrollTo({ left, behavior: first.current ? 'instant' : 'smooth' })
    first.current = false
  }, [value])
  return (
    <div
      ref={row}
      role="group"
      aria-label={t.boards.howMany}
      className="-mx-5 flex gap-2 overflow-x-auto px-5 py-0.5 [scrollbar-width:none]"
    >
      {SEAT_COUNTS.map((count) => (
        <button
          key={count}
          type="button"
          aria-pressed={value === count}
          onClick={() => onChange(count)}
          className={cn(
            'flex h-9 shrink-0 items-center rounded-full border px-4 text-sm whitespace-nowrap outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50',
            value === count ? 'border-primary bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted',
          )}
        >
          {t.boards.seats(count)}
        </button>
      ))}
    </div>
  )
}

/** 板子的名字后面跟一个灰色小标签：新手、经典、混乱…… */
function BoardName({ board, className }: { board: Board; className?: string }) {
  const t = useT()
  const { name, tag } = t.boards.kinds[board.kind]
  return (
    <span className={cn('flex items-center gap-2', className)}>
      {name}
      <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-normal text-muted-foreground">{tag}</span>
    </span>
  )
}

/** 一个板子：名字和标签，下面这副牌的角色叠成一排。 */
function BoardRow({ board, onOpen }: { board: Board; onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full items-center gap-3 rounded-xl border px-3.5 py-3 text-left outline-none transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <span className="flex min-w-0 flex-1 flex-col gap-2.5">
        <BoardName board={board} className="text-[15px] font-medium" />
        <span aria-hidden className="flex pl-1.5">
          {board.deck.map((role, index) => (
            <RoleAvatar key={index} role={role} className="-ml-1.5 size-7 ring-2 ring-background" />
          ))}
        </span>
      </span>
      <ChevronRight aria-hidden className="size-4 shrink-0 text-muted-foreground" />
    </button>
  )
}

/** 每张骨架卡片上名字占位的宽度，长短错开一点，像真的板子名。 */
const SKELETON_NAMES = ['w-16', 'w-14', 'w-24', 'w-20']

/** 板子还没拉到时的骨架：几张卡片，形状、高度和真的一样，拉到之后不跳。 */
function BoardListSkeleton() {
  const t = useT()
  return (
    <div role="status" className="flex flex-col gap-3">
      <span className="sr-only">{t.app.loading}</span>
      {/* 占位块里放一个空格，高度就是那一行字的行高 */}
      <div aria-hidden className="animate-pulse">
        <ul className="flex flex-col gap-2.5">
          {SKELETON_NAMES.map((width) => (
            <li key={width} className="flex items-center gap-3 rounded-xl border px-3.5 py-3">
              <span className="flex flex-1 flex-col gap-2.5">
                <span className="flex items-center gap-2 text-[15px]">
                  <span className={cn('inline-block rounded-md bg-muted', width)}>&nbsp;</span>
                  <span className="inline-block w-9 rounded-full bg-muted py-0.5 text-[11px]">&nbsp;</span>
                </span>
                <span className="flex pl-1.5">
                  {Array.from({ length: 8 }, (_, index) => (
                    <span key={index} className="-ml-1.5 size-7 rounded-full bg-muted ring-2 ring-background" />
                  ))}
                </span>
              </span>
              <span className="size-4 shrink-0" />
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

/** 点开一个板子：配了哪些牌、夜里的醒来顺序，最下面填名字开房。 */
function BoardDetail({ board }: { board: Board }) {
  const t = useT()
  const [name, setName] = useState(loadName)
  const [creating, startCreating] = useTransition()
  const trimmed = name.trim()
  const plan = nightPlan(board.deck)

  const create = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    startCreating(async () => {
      try {
        saveName(trimmed)
        goToRoom(await createRoom(await ensureSession(), trimmed, board.id))
      } catch {
        toast.error(t.home.createFailed)
      }
    })
  }

  return (
    <>
      <DrawerHeader className="flex-row items-center justify-between py-1 pr-2 pl-5">
        <DrawerTitle className="text-[17px] font-semibold">
          <BoardName board={board} />
        </DrawerTitle>
        <DrawerClose render={<Button variant="ghost" size="icon-xl" aria-label={t.common.close} />}>
          <X className="size-5" />
        </DrawerClose>
      </DrawerHeader>

      <section className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-5 pt-1 pb-6">
        <p className="text-xs text-muted-foreground">{t.boards.meta(board.seats, board.deck.length, board.speech_rounds)}</p>
        <div className="flex flex-col gap-3.5">
          <h3 className={HEADING}>{t.settings.overviewRoles}</h3>
          <DeckTray deck={board.deck} size={board.deck.length} />
        </div>
        {plan.length > 0 && (
          <div className="flex flex-col gap-3">
            <h3 className={HEADING}>{t.settings.overviewNightOrder}</h3>
            <NightOrder roles={plan} />
          </div>
        )}
      </section>

      <form
        onSubmit={create}
        className="flex shrink-0 flex-col gap-3 border-t bg-muted/50 px-5 pt-4 pb-[max(1.75rem,env(safe-area-inset-bottom))]"
      >
        <NameField value={name} onChange={setName} />
        <Button type="submit" size="xl" disabled={!trimmed || creating}>
          {creating ? t.home.creating : t.boards.open}
        </Button>
      </form>
    </>
  )
}

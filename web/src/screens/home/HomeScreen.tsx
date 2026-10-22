import { X } from 'lucide-react'
import { useEffect, useRef, useState, useTransition, type FormEvent } from 'react'
import { toast } from 'sonner'
import { useBoards, type Board } from '@/api/boards'
import type { RoleId, Team } from '@/api/types'
import { createRoom, ensureSession, goToRoom, loadName, saveName, storageKey } from '@/api/session'
import { NameField } from '@/components/common/NameField'
import { DeckTray, NightOrder } from '@/components/game/Deck'
import { Page, PageContent } from '@/components/layout/Page'
import { Button } from '@/components/ui/button'
import { Drawer, DrawerClose, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
import { MAX_PLAYERS, MIN_PLAYERS } from '@/game/lobby'
import { nightPlan } from '@/game/night'
import { roleArt } from '@/roles/art'
import { ROLES } from '@/roles/catalog'
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

/** 角色按阵营分组：狼人阵营在前，然后好人、皮匠。 */
const TOKEN_TEAMS: readonly Team[] = ['werewolf', 'village', 'tanner']

/**
 * 一个板子：左上是名字，下面一排六边形的角色头像，按阵营分开、同一个角色只放一个，有几张就在头上标个数字。
 * 右边是招牌角色的卡图；整张卡片用这张卡图糊开铺底，每个板子有自己的颜色，卡图淡进去也自然。
 */
function BoardRow({ board, onOpen }: { board: Board; onOpen: () => void }) {
  const t = useT()
  const art = roleArt(board.signature)
  return (
    <button
      type="button"
      onClick={onOpen}
      // 没有卡图的角色就是一张灰底卡片
      className="relative flex w-full overflow-hidden rounded-2xl bg-muted text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      {art && (
        <>
          {/* 底：卡图放大、糊开，铺满整张卡片，每个板子就有了自己的颜色 */}
          <img
            src={art}
            alt=""
            aria-hidden
            draggable={false}
            className="pointer-events-none absolute inset-0 size-full scale-150 object-cover blur-2xl saturate-150"
          />
          {/* 右边：清楚的卡图，往左、往下淡进糊开的底里。卡图是整张牌，四周有一圈浅色的牌边：
              从左边往右放大一点，把右边的牌边推出卡片外面裁掉 */}
          <img
            src={art}
            alt=""
            aria-hidden
            draggable={false}
            className="pointer-events-none absolute top-0 right-0 h-full max-h-32 w-[46%] origin-left scale-110 object-cover object-[50%_40%] [mask-composite:intersect] [mask-image:linear-gradient(to_left,black_45%,transparent),linear-gradient(to_top,transparent,black_25%)]"
          />
        </>
      )}
      {/* 左边盖一层页面底色，越往右越淡：文字那边浅浅的一层颜色，卡图那边原样 */}
      <span className="pointer-events-none absolute inset-0 bg-linear-to-r from-background/85 via-background/65 to-background/0" />
      <span className="relative flex min-w-0 flex-1 flex-col gap-4 px-4 pt-4 pb-3.5">
        <span className="text-[17px] font-semibold">{t.boards.kinds[board.kind]}</span>
        <RoleTokens deck={board.deck} />
      </span>
    </button>
  )
}

/** 这副牌的角色：按阵营分组，组和组之间空开一点；同一个角色有几张，头上的小圆里写几。 */
function RoleTokens({ deck }: { deck: readonly RoleId[] }) {
  const counts = new Map<RoleId, number>()
  for (const role of deck) counts.set(role, (counts.get(role) ?? 0) + 1)
  const groups = TOKEN_TEAMS.map((team) =>
    (Object.keys(ROLES) as RoleId[]).filter((role) => ROLES[role].team === team && counts.has(role)),
  ).filter((roles) => roles.length > 0)
  // 排成一行，放不下就折行；每组第一个前面多空一点，看得出是两拨人
  return (
    <span aria-hidden className="flex max-w-[88%] flex-wrap gap-x-0.5 gap-y-3 pt-1.5">
      {groups.flatMap((roles, group) =>
        roles.map((role, index) => (
          <HexAvatar
            key={role}
            role={role}
            count={counts.get(role) ?? 1}
            className={group > 0 && index === 0 ? 'ml-2.5' : undefined}
          />
        )),
      )}
    </span>
  )
}

/** 六边形的角色头像：外面一圈细边，里面是卡图裁到脸。张数大于 1 时头顶一个小圆写张数。 */
function HexAvatar({ role, count, className }: { role: RoleId; count: number; className?: string }) {
  const art = roleArt(role)
  const Icon = ROLES[role].icon
  return (
    <span className={cn('relative', className)}>
      <span className="hexagon flex h-8 w-7 items-center justify-center bg-border p-px">
        <span className="hexagon flex size-full items-center justify-center overflow-hidden bg-muted">
          {art ? (
            <img src={art} alt="" draggable={false} className="size-full scale-[1.3] object-cover object-[50%_42%]" />
          ) : (
            <Icon className="size-3.5" strokeWidth={1.5} />
          )}
        </span>
      </span>
      {count > 1 && (
        <span className="absolute -top-2 left-1/2 flex size-4 -translate-x-1/2 items-center justify-center rounded-full border bg-background font-mono text-[10px] leading-none font-medium">
          {count}
        </span>
      )}
    </span>
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
      <div aria-hidden>
        <ul className="flex flex-col gap-2.5">
          {SKELETON_NAMES.map((width) => (
            <li key={width} className="flex rounded-2xl bg-muted">
              {/* 卡片本身不闪，只有里面的占位块一明一暗 */}
              <span className="flex flex-1 animate-pulse flex-col gap-4 px-4 pt-4 pb-3.5">
                <span className="text-[17px] font-semibold">
                  <span className={cn('inline-block rounded-md bg-background', width)}>&nbsp;</span>
                </span>
                <span className="flex gap-x-0.5 pt-1.5">
                  {Array.from({ length: 7 }, (_, index) => (
                    <span key={index} className={cn('hexagon h-8 w-7 bg-background', index === 2 && 'ml-2.5')} />
                  ))}
                </span>
              </span>
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
          {t.boards.kinds[board.kind]}
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

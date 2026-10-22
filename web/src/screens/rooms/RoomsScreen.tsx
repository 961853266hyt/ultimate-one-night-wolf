import { ChevronRight, PawPrint, Undo2 } from 'lucide-react'
import { goToRoom } from '@/api/session'
import { useLastRoom, useOpenRooms, type OpenRoom, type RoomSummary } from '@/api/rooms'
import { PawLoader } from '@/components/common/PawLoader'
import { RoleAvatar } from '@/components/game/RoleAvatar'
import { Page, PageContent } from '@/components/layout/Page'
import { TabHeader } from '@/components/layout/TabHeader'
import { navigate } from '@/lib/navigation'
import { useT } from '@/i18n'

/** 「房间」页：现在能加入的房间，点一个就进去。 */
export function RoomsScreen() {
  const { rooms: open, failed } = useOpenRooms()
  const last = useLastRoom()
  // 刚才在的房间单独放在最上面，列表里就不重复了
  const rooms = open && open.filter((room) => room.code !== last?.code)
  const t = useT()
  return (
    <Page>
      <TabHeader title={t.tabs.rooms} />
      <PageContent className="gap-3 pt-2">
        {last && <BackToRoom room={last} />}
        {failed && <p className="text-center text-xs text-muted-foreground">{t.rooms.failed}</p>}
        {/* 和整屏加载一样走一串爪印，文字只给读屏软件；放在没有房间时那只爪印的位置 */}
        {rooms === null && !failed && (
          <div role="status" className="flex flex-1 items-center justify-center py-16 text-muted-foreground">
            <PawLoader />
            <span className="sr-only">{t.app.loading}</span>
          </div>
        )}
        {/* 一个能进的房间都没有，也没有刚才在的房间。开房在标签栏中间的「+」里，这里不再多放按钮 */}
        {rooms?.length === 0 && !last && (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 py-16 text-center text-muted-foreground">
            <PawPrint aria-hidden className="size-8 opacity-40" strokeWidth={1.5} />
            <p className="text-[15px]">{t.rooms.empty}</p>
          </div>
        )}
        {rooms && rooms.length > 0 && (
          <ul className="flex flex-col gap-2.5">
            {rooms.map((room) => (
              <li key={room.code}>
                <RoomRow room={room} />
              </li>
            ))}
          </ul>
        )}
      </PageContent>
    </Page>
  )
}

/** 「回到房间 ABCD」：切到别的标签页之前所在的房间，游戏中也能回去，座位还留着。 */
function BackToRoom({ room }: { room: RoomSummary }) {
  const t = useT()
  const status = room.phase === 'lobby' ? t.rooms.lobby : room.phase === 'reveal' ? t.rooms.reveal : t.rooms.playing
  return (
    <button
      type="button"
      onClick={() => navigate(`/r/${room.code}`)}
      className="flex w-full items-center gap-3 rounded-xl bg-foreground px-3.5 py-3 text-left text-background outline-none transition-opacity hover:opacity-90 focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <Undo2 aria-hidden className="size-5 shrink-0" />
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-[15px] font-medium">{t.rooms.back(room.code)}</span>
        <span className="text-xs opacity-70">
          {t.rooms.playersOnly(room.players)} · {status}
        </span>
      </span>
      <ChevronRight aria-hidden className="size-4 shrink-0 opacity-70" />
    </button>
  )
}

/** 头像最多叠几个，多出来的显示「+N」。 */
const MAX_FACES = 4

/** 一个房间：这局的牌叠成一排头像，谁的房间、来了几个人，点了就进去。 */
function RoomRow({ room }: { room: OpenRoom }) {
  const t = useT()
  const faces = room.deck.slice(0, MAX_FACES)
  const extra = room.deck.length - faces.length
  return (
    <button
      type="button"
      onClick={() => goToRoom(room.code)}
      className="flex w-full items-center gap-3 rounded-xl border px-3.5 py-3 text-left outline-none transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <span aria-hidden className="flex shrink-0 pl-1.5">
        {faces.map((role, index) => (
          <RoleAvatar key={index} role={role} className="-ml-1.5 size-8 ring-2 ring-background" />
        ))}
        {extra > 0 && (
          <span className="-ml-1.5 flex size-8 items-center justify-center rounded-full bg-muted text-[11px] text-muted-foreground ring-2 ring-background">
            +{extra}
          </span>
        )}
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate text-[15px] font-medium">{t.rooms.title(room.host)}</span>
        <span className="text-xs text-muted-foreground">
          {t.rooms.players(room.players, room.seats)} · {room.board && `${t.boards.kinds[room.board]} · `}
          {room.phase === 'reveal' ? t.rooms.reveal : t.rooms.lobby}
          <span className="ml-1.5 font-mono tracking-wider">{room.code}</span>
        </span>
      </span>
      <ChevronRight aria-hidden className="size-4 shrink-0 text-muted-foreground" />
    </button>
  )
}

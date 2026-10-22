/**
 * 底部标签栏：首页、角色、（中间的圆按钮）、房间、设置。所有页面都有，房间里也在。
 * 一条圆角的液态玻璃悬浮在屏幕底部，离两边和底边留点空，页面内容从它后面滑过去。
 * 中间是一个比两边高出一截的黑色圆按钮，顶出玻璃条的上沿：在房间外是「+」，点开填昵称，创建房间或者输房间号加入；在房间里是离开房间。
 * 切到别的标签页时房间还在后台连着，所以中间照样是离开房间，「房间」点了直接回去。
 */
import { BookOpen, DoorOpen, House, LogOut, Plus, Settings, X, type LucideIcon } from 'lucide-react'
import { forwardRef, useState, useTransition, type ComponentProps, type FormEvent } from 'react'
import { toast } from 'sonner'
import { createRoom, ensureSession, goToRoom, isRoomCode, loadName, saveName } from '@/api/session'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { NameField } from '@/components/common/NameField'
import { Button } from '@/components/ui/button'
import { Drawer, DrawerClose, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
import { Input } from '@/components/ui/input'
import { navigate, usePath } from '@/lib/navigation'
import { useActiveRoom, type ActiveRoom } from '@/lib/activeRoom'
import { cn } from '@/lib/utils'
import { useT } from '@/i18n'

export type Tab = 'home' | 'roles' | 'rooms' | 'settings'

export const TAB_PATHS: Record<Tab, string> = { home: '/', roles: '/roles', rooms: '/rooms', settings: '/settings' }

const TAB_ICON: Record<Tab, LucideIcon> = { home: House, roles: BookOpen, rooms: DoorOpen, settings: Settings }

/** 网址对应哪个标签：在某个房间里（/r/ABCD）算「房间」，认不出的都算首页。 */
export function tabOf(path: string): Tab {
  if (/^\/r\//.test(path)) return 'rooms'
  const clean = path.replace(/\/+$/, '') || '/'
  return (Object.keys(TAB_PATHS) as Tab[]).find((tab) => TAB_PATHS[tab] === clean) ?? 'home'
}

export function TabBar() {
  const path = usePath()
  const current = tabOf(path)
  const room = useActiveRoom()
  const t = useT()
  // 在房间里（哪怕藏在后台）点「房间」就回到这个房间；人在别处、房间里轮到你了，亮个红点
  const target = (tab: Tab) => (tab === 'rooms' && room ? `/r/${room.code}` : TAB_PATHS[tab])
  const dot = (tab: Tab) => tab === 'rooms' && !!room?.attention && !/^\/r\//.test(path)
  const item = (tab: Tab) => {
    const Icon = TAB_ICON[tab]
    const active = tab === current
    return (
      <li>
        <button
          type="button"
          aria-current={active ? 'page' : undefined}
          onClick={() => navigate(target(tab))}
          // 选中的那一格垫一块浅色的圆角底，像玻璃上又叠了一小片
          className={cn(
            'flex h-13 w-full flex-col items-center justify-center gap-0.5 rounded-full text-[11px] font-medium outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50',
            active ? 'bg-foreground/7 text-foreground' : 'text-muted-foreground hover:text-foreground',
          )}
        >
          <span className="relative">
            <Icon aria-hidden className="size-5" strokeWidth={active ? 2.2 : 1.8} />
            {dot(tab) && (
              <span className="absolute -top-0.5 -right-1 size-2 rounded-full bg-destructive ring-2 ring-background">
                <span className="sr-only">{t.tabs.yourTurn}</span>
              </span>
            )}
          </span>
          {t.tabs[tab]}
        </button>
      </li>
    )
  }
  return (
    <nav
      aria-label={t.tabs.label}
      // 夜里的叫醒过场（z-40）、抽屉和弹窗（z-50）会盖住它。玻璃条外面留的空隙点得穿，不挡后面的页面
      className="pointer-events-none fixed inset-x-0 bottom-0 z-30 mx-auto w-full max-w-md px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
    >
      <ul className="glass pointer-events-auto grid h-16 grid-cols-5 items-center rounded-full px-1.5">
        {item('home')}
        {item('roles')}
        <li className="flex justify-center">
          <CenterButton />
        </li>
        {item('rooms')}
        {item('settings')}
      </ul>
    </nav>
  )
}

function CenterButton() {
  const room = useActiveRoom()
  return room ? <LeaveRoomButton room={room} /> : <JoinButton />
}

/** 中间的圆形按钮本身：比两边大一号，往上顶出玻璃条一截。 */
const RoundButton = forwardRef<HTMLButtonElement, ComponentProps<'button'>>(function RoundButton(
  { className, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type="button"
      className={cn(
        'flex size-14 -translate-y-4 items-center justify-center rounded-full bg-foreground text-background shadow-lg outline-none transition-transform active:scale-95 focus-visible:ring-3 focus-visible:ring-ring/50',
        className,
      )}
      {...props}
    />
  )
})

/** 房间里：离开房间。按钮显眼，容易误点，所以总是先确认；这局没打完时提醒座位会留着。 */
function LeaveRoomButton({ room }: { room: ActiveRoom }) {
  const t = useT()
  return (
    <ConfirmDialog
      trigger={
        <RoundButton aria-label={t.room.leaveRoom}>
          <LogOut aria-hidden className="size-6" strokeWidth={2.2} />
        </RoundButton>
      }
      title={room.inGame ? t.room.leaveTitle : t.room.leaveTitleIdle}
      description={room.inGame ? t.room.leaveDescription : undefined}
      confirmLabel={t.room.leave}
      cancelLabel={t.room.stay}
      onConfirm={room.leave}
    />
  )
}

/** 房间外：「+」，点开从底部弹出创建或加入房间，大概占半个屏幕。 */
function JoinButton() {
  const [open, setOpen] = useState(false)
  const t = useT()
  return (
    <>
      <RoundButton aria-label={t.tabs.play} onClick={() => setOpen(true)}>
        <Plus aria-hidden className="size-6" strokeWidth={2.4} />
      </RoundButton>
      <Drawer open={open} onOpenChange={setOpen} showSwipeHandle>
        <DrawerContent className="mx-auto min-h-[50dvh] w-full max-w-md">
          {/* 关上之后里面会卸载，下次打开房间号是空的 */}
          <PlayForm />
        </DrawerContent>
      </Drawer>
    </>
  )
}

/**
 * 创建或加入房间：最上面填昵称（先填好上次用的），下面是「创建房间」，再往下输房间号加入。
 * 昵称两边共用，进了房间就不用再问。
 */
function PlayForm() {
  const [name, setName] = useState(loadName)
  const [code, setCode] = useState('')
  const [creating, startCreating] = useTransition()
  const t = useT()
  const trimmed = name.trim()

  const create = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    startCreating(async () => {
      try {
        saveName(trimmed)
        goToRoom(await createRoom(await ensureSession(), trimmed))
      } catch {
        toast.error(t.home.createFailed)
      }
    })
  }
  const join = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    saveName(trimmed)
    goToRoom(code)
  }

  return (
    <>
      <DrawerHeader className="flex-row items-center justify-between py-1 pr-2 pl-5">
        <DrawerTitle className="text-[17px] font-semibold">{t.tabs.play}</DrawerTitle>
        <DrawerClose render={<Button variant="ghost" size="icon-xl" aria-label={t.common.close} />}>
          <X className="size-5" />
        </DrawerClose>
      </DrawerHeader>
      <div className="flex flex-1 flex-col gap-3 px-5 pt-2 pb-[max(1.75rem,env(safe-area-inset-bottom))]">
        <form onSubmit={create} className="flex flex-col gap-3">
          <NameField value={name} onChange={setName} />
          <Button type="submit" size="xl" disabled={!trimmed || creating}>
            {creating ? t.home.creating : t.home.create}
          </Button>
        </form>

        <div className="my-2 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="h-px flex-1 bg-border" />
          {t.home.or}
          <span className="h-px flex-1 bg-border" />
        </div>

        <form onSubmit={join} className="flex gap-2.5">
          <Input
            aria-label={t.home.roomCode}
            placeholder={t.home.roomCode}
            value={code}
            onChange={(event) => setCode(event.target.value.replace(/[^a-z]/gi, '').toUpperCase())}
            maxLength={4}
            autoComplete="off"
            autoCapitalize="characters"
            className="h-12 flex-1 px-3.5 font-mono text-lg tracking-[0.3em] placeholder:font-sans placeholder:text-base placeholder:tracking-normal"
          />
          <Button type="submit" variant="outline" size="xl" className="w-22" disabled={!trimmed || !isRoomCode(code)}>
            {t.home.join}
          </Button>
        </form>
      </div>
    </>
  )
}

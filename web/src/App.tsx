import { useState } from 'react'
import { loadName, roomCodeFromPath, saveName } from '@/api/session'
import { useSession } from '@/api/useSession'
import { RoleDetailsProvider } from '@/components/game/RoleDetails'
import { FullScreenLoading } from '@/components/layout/FullScreenLoading'
import { FullScreenMessage } from '@/components/layout/FullScreenMessage'
import { TabBar, tabOf, type Tab } from '@/components/layout/TabBar'
import { Toaster } from '@/components/ui/sonner'
import { HomeScreen } from '@/screens/home/HomeScreen'
import { NamePromptScreen } from '@/screens/home/NamePromptScreen'
import { RolesScreen } from '@/screens/roles/RolesScreen'
import { RoomScreen } from '@/screens/room/RoomScreen'
import { RoomsScreen } from '@/screens/rooms/RoomsScreen'
import { SettingsScreen } from '@/screens/settings/SettingsScreen'
import { usePath } from '@/lib/navigation'
import { useT } from '@/i18n'

export default function App() {
  return (
    <RoleDetailsProvider>
      <Screens />
      <TabBar />
      <Toaster position="top-center" />
    </RoleDetailsProvider>
  )
}

/**
 * 按网址选页面：首页、角色、房间、设置这几个标签页，或者 /r/ABCD 这个房间。
 *
 * 进过的房间切到别的标签页时不卸载，只是藏起来：连接不断，座位、备注、选到一半的目标都还在。
 * 真正离开房间（标签栏中间的按钮）会整页跳回首页，这时它才没了。
 */
function Screens() {
  const { session, failed } = useSession()
  const [name, setName] = useState(loadName)
  const path = usePath()
  const code = roomCodeFromPath()
  // 最近进的房间。打开另一个房间的链接，就换成那个
  const [roomCode, setRoomCode] = useState(code)
  if (code && code !== roomCode) setRoomCode(code)
  const t = useT()

  if (failed) return <FullScreenMessage>{t.app.cannotConnect}</FullScreenMessage>
  if (!session) return <FullScreenLoading label={t.app.loading} />
  const inRoom = code !== null
  return (
    <>
      {roomCode && name && (
        <div hidden={!inRoom}>
          <RoomScreen key={roomCode} code={roomCode} session={session} name={name} visible={inRoom} />
        </div>
      )}
      {inRoom && !name && (
        <NamePromptScreen
          code={code}
          onSubmit={(next) => {
            saveName(next)
            setName(next)
          }}
        />
      )}
      {!inRoom && <TabScreen tab={tabOf(path)} />}
    </>
  )
}

function TabScreen({ tab }: { tab: Tab }) {
  if (tab === 'roles') return <RolesScreen />
  if (tab === 'rooms') return <RoomsScreen />
  if (tab === 'settings') return <SettingsScreen />
  return <HomeScreen />
}

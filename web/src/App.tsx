import { useState } from 'react'
import { loadName, roomCodeFromPath, saveName } from '@/api/session'
import { useSession } from '@/api/useSession'
import { RoleDetailsProvider } from '@/components/game/RoleDetails'
import { FullScreenMessage } from '@/components/layout/FullScreenMessage'
import { Toaster } from '@/components/ui/sonner'
import { HomeScreen } from '@/screens/home/HomeScreen'
import { NamePromptScreen } from '@/screens/home/NamePromptScreen'
import { RoomScreen } from '@/screens/room/RoomScreen'

export default function App() {
  return (
    <RoleDetailsProvider>
      <Screens />
      <Toaster position="top-center" />
    </RoleDetailsProvider>
  )
}

/** 按网址选页面：首页，或者 /r/ABCD 这个房间。 */
function Screens() {
  const { session, failed } = useSession()
  const [name, setName] = useState(loadName)
  const code = roomCodeFromPath()

  if (failed) return <FullScreenMessage>连不上服务器，请稍后刷新重试</FullScreenMessage>
  if (!session) return <FullScreenMessage>加载中…</FullScreenMessage>
  if (!code) return <HomeScreen session={session} />
  if (!name) {
    return (
      <NamePromptScreen
        code={code}
        onSubmit={(next) => {
          saveName(next)
          setName(next)
        }}
      />
    )
  }
  return <RoomScreen code={code} session={session} name={name} />
}

import { useState } from 'react'
import { loadName, roomCodeFromPath, saveName } from '@/api/session'
import { useSession } from '@/api/useSession'
import { RoleDetailsProvider } from '@/components/game/RoleDetails'
import { FullScreenLoading } from '@/components/layout/FullScreenLoading'
import { FullScreenMessage } from '@/components/layout/FullScreenMessage'
import { Toaster } from '@/components/ui/sonner'
import { HomeScreen } from '@/screens/home/HomeScreen'
import { NamePromptScreen } from '@/screens/home/NamePromptScreen'
import { RoomScreen } from '@/screens/room/RoomScreen'
import { useT } from '@/i18n'

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
  const t = useT()

  if (failed) return <FullScreenMessage>{t.app.cannotConnect}</FullScreenMessage>
  if (!session) return <FullScreenLoading label={t.app.loading} />
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

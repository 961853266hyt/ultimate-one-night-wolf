import { useEffect, useState } from 'react'
import { ensureSession, loadName, roomCodeFromPath, saveName, type Session } from './api/session'
import { Centered } from './components/ui'
import { Home, NamePrompt } from './screens/Home'
import { RoomScreen } from './screens/RoomScreen'

export default function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [failed, setFailed] = useState(false)
  const [name, setName] = useState(loadName)
  const code = roomCodeFromPath()

  useEffect(() => {
    ensureSession().then(setSession, () => setFailed(true))
  }, [])

  if (failed) return <Centered>连不上服务器，请稍后刷新重试</Centered>
  if (!session) return <Centered>加载中…</Centered>
  if (!code) return <Home session={session} />
  if (!name) {
    return (
      <NamePrompt
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

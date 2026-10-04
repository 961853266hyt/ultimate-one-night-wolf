import { useEffect, useState } from 'react'
import { ensureSession, type Session } from './session'

/** 打开页面时拿到访客身份。拿不到（服务器连不上）时 failed 为 true。 */
export function useSession() {
  const [session, setSession] = useState<Session | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    ensureSession().then(setSession, () => setFailed(true))
  }, [])

  return { session, failed }
}

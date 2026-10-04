import { useEffect, useState } from 'react'

/** 距离 endsAt（服务端的毫秒时间戳）还剩几秒。clockOffset 用来抵消本机时钟的误差。 */
export function useCountdown(endsAt: number | null, clockOffset: number): number | null {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (endsAt === null) return
    const timer = window.setInterval(() => setNow(Date.now()), 250)
    return () => window.clearInterval(timer)
  }, [endsAt])

  if (endsAt === null) return null
  return Math.max(0, Math.ceil((endsAt - now - clockOffset) / 1000))
}

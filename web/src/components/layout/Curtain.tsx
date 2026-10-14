import { useEffect, useState, type ReactNode } from 'react'

/** 过场停留多久，单位毫秒。夜里每一步默认 20 秒，最短 5 秒，过场不能占太多。 */
const CURTAIN_MS = 1400

/**
 * 盖住整屏的过场：淡入、停一会儿、淡出，然后自己消失。点一下提前收起。
 * 夜里每个角色醒来、天亮时用。所有人看到的一样，不会暴露谁在行动。
 */
export function Curtain({ children }: { children: ReactNode }) {
  const [shown, setShown] = useState(true)
  useEffect(() => {
    const timer = setTimeout(() => setShown(false), CURTAIN_MS)
    return () => clearTimeout(timer)
  }, [])
  if (!shown) return null

  return (
    <div
      role="status"
      onClick={() => setShown(false)}
      className="fixed inset-0 z-40 flex items-center justify-center bg-background p-6 text-center text-foreground animate-curtain motion-reduce:animate-none"
      style={{ animationDuration: `${CURTAIN_MS}ms` }}
    >
      <div className="flex flex-col items-center gap-5 animate-curtain-rise motion-reduce:animate-none">
        {children}
      </div>
    </div>
  )
}

import type { ReactNode } from 'react'

interface Props {
  children: ReactNode
  /** 消息下面的按钮，比如「回首页」。 */
  action?: ReactNode
}

/** 占满一屏、居中的一句话：加载中、连不上、房间解散了…… */
export function FullScreenMessage({ children, action }: Props) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-5 p-6 text-center">
      <p className="text-sm text-muted-foreground">{children}</p>
      {action}
    </div>
  )
}

import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface Props {
  children: ReactNode
  className?: string
}

/**
 * 手机竖屏的一页。桌面上居中，宽度和手机差不多。
 *
 * 里面依次放：顶栏（可选）、PageContent、PageFooter。
 */
export function Page({ children, className }: Props) {
  return (
    <div className={cn('mx-auto flex min-h-dvh w-full max-w-md flex-col bg-background', className)}>
      {children}
    </div>
  )
}

/** 页面主体，内容太多时整页滚动。 */
export function PageContent({ children, className }: Props) {
  return (
    <main className={cn('flex flex-1 flex-col gap-8 px-5 pt-6 pb-8', className)}>{children}</main>
  )
}

/** 贴在屏幕底部的操作区，放主按钮。会避开全面屏手机底部的横条。 */
export function PageFooter({ children, className }: Props) {
  return (
    <footer
      className={cn(
        'sticky bottom-0 z-10 flex flex-col gap-2.5 bg-background/95 px-5 pt-3 pb-[max(1.75rem,env(safe-area-inset-bottom))] backdrop-blur',
        className,
      )}
    >
      {children}
    </footer>
  )
}

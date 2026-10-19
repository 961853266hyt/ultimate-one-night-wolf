import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface Props {
  children: ReactNode
  className?: string
}

/**
 * 手机竖屏的一页。桌面上居中，宽度和手机差不多。
 *
 * 里面依次放：顶栏（可选）、PageContent、PageFooter。底下给固定在屏幕底部的标签栏让出位置。
 */
export function Page({ children, className }: Props) {
  return (
    <div className={cn('mx-auto flex min-h-dvh w-full max-w-md flex-col bg-background pb-[calc(var(--tab-bar-height)+1rem)]', className)}>
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

/** 贴在屏幕底部的操作区，放主按钮。停在标签栏上面，全面屏底部的横条由标签栏让开。 */
export function PageFooter({ children, className }: Props) {
  return (
    <footer
      className={cn(
        // 底下多留的 1.5rem 给标签栏中间高出来的圆按钮
        'sticky bottom-(--tab-bar-height) z-10 flex flex-col gap-2.5 bg-background/95 px-5 pt-3 pb-6 backdrop-blur',
        className,
      )}
    >
      {children}
    </footer>
  )
}

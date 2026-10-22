import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface SectionProps {
  title: string
  /** 标题行最右边的小控件，比如座位的身份开关。标题照样居中。 */
  action?: ReactNode
  children: ReactNode
  className?: string
}

/** 页面里的一块内容：居中的小标题，下面是内容。 */
export function Section({ title, action, children, className }: SectionProps) {
  return (
    <section className={cn('flex flex-col items-center gap-4', className)}>
      <header className="relative flex w-full flex-col items-center text-center">
        <h2 className="text-base font-semibold">{title}</h2>
        {/* 控件比标题高一点，往上提 4px，和标题那一行居中对齐 */}
        {action && <div className="absolute -top-1 right-0">{action}</div>}
      </header>
      {children}
    </section>
  )
}

interface PageTitleProps {
  title: string
  description?: ReactNode
}

/** 一页最显眼的那句话，比如「预言家请睁眼」「你觉得谁是狼？」。 */
export function PageTitle({ title, description }: PageTitleProps) {
  return (
    <header className="flex flex-col items-center gap-1.5 text-center">
      <h1 className="text-[26px] leading-tight font-semibold">{title}</h1>
      {description && <p className="text-sm text-muted-foreground">{description}</p>}
    </header>
  )
}

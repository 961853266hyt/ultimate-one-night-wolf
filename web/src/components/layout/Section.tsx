import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface SectionProps {
  title: string
  /** 标题下面的一行小字，比如进度「3/6 已投票」。 */
  caption?: ReactNode
  children: ReactNode
  className?: string
}

/** 页面里的一块内容：居中的小标题，下面是内容。 */
export function Section({ title, caption, children, className }: SectionProps) {
  return (
    <section className={cn('flex flex-col items-center gap-4', className)}>
      <header className="flex flex-col items-center gap-0.5 text-center">
        <h2 className="text-base font-semibold">{title}</h2>
        {caption && <p className="text-xs text-muted-foreground">{caption}</p>}
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

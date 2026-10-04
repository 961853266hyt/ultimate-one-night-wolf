import { cva, type VariantProps } from 'class-variance-authority'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { CornerMark, type Mark } from './CornerMark'

const avatarVariants = cva(
  'relative flex size-13 shrink-0 items-center justify-center rounded-full border text-[17px] font-medium select-none',
  {
    variants: {
      tone: {
        default: 'border-border bg-muted text-foreground',
        me: 'border-foreground bg-muted text-foreground',
        muted: 'border-border bg-muted/40 text-muted-foreground',
        empty: 'border-dashed border-muted-foreground/40 text-muted-foreground',
      },
      selected: {
        true: 'ring-2 ring-foreground ring-offset-2 ring-offset-background',
      },
    },
    defaultVariants: { tone: 'default' },
  },
)

interface PlayerAvatarProps extends VariantProps<typeof avatarVariants> {
  /** 显示名字的第一个字。 */
  name?: string
  /** 不显示名字时放别的东西，比如空座位的加号。 */
  children?: ReactNode
  mark?: Mark
}

/** 圆形头像，显示名字的第一个字。纯装饰，读屏软件会跳过，名字由旁边的文字提供。 */
export function PlayerAvatar({ name = '', children, tone, selected, mark }: PlayerAvatarProps) {
  return (
    <span aria-hidden className={cn(avatarVariants({ tone, selected }))}>
      {children ?? firstCharacter(name)}
      {mark && <CornerMark mark={mark} />}
    </span>
  )
}

function firstCharacter(name: string): string {
  // Array.from 按字符而不是按 UTF-16 码元切，名字以 emoji 开头也不会切坏
  return Array.from(name.trim())[0]?.toUpperCase() ?? '?'
}

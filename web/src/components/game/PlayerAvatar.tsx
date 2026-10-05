import type { ReactNode } from 'react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import { CornerMark, type Mark } from './CornerMark'

type Tone = 'default' | 'me' | 'muted' | 'empty'

// 边框画在 Avatar 的 ::after 上，所以边框颜色用 after: 来改
const TONE: Record<Tone, { root: string; fallback: string }> = {
  default: { root: '', fallback: 'text-foreground' },
  me: { root: 'after:border-foreground', fallback: 'text-foreground' },
  muted: { root: '', fallback: 'bg-muted/40' },
  empty: { root: 'after:border-dashed after:border-muted-foreground/40', fallback: 'bg-transparent' },
}

interface PlayerAvatarProps {
  /** 显示名字的第一个字。 */
  name?: string
  /** 不显示名字时放别的东西，比如空座位的加号。 */
  children?: ReactNode
  tone?: Tone
  selected?: boolean
  mark?: Mark
}

/** 圆形头像，显示名字的第一个字。纯装饰，读屏软件会跳过，名字由旁边的文字提供。 */
export function PlayerAvatar({
  name = '',
  children,
  tone = 'default',
  selected = false,
  mark,
}: PlayerAvatarProps) {
  return (
    <Avatar
      aria-hidden
      className={cn(
        'size-13',
        TONE[tone].root,
        selected && 'ring-2 ring-foreground ring-offset-2 ring-offset-background',
      )}
    >
      <AvatarFallback className={cn('text-[17px] font-medium', TONE[tone].fallback)}>
        {children ?? firstCharacter(name)}
      </AvatarFallback>
      {mark && <CornerMark mark={mark} />}
    </Avatar>
  )
}

function firstCharacter(name: string): string {
  // Array.from 按字符而不是按 UTF-16 码元切，名字以 emoji 开头也不会切坏
  return Array.from(name.trim())[0]?.toUpperCase() ?? '?'
}

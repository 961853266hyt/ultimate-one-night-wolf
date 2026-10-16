import type { ReactNode } from 'react'
import type { RoleId } from '@/api/types'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import { CornerMark, type Mark } from './CornerMark'
import { RoleFace } from './RoleAvatar'

type Tone = 'default' | 'me' | 'muted' | 'empty'

// 边框画在 Avatar 的 ::after 上，所以边框颜色用 after: 来改
const TONE: Record<Tone, { root: string; fallback: string }> = {
  default: { root: '', fallback: 'text-foreground' },
  me: { root: 'after:border-foreground', fallback: 'text-foreground' },
  muted: { root: '', fallback: 'bg-muted/40' },
  empty: { root: 'after:border-dashed after:border-muted-foreground/40', fallback: 'bg-transparent' },
}

interface PlayerAvatarProps {
  /** 座位号。 */
  number?: number
  /** 这个人的身份：自己标的猜测，或者自己发到的牌。有就显示角色头像，盖住座位号。 */
  note?: RoleId
  /** 不显示座位号时放别的东西，比如空座位的加号、没标身份时的问号。 */
  children?: ReactNode
  tone?: Tone
  selected?: boolean
  /** 角上的记号，可以同时挂几个，各在各的角上。 */
  mark?: Mark | readonly Mark[]
}

/** 圆形头像，显示座位号或者自己做的角色标记。纯装饰，读屏软件会跳过，名字由旁边的文字提供。 */
export function PlayerAvatar({
  number,
  note,
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
      {note ? (
        // 卡图放大过，只裁图，不裁角上的记号
        <span className={cn('flex size-full overflow-hidden rounded-full', tone === 'muted' && 'opacity-55 grayscale')}>
          <RoleFace role={note} />
        </span>
      ) : (
        <AvatarFallback className={cn('font-mono text-[19px] font-medium', TONE[tone].fallback)}>
          {children ?? number}
        </AvatarFallback>
      )}
      {[mark ?? []].flat().map((one) => (
        <CornerMark key={one} mark={one} />
      ))}
    </Avatar>
  )
}

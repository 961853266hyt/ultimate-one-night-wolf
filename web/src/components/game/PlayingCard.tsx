import { Moon } from 'lucide-react'
import type { ReactNode } from 'react'
import type { RoleId } from '@/api/types'
import { cn } from '@/lib/utils'
import { CornerMark } from './CornerMark'
import { RoleThumbnail } from './RoleArtCard'
import { RoleButton } from './RoleDetails'

interface CardBackProps {
  /** 决定牌的大小和圆角。 */
  className?: string
  iconClassName?: string
  /** 月亮下面的小字。 */
  children?: ReactNode
}

/** 牌背：黑底、细边框、一弯月亮。 */
export function CardBack({ className, iconClassName, children }: CardBackProps) {
  return (
    <span
      className={cn(
        'relative flex flex-col items-center justify-center gap-3 rounded-lg bg-foreground text-background',
        className,
      )}
    >
      <span aria-hidden className="absolute inset-1.5 rounded-[inherit] border border-background/20" />
      <Moon aria-hidden className={cn('size-5', iconClassName)} strokeWidth={1.5} />
      {children}
    </span>
  )
}

/** 三张底牌排成一行。里面放 CenterCard。 */
export function CenterCardRow({ children }: { children: ReactNode }) {
  return <ul className="grid w-full grid-cols-3 gap-3">{children}</ul>
}

interface CenterCardProps {
  /** A、B、C。 */
  letter: string
  /** 翻开时传牌面；不传就是扣着的。 */
  role?: RoleId
  /** 牌下面的补充说明，比如「原来是失眠者」。 */
  note?: ReactNode
  selected?: boolean
  /** 传了就能点。 */
  onSelect?: () => void
}

/** 一张底牌，下面写着「A 号」。 */
export function CenterCard({ letter, role, note, selected = false, onSelect }: CenterCardProps) {
  // 能选的牌本身就是按钮，里面的角色名就不能再点了
  const card = role ? (
    <CardFace role={role} interactive={!onSelect} />
  ) : (
    <CardBack className="h-21 w-15" />
  )

  return (
    <li className="flex flex-col items-center gap-2">
      {onSelect ? (
        <button
          type="button"
          onClick={onSelect}
          aria-pressed={selected}
          aria-label={`${letter} 号底牌`}
          className={cn(
            'relative rounded-lg transition-transform outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
            selected && '-translate-y-1 ring-2 ring-foreground ring-offset-3 ring-offset-background',
          )}
        >
          {card}
          {selected && <CornerMark mark="check" />}
        </button>
      ) : (
        card
      )}
      <span className={cn('text-sm', selected ? 'font-medium' : 'text-muted-foreground')}>
        {letter} 号
      </span>
      {note && <span className="-mt-1 text-[11px] text-muted-foreground">{note}</span>}
    </li>
  )
}

/** 翻开的底牌：卡图缩略图，点一下看角色详情。 */
function CardFace({ role, interactive }: { role: RoleId; interactive: boolean }) {
  const thumbnail = <RoleThumbnail role={role} />
  if (!interactive) return thumbnail
  return (
    <RoleButton role={role} className="rounded-[6px]">
      {thumbnail}
    </RoleButton>
  )
}

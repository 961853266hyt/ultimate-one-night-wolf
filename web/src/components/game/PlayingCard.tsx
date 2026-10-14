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
  /** 图标下面的小字。 */
  children?: ReactNode
}

/** 牌背：黑底，中间是网站图标。夜里的深色主题下换成深灰，不然会变成一张白牌。 */
export function CardBack({ className, iconClassName, children }: CardBackProps) {
  return (
    <span
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-lg bg-foreground text-background dark:bg-muted dark:text-foreground',
        className,
      )}
    >
      <img src="/icon.svg" alt="" className={cn('size-10', iconClassName)} />
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
  /** 之前夜里翻开看过，现在扣着：牌角画一只眼睛。 */
  seen?: boolean
  /** 传了就能点。 */
  onSelect?: () => void
}

/** 一张底牌，下面写着「A 号」。 */
export function CenterCard({ letter, role, note, selected = false, seen = false, onSelect }: CenterCardProps) {
  // 能选的牌本身就是按钮，里面的角色名就不能再点了
  const card = role ? (
    <CardFace role={role} interactive={!onSelect} />
  ) : (
    // 和翻开后的缩略图一样大，翻开时牌和下面的字不会跳
    <CardBack className="aspect-[200/274] w-18 rounded-[6px]" />
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
          {seen && <CornerMark mark="seen" />}
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

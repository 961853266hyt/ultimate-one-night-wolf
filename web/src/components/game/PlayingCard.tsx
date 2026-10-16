import type { ReactNode } from 'react'
import type { RoleId } from '@/api/types'
import { cn } from '@/lib/utils'
import { CornerMark } from './CornerMark'
import { RoleThumbnail } from './RoleArtCard'
import { RoleButton } from './RoleDetails'
import { useT } from '@/i18n'

interface CardBackProps {
  /** 决定牌的大小和圆角。 */
  className?: string
  iconClassName?: string
  /** 夜里的绿光：表示这张牌还盖着。翻开的时候关掉。 */
  glow?: boolean
  /** 图标下面的小字。 */
  children?: ReactNode
}

/**
 * 牌背：和图标一样的黑底，中间是网站图标。
 * 夜里背景也是黑的，牌后面垫一层绿光（见 index.css 的 card-glow）才看得出是张牌。
 * 外层只管大小、圆角和阴影，牌面在里层，盖住绿光的中间部分。
 */
export function CardBack({ className, iconClassName, glow = true, children }: CardBackProps) {
  return (
    <span className={cn('@container relative isolate flex rounded-lg', className)}>
      {glow && <span aria-hidden className="card-glow absolute -z-10 hidden rounded-[inherit] dark:block" />}
      <span
        className={cn(
          'flex size-full flex-col items-center justify-center gap-3 rounded-[inherit] bg-card-back text-card-back-foreground',
          glow && 'dark:card-glow-base',
        )}
      >
        <img src="/icon.svg" alt="" className={cn('size-10', iconClassName)} />
        {children}
      </span>
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
  const t = useT()
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
          aria-label={t.night.centerCard(letter)}
          className={cn(
            'relative rounded-lg transition-transform outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
            // 选中只往上抬一截，不加边框和对勾
            selected && '-translate-y-1',
          )}
        >
          {card}
          {seen && <CornerMark mark="seen" />}
        </button>
      ) : (
        card
      )}
      <span className={cn('text-sm', selected ? 'font-medium' : 'text-muted-foreground')}>
        {t.night.centerShort(letter)}
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

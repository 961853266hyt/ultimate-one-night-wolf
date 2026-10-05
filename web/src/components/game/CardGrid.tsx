/** 一排五张的牌：大厅里这局的牌，配牌时的牌库和本局，都用这几个组件摆。 */
import { Plus } from 'lucide-react'
import type { ReactNode } from 'react'
import type { RoleId } from '@/api/types'
import { cn } from '@/lib/utils'
import { ROLES } from '@/roles/catalog'
import { RoleAvatar } from './RoleAvatar'
import { RoleButton } from './RoleDetails'

/** 牌的网格，一行五张。里面放 CardSlot 和 EmptyCardSlot。 */
export function CardGrid({ children }: { children: ReactNode }) {
  return <ul className="grid w-full grid-cols-5 gap-x-2 gap-y-3.5">{children}</ul>
}

const FACE = 'flex flex-col items-center gap-1.5'
const TAPPABLE = cn(
  FACE,
  'rounded-lg outline-none transition-opacity hover:opacity-80 focus-visible:ring-3 focus-visible:ring-ring/50',
)
const LABEL = 'text-xs leading-4 whitespace-nowrap'

interface CardSlotProps {
  role: RoleId
  /** 传了，点了做这件事；不传，点了看角色详情。 */
  onSelect?: () => void
  /** 配合 onSelect，告诉读屏软件点了会怎样，比如「把狼人放进本局」。 */
  selectLabel?: string
  /** 叠在头像右上角的东西，比如「放回牌库」的小按钮。 */
  corner?: ReactNode
}

/** 一张牌：圆形卡图头像，下面写角色名。 */
export function CardSlot({ role, onSelect, selectLabel, corner }: CardSlotProps) {
  const face = (
    <>
      <RoleAvatar role={role} className="size-12" />
      <span className={LABEL}>{ROLES[role].name}</span>
    </>
  )
  return (
    <li className="relative flex min-w-0 justify-center">
      {onSelect ? (
        <button type="button" onClick={onSelect} aria-label={selectLabel} className={TAPPABLE}>
          {face}
        </button>
      ) : (
        <RoleButton role={role} className={TAPPABLE}>
          {face}
        </RoleButton>
      )}
      {corner}
    </li>
  )
}

interface EmptyCardSlotProps {
  /** 圆圈下面的字。 */
  children: ReactNode
  /** 传了就能点，圆圈里画个加号，比如房主点了去补牌。 */
  onSelect?: () => void
  /** 缺了这张就没法开局时，用提醒色。 */
  warning?: boolean
}

/** 空着的位置：一个虚线圆圈。 */
export function EmptyCardSlot({ children, onSelect, warning = false }: EmptyCardSlotProps) {
  const face = (
    <>
      <span
        className={cn(
          'flex size-12 items-center justify-center rounded-full border border-dashed',
          warning ? 'border-warning/60 bg-warning/5 text-warning' : 'border-muted-foreground/35',
        )}
      >
        {onSelect && <Plus aria-hidden className="size-4.5" strokeWidth={1.8} />}
      </span>
      <span className={cn(LABEL, warning ? 'text-warning' : 'text-muted-foreground/70')}>
        {children}
      </span>
    </>
  )
  return (
    <li className="flex min-w-0 justify-center">
      {onSelect ? (
        <button type="button" onClick={onSelect} className={TAPPABLE}>
          {face}
        </button>
      ) : (
        <span className={FACE}>{face}</span>
      )}
    </li>
  )
}

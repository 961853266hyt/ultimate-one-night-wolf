import type { RoleId } from '@/api/types'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import { roleArt } from '@/roles/art'
import { ROLES } from '@/roles/catalog'

/**
 * 圆形的角色头像：有卡图就用卡图，没有卡图或者图加载失败就用线条图标。大小由 className 决定。
 * 纯装饰，角色名由旁边的文字提供。
 */
export function RoleAvatar({ role, className }: { role: RoleId; className?: string }) {
  const art = roleArt(role)
  const Icon = ROLES[role].icon
  return (
    <Avatar aria-hidden className={cn('overflow-hidden', className)}>
      {art && (
        // 卡图是整张竖版卡面，顶上印着英文名：裁成正方形，避开标题，稍微放大到脸
        <AvatarImage
          src={art}
          alt=""
          draggable={false}
          className="scale-[1.15] object-[50%_45%]"
        />
      )}
      {/* 有卡图时，等一下还没加载出来才显示图标，免得翻牌时先闪一下图标 */}
      <AvatarFallback delay={art ? 300 : undefined} className="text-foreground">
        <Icon className="size-[42%]" strokeWidth={1.5} />
      </AvatarFallback>
    </Avatar>
  )
}

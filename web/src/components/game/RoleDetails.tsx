/**
 * 角色详情：点任何地方的角色名，弹出一张卡，上面是卡牌原图、角色名和角色描述。
 *
 * 整个应用只有一个弹窗，挂在 RoleDetailsProvider 里；想让什么东西能点开详情，用 RoleButton 包起来就行。
 */
import { X } from 'lucide-react'
import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'
import type { RoleId } from '@/api/types'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { roleArt } from '@/roles/art'
import { ROLES } from '@/roles/catalog'

// 默认什么也不做：不在 Provider 里时，角色名照常显示，只是点了没反应
const ShowRoleContext = createContext<(role: RoleId) => void>(() => {})

/** 打开某个角色详情的函数。 */
export function useShowRole() {
  return useContext(ShowRoleContext)
}

export function RoleDetailsProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<RoleId | null>(null)
  const [open, setOpen] = useState(false)
  // 引用保持不变：开关弹窗时，页面上那些角色按钮不用跟着重新渲染
  const show = useCallback((next: RoleId) => {
    setRole(next)
    setOpen(true)
  }, [])

  return (
    <ShowRoleContext value={show}>
      {children}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          showCloseButton={false}
          overlayClassName="bg-black/60"
          className="max-h-[calc(100dvh-2rem)] w-auto max-w-none justify-items-center gap-6 overflow-y-auto bg-transparent p-0 ring-0 sm:max-w-none"
        >
          {/* 关闭时保留上一个角色，免得淡出动画里卡片突然变空 */}
          {role && <RoleSheet role={role} />}
          <DialogClose
            render={
              <Button
                variant="ghost"
                size="icon-xl"
                aria-label="关闭"
                className="rounded-full bg-white/15 text-white hover:bg-white/25 hover:text-white"
              />
            }
          >
            <X className="size-5" />
          </DialogClose>
        </DialogContent>
      </Dialog>
    </ShowRoleContext>
  )
}

interface RoleButtonProps {
  role: RoleId
  className?: string
  children: ReactNode
}

/** 点了打开这个角色的详情。样式全由 className 决定，不传就像普通文字。 */
export function RoleButton({ role, className, children }: RoleButtonProps) {
  const show = useShowRole()
  return (
    <button
      type="button"
      aria-haspopup="dialog"
      onClick={() => show(role)}
      className={cn('rounded-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50', className)}
    >
      {children}
    </button>
  )
}

/** 弹窗里的那张卡。 */
function RoleSheet({ role }: { role: RoleId }) {
  const { name, ability } = ROLES[role]
  return (
    <div className="flex w-70 flex-col items-center gap-3.5 rounded-[20px] bg-background px-4 pt-4 pb-5.5 text-center shadow-2xl">
      <CardArt role={role} />
      <div className="flex flex-col gap-1.5 px-1">
        <DialogTitle className="text-[22px] leading-tight font-semibold tracking-wide">
          {name}
        </DialogTitle>
        <DialogDescription className="text-sm leading-relaxed text-muted-foreground">
          {ability}
        </DialogDescription>
      </div>
    </div>
  )
}

/** 完整的卡牌原图，不裁切；本地没有卡图时，显示同样大小的图标占位。 */
function CardArt({ role }: { role: RoleId }) {
  const art = roleArt(role)
  const { name, icon: Icon } = ROLES[role]
  if (art) {
    // width / height 只用来告诉浏览器宽高比，加载前就把位置占好
    return (
      <img
        src={art}
        alt={`${name}的卡牌`}
        width={200}
        height={274}
        draggable={false}
        className="h-auto w-full rounded-xl"
      />
    )
  }
  return (
    <div className="flex aspect-[200/274] w-full items-center justify-center rounded-xl bg-muted text-muted-foreground">
      <Icon aria-hidden className="size-16" strokeWidth={1.25} />
    </div>
  )
}

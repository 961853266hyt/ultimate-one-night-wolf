/**
 * 角色详情：点任何地方的角色名，弹出这个角色的牌。先看到完整的卡图，点一下牌，
 * 卡面上盖一层毛玻璃，显示角色说明；再点一下收起。
 *
 * 整个应用只有一个弹窗，挂在 RoleDetailsProvider 里；想让什么东西能点开详情，用 RoleButton 包起来就行。
 */
import { X } from 'lucide-react'
import { createContext, useCallback, useContext, useId, useState, type ReactNode } from 'react'
import type { RoleId } from '@/api/types'
import { Button } from '@/components/ui/button'
import { Dialog, DialogClose, DialogContent } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { RoleArtCard } from './RoleArtCard'

// 默认什么也不做：不在 Provider 里时，角色名照常显示，只是点了没反应
const ShowRoleContext = createContext<(role: RoleId) => void>(() => {})

/** 打开某个角色详情的函数。 */
export function useShowRole() {
  return useContext(ShowRoleContext)
}

export function RoleDetailsProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<RoleId | null>(null)
  const [open, setOpen] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const titleId = useId()
  const descriptionId = useId()
  // 引用保持不变：开关弹窗时，页面上那些角色按钮不用跟着重新渲染
  const show = useCallback((next: RoleId) => {
    setRole(next)
    setExpanded(false) // 每次打开都先看卡图
    setOpen(true)
  }, [])

  return (
    <ShowRoleContext value={show}>
      {children}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          showCloseButton={false}
          aria-labelledby={titleId}
          aria-describedby={descriptionId}
          overlayClassName="bg-black/70"
          className="max-h-[calc(100dvh-2rem)] w-auto max-w-none justify-items-center gap-7 overflow-y-auto bg-transparent p-0 ring-0 sm:max-w-none"
        >
          {/* 关闭时保留上一个角色，免得淡出动画里牌突然变空 */}
          {role && (
            <RoleArtCard
              role={role}
              expanded={expanded}
              onToggle={() => setExpanded(!expanded)}
              titleId={titleId}
              descriptionId={descriptionId}
            />
          )}
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

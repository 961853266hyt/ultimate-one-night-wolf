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
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { roleArt } from '@/roles/art'
import { ROLES, TEAMS } from '@/roles/catalog'

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
          overlayClassName="bg-black/70"
          className="max-h-[calc(100dvh-2rem)] w-auto max-w-none justify-items-center gap-7 overflow-y-auto bg-transparent p-0 ring-0 sm:max-w-none"
        >
          {/* 关闭时保留上一个角色，免得淡出动画里牌突然变空 */}
          {role && (
            <RoleCardView
              role={role}
              expanded={expanded}
              onToggle={() => setExpanded(!expanded)}
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

interface RoleCardViewProps {
  role: RoleId
  /** 说明是不是展开着，盖在卡图上。 */
  expanded: boolean
  onToggle: () => void
}

/** 弹窗里的那张牌，和官方卡图一样是竖版。 */
function RoleCardView({ role, expanded, onToggle }: RoleCardViewProps) {
  const detailsId = useId()
  const art = roleArt(role)
  const { name, team, icon: Icon, ability, notes } = ROLES[role]
  const { name: teamName, textClass } = TEAMS[team]

  return (
    // isolate：Safari 才会用圆角裁掉里面放大、模糊过的图
    <div className="relative isolate aspect-[200/274] w-74 overflow-hidden rounded-[24px] shadow-2xl">
      {art ? (
        // 卡图四个角外面是白底或透明，狼人那张右下角还有一道浅色边：放大 5%、往右下挪 1px，
        // 再用 24px 的圆角裁，四个角就只剩卡面。这组数是对着现有的卡图逐像素算出来的
        <img
          src={art}
          alt={`${name}的卡牌`}
          draggable={false}
          className="size-full translate-x-px translate-y-px scale-[1.05] object-cover"
        />
      ) : (
        <div className="flex size-full flex-col items-center justify-center gap-3 bg-muted text-muted-foreground">
          <Icon aria-hidden className="size-16" strokeWidth={1.25} />
          <span className="text-lg font-semibold text-foreground">{name}</span>
        </div>
      )}

      {/* 毛玻璃盖满整张牌。套一层 dark：文字和阵营色都取深色主题的值，在深色玻璃上才看得清 */}
      <div
        id={detailsId}
        className={cn(
          'dark absolute inset-0 flex flex-col bg-background p-6 text-foreground transition-[opacity,visibility] duration-300 motion-reduce:transition-none',
          expanded ? 'visible opacity-100' : 'invisible opacity-0',
        )}
      >
        {/* 玻璃是同一张卡图放大、模糊、压暗做的，不用 backdrop-filter：它在 Safari 上不跟着牌的圆角裁，
            边上还会混进牌外面的颜色，圆角就和正面不一样了 */}
        {art && (
          <img
            src={art}
            alt=""
            draggable={false}
            className="absolute inset-0 size-full scale-150 object-cover blur-2xl saturate-150"
          />
        )}
        <div className="absolute inset-0 bg-black/55" />
        <div className="relative my-auto flex flex-col gap-3">
          <div className="flex items-baseline justify-between gap-3">
            <DialogTitle className="text-2xl leading-8 font-semibold tracking-wide">
              {name}
            </DialogTitle>
            {/* 皮匠自成一队，队名就是角色名，不重复写 */}
            {teamName !== name && (
              <span className={cn('shrink-0 text-xs', textClass)}>{teamName}</span>
            )}
          </div>
          <DialogDescription className="text-[15px] leading-relaxed text-foreground">
            {ability}
          </DialogDescription>
          {notes && (
            <ul className="flex flex-col gap-1.5 border-t border-white/15 pt-3 text-[13px] leading-relaxed text-muted-foreground">
              {notes.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* 透明按钮盖住整张牌：点卡图展开说明，再点收起 */}
      <button
        type="button"
        onClick={onToggle}
        aria-label="角色说明"
        aria-expanded={expanded}
        aria-controls={detailsId}
        className="absolute inset-0 rounded-[inherit] outline-none focus-visible:ring-3 focus-visible:ring-white/60 focus-visible:ring-inset"
      />
    </div>
  )
}

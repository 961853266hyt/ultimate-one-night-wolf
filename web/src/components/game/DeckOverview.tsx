/** 不是房主时点开「本局设置」：只能看，不能改。 */
import { X } from 'lucide-react'
import type { RoleId } from '@/api/types'
import { Button } from '@/components/ui/button'
import { Drawer, DrawerClose, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
import { nightPlan } from '@/game/night'
import { DeckTray, NightOrder } from './Deck'

interface DeckOverviewProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  deck: readonly RoleId[]
  need: number
  nightStep: number
}

export function DeckOverview({ open, onOpenChange, deck, need, nightStep }: DeckOverviewProps) {
  const plan = nightPlan(deck)
  return (
    <Drawer open={open} onOpenChange={onOpenChange} showSwipeHandle>
      <DrawerContent className="mx-auto w-full max-w-md">
        <DrawerHeader className="flex-row items-center justify-between py-1 pr-2 pl-5">
          <DrawerTitle className="text-[17px] font-semibold">本局设置</DrawerTitle>
          <DrawerClose render={<Button variant="ghost" size="icon-xl" aria-label="关闭" />}>
            <X className="size-5" />
          </DrawerClose>
        </DrawerHeader>

        <div className="flex flex-col gap-6 overflow-y-auto px-5 pt-2 pb-[max(1.75rem,env(safe-area-inset-bottom))]">
          <section className="flex flex-col gap-3.5">
            <h3 className="text-[13px] font-semibold text-muted-foreground">角色 · 点头像看介绍</h3>
            <DeckTray deck={deck} size={need} />
          </section>
          {plan.length > 0 && (
            <section className="flex flex-col gap-3">
              <h3 className="text-[13px] font-semibold text-muted-foreground">夜里的醒来顺序</h3>
              <NightOrder roles={plan} />
            </section>
          )}
          <p className="text-sm text-muted-foreground">夜间操作时间 {nightStep} 秒，房主可以调整</p>
        </div>
      </DrawerContent>
    </Drawer>
  )
}

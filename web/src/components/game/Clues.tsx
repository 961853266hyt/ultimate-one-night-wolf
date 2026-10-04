/** 「我的线索」：夜里得知的信息。白天直接摊开，夜里收进抽屉。 */
import { NotebookText } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer'
import type { Clue } from '@/game/knowledge'
import { ROLES } from '@/game/roles'
import { cn } from '@/lib/utils'
import { PhraseText } from './RoleText'

export function ClueList({ clues }: { clues: readonly Clue[] }) {
  return (
    <ul className="flex flex-col gap-2.5">
      {/* 线索只会往后加，用下标当 key 没问题 */}
      {clues.map((clue, index) => (
        <li key={index} className="flex items-start gap-2 text-sm leading-relaxed">
          <span className="mt-0.5 shrink-0 rounded-sm bg-muted px-1.5 text-xs leading-5">
            {ROLES[clue.step].name}
          </span>
          <span>
            <PhraseText phrase={clue.text} />
          </span>
        </li>
      ))}
    </ul>
  )
}

/** 带标题的线索框。 */
export function ClueCard({ clues }: { clues: readonly Clue[] }) {
  return (
    <section className="flex flex-col gap-2.5 rounded-xl border px-3.5 py-3">
      <h2 className="text-xs text-muted-foreground">我的线索</h2>
      <ClueList clues={clues} />
    </section>
  )
}

interface CluesDrawerProps {
  clues: readonly Clue[]
  /** 这一步刚得知了新线索：数字变成黑底，提醒点开看。 */
  fresh: boolean
}

/** 夜里用：底部一条按钮显示线索条数，点开从下面滑出。 */
export function CluesDrawer({ clues, fresh }: CluesDrawerProps) {
  return (
    <Drawer showSwipeHandle>
      <DrawerTrigger
        className={cn(buttonVariants({ variant: 'outline', size: 'xl' }), 'justify-between font-normal')}
      >
        <span className="flex items-center gap-2">
          <NotebookText aria-hidden className="text-muted-foreground" />
          我的线索
        </span>
        <span
          className={cn(
            'rounded-full px-2 font-mono text-xs leading-5',
            fresh ? 'bg-foreground text-background' : 'bg-muted text-muted-foreground',
          )}
        >
          {clues.length}
        </span>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>我的线索</DrawerTitle>
        </DrawerHeader>
        <div className="px-5 pt-4 pb-[max(2rem,env(safe-area-inset-bottom))]">
          {clues.length ? (
            <ClueList clues={clues} />
          ) : (
            <p className="text-center text-sm text-muted-foreground">夜里得知的信息会记在这里</p>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  )
}

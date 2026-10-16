/**
 * 房主替机器人操作：顶栏下面一排身份，点谁就以谁的身份看牌、行动、投票。
 * 只有房主、而且房间里有机器人时才出现。服务端只认房主替机器人操作，界面上也只给房主看。
 */
import { Bot, User } from 'lucide-react'
import type { ReactNode } from 'react'
import type { MemberView } from '@/api/types'
import { memberName } from '@/game/seats'
import { cn } from '@/lib/utils'
import { useT } from '@/i18n'

interface ActAsBarProps {
  /** 自己的玩家 id：服务端视图里的 me 可能是机器人，这里是真正的自己。 */
  self: string
  /** 现在以谁的身份看：自己，或者某个机器人。 */
  current: string
  members: readonly MemberView[]
  /** 换身份；null 是换回自己。 */
  onSwitch: (player: string | null) => void
}

export function ActAsBar({ self, current, members, onSwitch }: ActAsBarProps) {
  const t = useT()
  const bots = members.filter((member) => member.bot)
  if (!bots.length) return null
  const acting = bots.find((bot) => bot.id === current)

  return (
    <div className="sticky top-15 z-20 flex flex-col gap-1.5 bg-background/95 px-5 pb-2 backdrop-blur">
      <div role="group" aria-label={t.room.actAs} className="-mx-1 flex gap-1.5 overflow-x-auto px-1 py-0.5">
        <Chip active={current === self} onClick={() => onSwitch(null)}>
          <User aria-hidden className="size-3.5" />
          {t.room.me}
        </Chip>
        {bots.map((bot) => (
          <Chip key={bot.id} active={bot.id === current} onClick={() => onSwitch(bot.id)}>
            <Bot aria-hidden className="size-3.5" />
            {memberName(bot)}
          </Chip>
        ))}
      </div>
      {acting && <p className="text-xs text-warning">{t.room.actingAs(memberName(acting))}</p>}
    </div>
  )
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        'flex h-8 shrink-0 items-center gap-1 rounded-full border px-3 text-[13px] whitespace-nowrap outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50',
        active ? 'border-primary bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted',
      )}
    >
      {children}
    </button>
  )
}

import { Layers } from 'lucide-react'
import type { NightLogLine } from '@/game/result'
import { ROLES } from '@/roles/catalog'
import { RoleAvatar } from './RoleAvatar'
import { RoleButton } from './RoleDetails'
import { PhraseText } from './RoleText'
import { useT } from '@/i18n'

/**
 * 揭晓时回放这一局：第一行是发牌，每个人发到的牌；后面是夜里的每一次行动，角色头像打头，
 * 一句话说做了什么，超时代选的句尾挂个灰标签。
 */
export function NightLog({ lines }: { lines: readonly NightLogLine[] }) {
  const t = useT()
  return (
    <ol className="w-full divide-y rounded-xl border">
      {lines.map((line, index) => (
        <li key={index} className="flex items-start gap-3 px-3.5 py-3 text-sm leading-relaxed">
          {line.step ? (
            <RoleAvatar role={line.step} className="size-7 shrink-0" />
          ) : (
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <Layers aria-hidden className="size-3.5" />
            </span>
          )}
          <span className="min-w-0 pt-0.5">
            {line.step ? (
              <RoleButton role={line.step} className="mr-1.5 font-semibold transition-opacity hover:opacity-70">
                {ROLES[line.step].name}
              </RoleButton>
            ) : (
              <span className="mr-1.5 font-semibold">{t.reveal.dealtLabel}</span>
            )}
            <PhraseText phrase={line.text} />
            {line.auto && (
              <span className="ml-1.5 inline-block rounded-full bg-muted px-2 align-[1px] text-[11px] leading-5 text-muted-foreground">
                {t.reveal.autoPicked}
              </span>
            )}
          </span>
        </li>
      ))}
    </ol>
  )
}

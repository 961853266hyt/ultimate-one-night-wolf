import { ROLES } from '@/game/roles'
import type { NightLogLine } from '@/game/result'
import { PhraseText } from './RoleText'

/** 揭晓时回放夜里的每一次行动。 */
export function NightLog({ lines }: { lines: readonly NightLogLine[] }) {
  return (
    <ol className="w-full divide-y rounded-xl border">
      {lines.map((line, index) => (
        <li key={index} className="flex items-start gap-3 px-3.5 py-3 text-sm leading-relaxed">
          <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-muted font-mono text-[11px]">
            {index + 1}
          </span>
          <span className="min-w-0">
            <span className="mr-1.5 font-semibold">{ROLES[line.step].name}</span>
            <PhraseText phrase={line.text} />
            {line.auto && <span className="text-muted-foreground">（超时，系统代选）</span>}
          </span>
        </li>
      ))}
    </ol>
  )
}

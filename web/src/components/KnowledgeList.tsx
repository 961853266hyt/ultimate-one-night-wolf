import type { Knowledge, PlayerView } from '../api/types'
import { describeKnowledge } from '../game/players'
import { ROLE_NAME } from '../game/text'
import { Panel } from './ui'

export function KnowledgeList({
  view,
  facts = view.me.knowledge,
  title = '你夜里得知的',
}: {
  view: PlayerView
  facts?: Knowledge[]
  title?: string
}) {
  if (facts.length === 0) return null
  return (
    <Panel title={title}>
      <ul className="space-y-2">
        {facts.map((fact, i) => (
          <li key={i} className="flex gap-2">
            <span className="shrink-0 rounded-md bg-slate-800 px-2 text-xs leading-6 text-slate-300">
              {ROLE_NAME[fact.step]}
            </span>
            <span>{describeKnowledge(view, fact)}</span>
          </li>
        ))}
      </ul>
    </Panel>
  )
}

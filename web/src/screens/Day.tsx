import { KnowledgeList } from '../components/KnowledgeList'
import { RoleCard } from '../components/RoleCard'
import { Button, Muted, Panel } from '../components/ui'
import { seated } from '../game/players'
import type { ScreenProps } from './RoomScreen'

export function Day({ view, send }: ScreenProps) {
  const ready = view.day?.ready ?? []
  const done = ready.includes(view.me.id)

  return (
    <>
      <Panel>
        <p>天亮了，开始讨论。</p>
        <p className="mt-1 text-sm text-slate-400">夜里牌可能被换过：你现在手里的，未必还是发到的那张。</p>
      </Panel>
      {view.me.card && <RoleCard role={view.me.card} compact />}
      <KnowledgeList view={view} />
      {view.me.seat !== null && (
        <Button disabled={done} onClick={() => send({ type: 'ready_to_vote' })}>
          {done ? '等其他人…' : '讨论好了，可以投票'}
        </Button>
      )}
      <Muted>
        {ready.length}/{seated(view).length} 人准备投票，全部准备好就提前开始投票
      </Muted>
    </>
  )
}

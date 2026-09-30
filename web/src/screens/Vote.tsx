import { useState } from 'react'
import { KnowledgeList } from '../components/KnowledgeList'
import { RoleCard } from '../components/RoleCard'
import { SlotGrid } from '../components/SlotGrid'
import { Button, Muted, Panel } from '../components/ui'
import { seated, slotName } from '../game/players'
import type { ScreenProps } from './RoomScreen'

export function Vote({ view, send }: ScreenProps) {
  const [target, setTarget] = useState<string | null>(null)
  const voted = view.vote?.voted ?? []
  const mine = view.vote?.mine ?? null
  const progress = (
    <Muted>
      {voted.length}/{seated(view).length} 人已投票，大家同时亮票
    </Muted>
  )

  if (view.me.seat === null) return progress
  if (mine) {
    return (
      <>
        <Panel>
          <p>你投给了 {slotName(view, mine)}。</p>
        </Panel>
        {progress}
      </>
    )
  }
  return (
    <>
      {view.me.card && <RoleCard role={view.me.card} compact />}
      <Panel>
        <p>投票：你觉得谁是狼？</p>
        <p className="mt-1 text-sm text-slate-400">得票最多（至少 2 票）的人出局，平票一起出局。</p>
      </Panel>
      <SlotGrid view={view} selected={target ? [target] : []} onTap={setTarget} />
      <Button disabled={!target} onClick={() => target && send({ type: 'vote', target })}>
        投给 {target ? slotName(view, target) : '…'}
      </Button>
      {progress}
      <KnowledgeList view={view} />
    </>
  )
}

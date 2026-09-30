import { useState } from 'react'
import { KnowledgeList } from '../components/KnowledgeList'
import { RoleCard } from '../components/RoleCard'
import { SlotGrid } from '../components/SlotGrid'
import { Button, Panel } from '../components/ui'
import { describePrompt, isComplete, toggle } from '../game/targets'
import { ROLE_NAME } from '../game/text'
import type { ScreenProps } from './RoomScreen'

export function Night({ view, send }: ScreenProps) {
  const { night, prompt } = view
  const [selected, setSelected] = useState<string[]>([])
  // 没轮到你也可以点，只是不会发给服务器：面对面玩时，别让旁边的人看出谁在行动
  const [decoy, setDecoy] = useState<string[]>([])

  if (!night) return null

  const tap = (slot: string) => {
    if (prompt) {
      setSelected((current) => toggle(prompt, current, slot))
    } else {
      setDecoy((current) => (current.includes(slot) ? [] : [slot]))
    }
  }

  const submit = () => {
    send({ type: 'night_action', targets: selected })
    setSelected([])
  }

  return (
    <>
      {view.me.card && <RoleCard role={view.me.card} compact />}
      <Panel>
        <p className="text-sm text-slate-400">
          第 {night.index}/{night.total} 步
        </p>
        <p className="mt-1 text-2xl font-semibold">{ROLE_NAME[night.step]}请睁眼</p>
        <p className="mt-2 text-sm text-slate-300">
          {prompt ? describePrompt(prompt) : '闭上眼睛。也可以随便点点下面的牌，别让旁边的人看出你在不在行动。'}
        </p>
      </Panel>
      <SlotGrid view={view} selected={prompt ? selected : decoy} onTap={tap} center />
      {prompt && (
        <Button disabled={!isComplete(prompt, selected)} onClick={submit}>
          确定
        </Button>
      )}
      <KnowledgeList view={view} />
    </>
  )
}

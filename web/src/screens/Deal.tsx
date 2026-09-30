import { RoleCard } from '../components/RoleCard'
import { Button, Muted } from '../components/ui'
import { seated } from '../game/players'
import type { ScreenProps } from './RoomScreen'

export function Deal({ view, send }: ScreenProps) {
  const confirmed = view.deal?.confirmed ?? []
  const done = confirmed.includes(view.me.id)

  if (!view.me.card) return <Muted>这一局已经开始了，等下一局吧</Muted>
  return (
    <>
      <RoleCard role={view.me.card} />
      <Button disabled={done} onClick={() => send({ type: 'confirm_card' })}>
        {done ? '等其他人看完…' : '我记住了'}
      </Button>
      <Muted>
        {confirmed.length}/{seated(view).length} 人已经看好了牌，全部看好就入夜
      </Muted>
    </>
  )
}

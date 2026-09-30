import { useEffect } from 'react'
import { goHome, type Session } from '../api/session'
import type { Command, PlayerView } from '../api/types'
import { useRoom } from '../api/useRoom'
import { Button, Centered } from '../components/ui'
import { ERROR_TEXT, PHASE_NAME } from '../game/text'
import { useCountdown } from '../game/useCountdown'
import { Day } from './Day'
import { Deal } from './Deal'
import { Lobby } from './Lobby'
import { Night } from './Night'
import { Reveal } from './Reveal'
import { Vote } from './Vote'

export interface ScreenProps {
  view: PlayerView
  send: (command: Command) => void
}

export function RoomScreen({ code, session, name }: { code: string; session: Session; name: string }) {
  const room = useRoom(code, session, name)
  const { view, error, clearError } = room

  useEffect(() => {
    if (!error) return
    const timer = window.setTimeout(clearError, 3000)
    return () => window.clearTimeout(timer)
  }, [error, clearError])

  if (room.fatal) {
    return (
      <Centered>
        <p>{ERROR_TEXT[room.fatal]}</p>
        <Button onClick={goHome}>回首页</Button>
      </Centered>
    )
  }
  if (!view) return <Centered>{room.connected ? '正在进入房间…' : '正在连接…'}</Centered>

  const leave = () => {
    const playing = view.me.seat !== null && view.phase !== 'reveal'
    if (playing && !window.confirm('这一局还没结束，确定离开吗？你的座位会保留到这局结束。')) {
      return
    }
    room.send({ type: 'leave' })
    goHome()
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col gap-4 p-4 pb-10">
      <Header view={view} connected={room.connected} clockOffset={room.clockOffset} onLeave={leave} />
      <PhaseScreen view={view} send={room.send} />
      {error && (
        <div className="fixed inset-x-4 bottom-6 mx-auto max-w-md rounded-xl bg-rose-600 px-4 py-3 text-center text-sm shadow-lg">
          {ERROR_TEXT[error]}
        </div>
      )}
    </main>
  )
}

function PhaseScreen({ view, send }: ScreenProps) {
  switch (view.phase) {
    case 'lobby':
      return <Lobby view={view} send={send} />
    case 'deal':
      return <Deal view={view} send={send} />
    case 'night':
      // 每一步换一个 key：上一步选了一半的目标不能带到下一步
      return <Night key={view.night?.index} view={view} send={send} />
    case 'day':
      return <Day view={view} send={send} />
    case 'vote':
      return <Vote view={view} send={send} />
    case 'reveal':
      return <Reveal view={view} send={send} />
  }
}

function Header({
  view,
  connected,
  clockOffset,
  onLeave,
}: {
  view: PlayerView
  connected: boolean
  clockOffset: number
  onLeave: () => void
}) {
  const seconds = useCountdown(view.ends_at, clockOffset)
  return (
    <header className="flex items-center justify-between">
      <div>
        <p className="text-xs text-slate-400">
          房间 <span className="font-mono tracking-widest text-slate-200">{view.room.code}</span>
          {!connected && <span className="ml-2 text-amber-400">重连中…</span>}
        </p>
        <p className="text-lg font-semibold">{PHASE_NAME[view.phase]}</p>
      </div>
      <div className="flex items-center gap-3">
        {seconds !== null && <span className="font-mono text-2xl tabular-nums">{seconds}</span>}
        <button className="text-sm text-slate-400" onClick={onLeave}>
          离开
        </button>
      </div>
    </header>
  )
}

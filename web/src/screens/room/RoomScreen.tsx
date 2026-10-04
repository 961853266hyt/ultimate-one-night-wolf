import { useEffect, type ComponentType } from 'react'
import { toast } from 'sonner'
import { goHome, type Session } from '@/api/session'
import type { ErrorMessage, Phase } from '@/api/types'
import { useRoom } from '@/api/useRoom'
import { FullScreenMessage } from '@/components/layout/FullScreenMessage'
import { Page } from '@/components/layout/Page'
import { Button } from '@/components/ui/button'
import { ERROR_TEXT, phaseLabel } from '@/game/text'
import { DayPhase } from './DayPhase'
import { DealPhase } from './DealPhase'
import { LobbyPhase } from './LobbyPhase'
import { NightPhase } from './NightPhase'
import { RevealPhase } from './RevealPhase'
import { RoomHeader } from './RoomHeader'
import type { PhaseProps } from './types'
import { VotePhase } from './VotePhase'

/** 每个阶段对应的页面。加新阶段时在这里登记，漏了 TypeScript 会报错。 */
const PHASES: Record<Phase, ComponentType<PhaseProps>> = {
  lobby: LobbyPhase,
  deal: DealPhase,
  night: NightPhase,
  day: DayPhase,
  vote: VotePhase,
  reveal: RevealPhase,
}

interface RoomScreenProps {
  code: string
  session: Session
  name: string
}

export function RoomScreen({ code, session, name }: RoomScreenProps) {
  const room = useRoom(code, session, name)
  useErrorToast(room.error, room.clearError)

  if (room.fatal) {
    return (
      <FullScreenMessage
        action={
          <Button size="xl" onClick={goHome}>
            回首页
          </Button>
        }
      >
        {ERROR_TEXT[room.fatal]}
      </FullScreenMessage>
    )
  }
  if (!room.view) {
    return <FullScreenMessage>{room.connected ? '正在进入房间…' : '正在连接…'}</FullScreenMessage>
  }

  const { view, send } = room
  const CurrentPhase = PHASES[view.phase]
  const leave = () => {
    send({ type: 'leave' })
    goHome()
  }

  return (
    <Page>
      <RoomHeader
        code={view.room.code}
        phase={phaseLabel(view)}
        endsAt={view.ends_at}
        clockOffset={room.clockOffset}
        connected={room.connected}
        confirmLeave={view.me.seat !== null && view.phase !== 'reveal'}
        onLeave={leave}
      />
      {/* 换阶段、夜里换一步时重新挂载，上一步没选完的目标不会带到下一步 */}
      <CurrentPhase key={`${view.phase}-${view.night?.index ?? 0}`} view={view} send={send} />
    </Page>
  )
}

/** 指令被服务端拒绝时弹一条提示，然后清掉。 */
function useErrorToast(error: ErrorMessage['code'] | null, clearError: () => void) {
  useEffect(() => {
    if (!error) return
    // 用错误码当 id：同一个错误连着来，只显示一条
    toast.error(ERROR_TEXT[error], { id: error })
    clearError()
  }, [error, clearError])
}

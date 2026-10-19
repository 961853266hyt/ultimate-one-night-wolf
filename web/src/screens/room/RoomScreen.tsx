import { Sun } from 'lucide-react'
import { useCallback, useEffect, useState, type ComponentType } from 'react'
import { toast } from 'sonner'
import { forgetRoom, goHome, rememberRoom, type Session } from '@/api/session'
import type { ErrorMessage, Phase, PlayerView } from '@/api/types'
import { useRoom } from '@/api/useRoom'
import { ActAsBar } from '@/components/game/ActAsBar'
import { SeatNotesProvider } from '@/components/game/SeatNotes'
import { Curtain } from '@/components/layout/Curtain'
import { FullScreenLoading } from '@/components/layout/FullScreenLoading'
import { FullScreenMessage } from '@/components/layout/FullScreenMessage'
import { Page } from '@/components/layout/Page'
import { Button } from '@/components/ui/button'
import { errorText, phaseLabel } from '@/game/text'
import { useNightTheme } from '@/hooks/useNightTheme'
import { DayPhase } from './DayPhase'
import { DealPhase } from './DealPhase'
import { LobbyPhase } from './LobbyPhase'
import { NightPhase } from './NightPhase'
import { RevealPhase } from './RevealPhase'
import { RoomHeader } from './RoomHeader'
import type { PhaseProps } from './types'
import { VotePhase } from './VotePhase'
import { setActiveRoom } from '@/lib/activeRoom'
import { useT } from '@/i18n'

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
  /** 切到别的标签页时房间页藏在后台：连接不断，只是不显示。 */
  visible: boolean
}

export function RoomScreen({ code, session, name, visible }: RoomScreenProps) {
  const room = useRoom(code, session, name)
  useErrorToast(room.error, room.clearError)
  const phase = room.view?.phase
  // 藏在后台时别的页面保持自己选的深浅色，回到房间再变黑
  useNightTheme(visible && phase === 'night')
  const dawn = useDawn(phase)
  const t = useT()
  useEffect(() => rememberRoom(code), [code])

  // 登记现在所在的房间：标签栏中间的按钮变成「离开房间」，「房间」标签点了回到这里。
  // 还没进去（连接中、房间不存在）时离开就是直接回首页
  const { view: current, send: sendNow } = room
  const actingAs = current && current.me.id !== session.player_id
  const inGame = !!current && current.me.seat !== null && current.phase !== 'reveal'
  const attention = !!current && needsYou(current)
  const leave = useCallback(() => {
    if (current) {
      // 房主可能正在替机器人操作：先换回自己再离开，不然离开的是机器人
      if (actingAs) sendNow({ type: 'act_as', player: null })
      sendNow({ type: 'leave' })
    }
    forgetRoom()
    goHome()
  }, [current, actingAs, sendNow])
  useEffect(() => {
    setActiveRoom({ code, leave, inGame, attention })
  }, [code, leave, inGame, attention])
  useEffect(() => () => setActiveRoom(null), [])

  if (room.fatal) {
    return (
      <FullScreenMessage
        action={
          <Button
            size="xl"
            onClick={() => {
              forgetRoom()
              goHome()
            }}
          >
            {t.room.backHome}
          </Button>
        }
      >
        {errorText(room.fatal)}
      </FullScreenMessage>
    )
  }
  if (!room.view) {
    return <FullScreenLoading label={room.connected ? t.room.entering : t.room.connecting} />
  }

  const { view, send } = room
  const CurrentPhase = PHASES[view.phase]

  return (
    <Page>
      <RoomHeader
        phase={phaseLabel(view)}
        endsAt={view.ends_at}
        clockOffset={room.clockOffset}
        connected={room.connected}
      />
      {session.player_id === view.room.host && (
        <ActAsBar
          self={session.player_id}
          current={view.me.id}
          members={view.room.members}
          onSwitch={(player) => send({ type: 'act_as', player })}
        />
      )}
      {/* 换阶段、夜里换一步、房主换了替谁操作时都重新挂载：没选完的目标、各自的标记不会串 */}
      <SeatNotesProvider key={view.me.id} view={view}>
        <CurrentPhase key={`${view.me.id}-${view.phase}-${view.night?.index ?? 0}`} view={view} send={send} />
      </SeatNotesProvider>
      {/* 天亮的过场盖住深色换回浅色的那一下 */}
      {dawn > 0 && (
        <Curtain key={dawn}>
          <Sun aria-hidden className="size-12 text-muted-foreground" strokeWidth={1.5} />
          <div className="flex flex-col gap-1.5">
            <p className="text-2xl font-semibold tracking-wide">{t.room.dawn}</p>
            <p className="text-sm text-muted-foreground">{t.room.everyoneOpenEyes}</p>
          </div>
        </Curtain>
      )}
    </Page>
  )
}

/**
 * 夜里刚结束时加一，用来放一次「天亮了」的过场。刷新页面时已经是白天，不算天亮，不放。
 * 在渲染时比较上一次的阶段，不用 effect，免得先闪一帧没有过场的白天。
 */
/** 房间里有事等着你：没看牌、夜里轮到你、轮到你发言、还没投票。观战的人没事。 */
function needsYou(view: PlayerView): boolean {
  if (view.me.seat === null) return false
  switch (view.phase) {
    case 'deal':
      return !view.deal?.confirmed.includes(view.me.id)
    case 'night':
      return view.prompt !== null
    case 'day':
      return view.day?.speaker === view.me.id
    case 'vote':
      return !view.vote?.mine
    default:
      return false
  }
}

function useDawn(phase: Phase | undefined): number {
  const [previous, setPrevious] = useState(phase)
  const [dawn, setDawn] = useState(0)
  if (phase !== previous) {
    setPrevious(phase)
    if (previous === 'night') setDawn((count) => count + 1)
  }
  return dawn
}

/** 指令被服务端拒绝时弹一条提示，然后清掉。 */
function useErrorToast(error: ErrorMessage['code'] | null, clearError: () => void) {
  useEffect(() => {
    if (!error) return
    // 用错误码当 id：同一个错误连着来，只显示一条
    toast.error(errorText(error), { id: error })
    clearError()
  }, [error, clearError])
}

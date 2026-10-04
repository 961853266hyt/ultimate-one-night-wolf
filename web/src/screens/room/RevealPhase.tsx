import { NightLog } from '@/components/game/NightLog'
import { CenterCard, CenterCardRow } from '@/components/game/PlayingCard'
import { ResultBanner } from '@/components/game/ResultBanner'
import { RoleChange } from '@/components/game/RoleText'
import { SeatGrid, SeatTile } from '@/components/game/SeatGrid'
import { SeatStatus } from '@/components/game/SeatStatus'
import { PageContent, PageFooter } from '@/components/layout/Page'
import { Section } from '@/components/layout/Section'
import { Button } from '@/components/ui/button'
import {
  centerResults,
  headline,
  nightLog,
  outcomeSummary,
  seatResults,
  type SeatResult,
} from '@/game/result'
import { ROLES } from '@/game/roles'
import type { PhaseProps } from './types'

export function RevealPhase({ view, send }: PhaseProps) {
  const result = view.result
  if (!result) return null

  const isHost = view.me.id === view.room.host
  const played = view.me.seat !== null
  const won = result.winners.includes(view.me.id)
  const log = nightLog(view, result)

  return (
    <>
      <PageContent>
        <ResultBanner
          headline={headline(result)}
          outcome={played ? (won ? 'won' : 'lost') : null}
          summary={outcomeSummary(view, result)}
        />

        <Section title="牌堆">
          <CenterCardRow>
            {centerResults(result).map((card) => (
              <CenterCard
                key={card.slot}
                letter={card.letter}
                role={card.final}
                note={card.dealt !== card.final ? `原来是${ROLES[card.dealt].name}` : undefined}
              />
            ))}
          </CenterCardRow>
        </Section>

        <Section title="座位" caption="发到的牌 → 最后的牌">
          <SeatGrid>
            {seatResults(view, result).map((outcome) => (
              <SeatTile
                key={outcome.seat.id}
                seat={outcome.seat}
                muted={outcome.out}
                mark={outcome.out ? 'out' : undefined}
                status={<OutcomeStatus outcome={outcome} />}
              >
                <span className="text-xs">
                  <RoleChange from={outcome.dealt} to={outcome.final} />
                </span>
                {outcome.votedFor !== null && (
                  <span className="text-[11px] text-muted-foreground">投给 {outcome.votedFor} 号</span>
                )}
              </SeatTile>
            ))}
          </SeatGrid>
        </Section>

        {log.length > 0 && (
          <Section title="夜里发生了什么">
            <NightLog lines={log} />
          </Section>
        )}
      </PageContent>

      <PageFooter>
        {isHost ? (
          <Button size="xl" onClick={() => send({ type: 'rematch' })}>
            再来一局
          </Button>
        ) : (
          <p className="py-3 text-center text-sm text-muted-foreground">等房主开始下一局…</p>
        )}
      </PageFooter>
    </>
  )
}

function OutcomeStatus({ outcome }: { outcome: SeatResult }) {
  const votes = `${outcome.votes} 票`
  if (outcome.out) return <SeatStatus tone="out">出局 · {votes}</SeatStatus>
  if (outcome.won) return <SeatStatus tone="win">胜 · {votes}</SeatStatus>
  return <SeatStatus>{votes}</SeatStatus>
}

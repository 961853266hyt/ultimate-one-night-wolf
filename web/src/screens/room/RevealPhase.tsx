import { NightLog } from '@/components/game/NightLog'
import { CenterCard, CenterCardRow } from '@/components/game/PlayingCard'
import { ResultBanner } from '@/components/game/ResultBanner'
import { RoleChange, RoleName } from '@/components/game/RoleText'
import { SeatGrid, SeatTile } from '@/components/game/SeatGrid'
import { SeatStatus } from '@/components/game/SeatStatus'
import { PageContent, PageFooter } from '@/components/layout/Page'
import { Section } from '@/components/layout/Section'
import { Button } from '@/components/ui/button'
import {
  centerResults,
  hadVote,
  headline,
  nightLog,
  outcomeSummary,
  seatResults,
  type SeatResult,
} from '@/game/result'
import type { RoleId } from '@/api/types'
import { t as tr, useT } from '@/i18n'
import { ROLES } from '@/roles/catalog'
import type { PhaseProps } from './types'

export function RevealPhase({ view, send }: PhaseProps) {
  const result = view.result
  const t = useT()
  if (!result) return null

  const isHost = view.me.id === view.room.host
  const played = view.me.seat !== null
  const won = result.winners.includes(view.me.id)
  const voted = hadVote(result)
  const log = nightLog(view, result)

  return (
    <>
      <PageContent>
        <ResultBanner
          headline={headline(result)}
          outcome={played ? (won ? 'won' : 'lost') : null}
          summary={outcomeSummary(view, result)}
        />

        <Section title={t.common.centerCards}>
          <CenterCardRow>
            {centerResults(result).map((card) => (
              <CenterCard
                key={card.slot}
                letter={card.letter}
                role={card.final}
                note={centerNote(card.dealt, card.final, card.copied)}
              />
            ))}
          </CenterCardRow>
        </Section>

        <Section title={t.common.seats} caption={t.reveal.seatsCaption}>
          <SeatGrid>
            {seatResults(view, result).map((outcome) => (
              <SeatTile
                key={outcome.seat.id}
                seat={outcome.seat}
                muted={outcome.out}
                mark={outcome.out ? 'out' : undefined}
                status={<OutcomeStatus outcome={outcome} voted={voted} />}
              >
                <span className="text-xs">
                  <RoleChange from={outcome.dealt} to={outcome.final} />
                </span>
                {outcome.copied && (
                  <span className="text-[11px] text-muted-foreground">
                    {t.reveal.countsAs} <RoleName role={outcome.copied} />
                  </span>
                )}
                {outcome.votedFor !== null && (
                  <span className="text-[11px] text-muted-foreground">{t.reveal.votedFor(outcome.votedFor)}</span>
                )}
              </SeatTile>
            ))}
          </SeatGrid>
        </Section>

        {log.length > 0 && (
          <Section title={t.reveal.whatHappened}>
            <NightLog lines={log} />
          </Section>
        )}
      </PageContent>

      <PageFooter>
        {isHost ? (
          <Button size="xl" onClick={() => send({ type: 'rematch' })}>
            {t.reveal.rematch}
          </Button>
        ) : (
          <p className="py-3 text-center text-sm text-muted-foreground">{t.reveal.waitHost}</p>
        )}
      </PageFooter>
    </>
  )
}

/** 底牌下面的小字：「原来是失眠者」「算作狼人」（化身幽灵的牌），两样都有就都写。 */
function centerNote(dealt: RoleId, final: RoleId, copied: RoleId | null): string | undefined {
  const parts = [
    dealt !== final && tr().reveal.wasRole(ROLES[dealt].name),
    copied && tr().reveal.countsAsRole(ROLES[copied].name),
  ].filter(Boolean)
  return parts.length ? parts.join(' · ') : undefined
}

function OutcomeStatus({ outcome, voted }: { outcome: SeatResult; voted: boolean }) {
  const t = useT()
  // 没投票的局所有人都赢，也没有票数可写
  if (!voted) return <SeatStatus tone="win">{t.reveal.win}</SeatStatus>
  const votes = t.reveal.votes(outcome.votes)
  if (outcome.out) return <SeatStatus tone="out">{t.reveal.out} · {votes}</SeatStatus>
  if (outcome.won) return <SeatStatus tone="win">{t.reveal.win} · {votes}</SeatStatus>
  return <SeatStatus>{votes}</SeatStatus>
}

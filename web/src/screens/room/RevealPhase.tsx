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
import { ROLES } from '@/roles/catalog'
import type { PhaseProps } from './types'

export function RevealPhase({ view, send }: PhaseProps) {
  const result = view.result
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

        <Section title="牌堆">
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

        <Section title="座位" caption="发到的牌 → 最后的牌">
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
                    算作 <RoleName role={outcome.copied} />
                  </span>
                )}
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

/** 底牌下面的小字：「原来是失眠者」「算作狼人」（化身幽灵的牌），两样都有就都写。 */
function centerNote(dealt: RoleId, final: RoleId, copied: RoleId | null): string | undefined {
  const parts = [
    dealt !== final && `原来是${ROLES[dealt].name}`,
    copied && `算作${ROLES[copied].name}`,
  ].filter(Boolean)
  return parts.length ? parts.join(' · ') : undefined
}

function OutcomeStatus({ outcome, voted }: { outcome: SeatResult; voted: boolean }) {
  // 没投票的局所有人都赢，也没有票数可写
  if (!voted) return <SeatStatus tone="win">胜</SeatStatus>
  const votes = `${outcome.votes} 票`
  if (outcome.out) return <SeatStatus tone="out">出局 · {votes}</SeatStatus>
  if (outcome.won) return <SeatStatus tone="win">胜 · {votes}</SeatStatus>
  return <SeatStatus>{votes}</SeatStatus>
}

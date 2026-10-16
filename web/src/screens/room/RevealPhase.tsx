import { ArrowRight } from 'lucide-react'
import { useState } from 'react'
import type { Mark } from '@/components/game/CornerMark'
import { NightLog } from '@/components/game/NightLog'
import { CenterCard, CenterCardRow } from '@/components/game/PlayingCard'
import { ResultBanner } from '@/components/game/ResultBanner'
import { RoleName } from '@/components/game/RoleText'
import { IdentityToggle, type Identity } from '@/components/game/SeatNotes'
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
  // 座位上看最后的牌还是发到的牌，先看最后的：输赢按它算
  const [identity, setIdentity] = useState<Identity>('final')
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

        <Section title={t.common.seats} action={<IdentityToggle value={identity} onChange={setIdentity} />}>
          <SeatGrid>
            {seatResults(view, result).map((outcome) => {
              const role = identity === 'final' ? outcome.final : outcome.dealt
              const copied = result.counts_as[role]
              const marks: Mark[] = []
              if (outcome.dealt !== outcome.final) marks.push('swapped')
              if (outcome.out) marks.push('out')
              return (
                <SeatTile
                  key={outcome.seat.id}
                  seat={outcome.seat}
                  role={role}
                  badge={voted && outcome.votes > 0 ? t.reveal.votes(outcome.votes) : undefined}
                  badgeVariant="secondary"
                  muted={outcome.out}
                  mark={marks}
                  status={<OutcomeStatus outcome={outcome} voted={voted} />}
                >
                  <span className="max-w-full truncate text-xs">
                    <RoleName role={role} />
                    {copied && (
                      <span className="text-muted-foreground">
                        {' · '}
                        {t.reveal.countsAs} <RoleName role={copied} />
                      </span>
                    )}
                  </span>
                </SeatTile>
              )
            })}
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

/** 座位下面：胜、负、出局，下一行是投给了谁。得了几票在头像角上。 */
function OutcomeStatus({ outcome, voted }: { outcome: SeatResult; voted: boolean }) {
  const t = useT()
  // 没投票的局所有人都赢，也没人投给谁
  if (!voted) return <SeatStatus tone="win">{t.reveal.win}</SeatStatus>
  return (
    <>
      {outcome.out && !outcome.won ? (
        <SeatStatus tone="out">{t.reveal.out}</SeatStatus>
      ) : outcome.won ? (
        // 皮匠这种出局了也算赢的，两样都写
        <SeatStatus tone="win">{outcome.out ? `${t.reveal.win} · ${t.reveal.out}` : t.reveal.win}</SeatStatus>
      ) : (
        <SeatStatus>{t.reveal.lose}</SeatStatus>
      )}
      {outcome.votedFor !== null && (
        <span className="flex items-center gap-0.5 text-[11px] text-muted-foreground">
          <ArrowRight aria-hidden className="size-3" />
          <span aria-hidden>{t.reveal.votedForShort(outcome.votedFor)}</span>
          <span className="sr-only">{t.reveal.votedFor(outcome.votedFor)}</span>
        </span>
      )}
    </>
  )
}

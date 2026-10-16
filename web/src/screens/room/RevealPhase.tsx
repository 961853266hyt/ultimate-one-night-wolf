import { ArrowRight } from 'lucide-react'
import { useState } from 'react'
import type { Mark } from '@/components/game/CornerMark'
import { NightLog } from '@/components/game/NightLog'
import { CenterCard, CenterCardRow } from '@/components/game/PlayingCard'
import { OutcomeRow, ResultBanner } from '@/components/game/ResultBanner'
import { RoleAvatar } from '@/components/game/RoleAvatar'
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
  outcomeSeats,
  seatResults,
  type SeatResult,
} from '@/game/result'
import type { RoleId } from '@/api/types'
import { useT } from '@/i18n'
import { cn } from '@/lib/utils'
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
  const seats = seatResults(view, result)
  const { out, wolves } = outcomeSeats(seats, result)
  const [winner] = result.winning_teams

  return (
    <>
      <PageContent>
        <ResultBanner
          headline={headline(result)}
          team={result.winning_teams.length === 1 ? winner : null}
          outcome={played ? (won ? 'won' : 'lost') : null}
        >
          {voted ? (
            <>
              <OutcomeRow
                label={t.reveal.outLabel}
                empty={t.reveal.noOneOut}
                seats={out.map((s) => ({ seat: s.seat, role: s.copied ?? s.final }))}
                showRole
              />
              <OutcomeRow
                label={t.reveal.wolvesLabel}
                empty={t.reveal.noWolves}
                seats={wolves.map((s) => ({ seat: s.seat, role: s.final }))}
              />
            </>
          ) : (
            <p className="text-sm text-muted-foreground">{t.reveal.noVote}</p>
          )}
        </ResultBanner>

        <Section title={t.common.centerCards}>
          <CenterCardRow>
            {centerResults(result).map((card) => (
              <CenterCard
                key={card.slot}
                letter={card.letter}
                role={card.final}
                swapped={card.dealt !== card.final}
                note={<CenterNote dealt={card.dealt} final={card.final} copied={card.copied} />}
              />
            ))}
          </CenterCardRow>
        </Section>

        <Section title={t.common.seats} action={<IdentityToggle value={identity} onChange={setIdentity} />}>
          <SeatGrid>
            {seats.map((outcome) => {
              const role = identity === 'final' ? outcome.final : outcome.dealt
              const copied = result.counts_as[role]
              const marks: Mark[] = []
              if (outcome.dealt !== outcome.final) marks.push('swapped')
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
                  </span>
                  {/* 模仿者、化身幽灵变过身：另起一行，英文放在同一行会被截掉 */}
                  {copied && (
                    <span className="-mt-1 max-w-full truncate text-[11px] text-muted-foreground">
                      {t.reveal.countsAs} <RoleName role={copied} />
                    </span>
                  )}
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

/** 底牌下面的灰标签：「[卡图] 原来是失眠者」「算作狼人」（化身幽灵的牌），两样都有就都写。 */
function CenterNote({ dealt, final, copied }: { dealt: RoleId; final: RoleId; copied: RoleId | null }) {
  const t = useT()
  const pill = 'flex items-center gap-1 rounded-full bg-muted py-0.5 text-[11px] text-muted-foreground'
  return (
    <>
      {dealt !== final && (
        <span className={cn(pill, 'pr-2 pl-0.5')}>
          <RoleAvatar role={dealt} className="size-4" />
          {t.reveal.wasRole(ROLES[dealt].name)}
        </span>
      )}
      {copied && <span className={cn(pill, 'px-2')}>{t.reveal.countsAsRole(ROLES[copied].name)}</span>}
    </>
  )
}

/** 座位下面：胜（绿勾）或负（红叉），下一行是投给了谁。得了几票在头像角上，出局看头像变灰。 */
function OutcomeStatus({ outcome, voted }: { outcome: SeatResult; voted: boolean }) {
  const t = useT()
  // 没投票的局所有人都赢，也没人投给谁
  if (!voted) return <SeatStatus tone="win">{t.reveal.win}</SeatStatus>
  return (
    <>
      {outcome.won ? <SeatStatus tone="win">{t.reveal.win}</SeatStatus> : <SeatStatus tone="lose">{t.reveal.lose}</SeatStatus>}
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

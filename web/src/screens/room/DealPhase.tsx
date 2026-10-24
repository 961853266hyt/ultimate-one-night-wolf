import { useCallback, useState } from 'react'
import { RoleCard } from '@/components/game/RoleCard'
import { useSeatNotes } from '@/components/game/SeatNotes'
import { SeatGrid, SeatTile } from '@/components/game/SeatGrid'
import { SeatProgress } from '@/components/game/SeatStatus'
import { PageContent, PageFooter } from '@/components/layout/Page'
import { PageTitle, Section } from '@/components/layout/Section'
import { Button } from '@/components/ui/button'
import { seatsOf } from '@/game/seats'
import type { PhaseProps } from './types'
import { useT } from '@/i18n'

export function DealPhase({ view, send }: PhaseProps) {
  const seats = seatsOf(view)
  const confirmed = new Set(view.deal?.confirmed)
  const card = view.me.card
  const done = confirmed.has(view.me.id)
  const [held, setHeld] = useState(false)
  const notes = useSeatNotes()
  // 按住看过一次才能点「我记住了」；已经点过了（比如刷新了页面）也算看过
  const seen = held || done
  const markSeen = useCallback(() => setHeld(true), [])
  const t = useT()

  return (
    <>
      <PageContent>
        {card ? (
          <Section title={t.deal.yourCard}>
            <RoleCard role={card} onSeen={markSeen} />
          </Section>
        ) : (
          <PageTitle title={t.deal.watching} description={t.deal.waitNext} />
        )}

        <Section title={t.common.seats}>
          <SeatGrid>
            {seats.map((seat) => (
              <SeatTile
                key={seat.id}
                seat={seat}
                onSelect={() => notes.edit(seat)}
                status={
                  <SeatProgress done={confirmed.has(seat.id)} doneText={t.deal.seen} pendingText={t.deal.looking} />
                }
              />
            ))}
          </SeatGrid>
        </Section>
      </PageContent>

      {card && (
        <PageFooter>
          {/* 先按住看过才能点 */}
          <Button
            size="xl"
            disabled={done || !seen}
            onClick={() => send({ type: 'confirm_card' })}
          >
            {done ? t.deal.waitOthers : t.deal.remembered}
          </Button>
        </PageFooter>
      )}
    </>
  )
}

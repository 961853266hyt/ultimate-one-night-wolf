import { ClueCard } from '@/components/game/Clues'
import { NightOrder } from '@/components/game/Deck'
import { PeekRoleRow } from '@/components/game/PeekRole'
import { IdentitySwitch, useSeatNotes } from '@/components/game/SeatNotes'
import { SeatGrid, SeatTile } from '@/components/game/SeatGrid'
import { SeatProgress } from '@/components/game/SeatStatus'
import { PageContent, PageFooter } from '@/components/layout/Page'
import { Section } from '@/components/layout/Section'
import { Button } from '@/components/ui/button'
import { cluesOf } from '@/game/knowledge'
import { nightPlan } from '@/game/night'
import { seatsOf } from '@/game/seats'
import type { PhaseProps } from './types'
import { useT } from '@/i18n'

export function DayPhase({ view, send }: PhaseProps) {
  const seats = seatsOf(view)
  const ready = new Set(view.day?.ready)
  const clues = cluesOf(view)
  const plan = nightPlan(view.room.deck)
  const card = view.me.card
  const done = ready.has(view.me.id)
  const notes = useSeatNotes()
  const t = useT()

  return (
    <>
      <PageContent>
        {(card || clues.length > 0) && (
          <div className="flex flex-col gap-3">
            {card && <PeekRoleRow role={card} />}
            {clues.length > 0 && <ClueCard clues={clues} />}
          </div>
        )}

        {plan.length > 0 && (
          <Section title={t.day.nightOrder} caption={t.day.nightOrderCaption}>
            <NightOrder roles={plan} />
          </Section>
        )}

        <Section
          title={t.common.seats}
          caption={t.day.seatsCaption(ready.size, seats.length, t.notes.identity[notes.identity])}
          action={<IdentitySwitch />}
        >
          <SeatGrid>
            {seats.map((seat) => (
              <SeatTile
                key={seat.id}
                seat={seat}
                onSelect={notes.canEdit(seat) ? () => notes.edit(seat) : undefined}
                status={
                  <SeatProgress done={ready.has(seat.id)} doneText={t.day.readyDone} pendingText={t.day.discussing} />
                }
              />
            ))}
          </SeatGrid>
        </Section>
      </PageContent>

      {view.me.seat !== null && (
        <PageFooter>
          <Button size="xl" disabled={done} onClick={() => send({ type: 'ready_to_vote' })}>
            {done ? t.day.waitOthers : t.day.readyButton}
          </Button>
        </PageFooter>
      )}
    </>
  )
}

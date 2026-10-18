import { CENTER } from '@/api/types'
import { ClueCard } from '@/components/game/Clues'
import { NightOrder } from '@/components/game/Deck'
import { CenterCard, CenterCardRow } from '@/components/game/PlayingCard'
import { IdentitySwitch, useSeatNotes } from '@/components/game/SeatNotes'
import { SeatGrid, SeatTile } from '@/components/game/SeatGrid'
import { SeatProgress } from '@/components/game/SeatStatus'
import { PageContent, PageFooter } from '@/components/layout/Page'
import { Section } from '@/components/layout/Section'
import { Button } from '@/components/ui/button'
import { cluesOf } from '@/game/knowledge'
import { nightPlan } from '@/game/night'
import { centerLetter, seatsOf } from '@/game/seats'
import type { PhaseProps } from './types'
import { useT } from '@/i18n'

export function DayPhase({ view, send }: PhaseProps) {
  const seats = seatsOf(view)
  const ready = new Set(view.day?.ready)
  const clues = cluesOf(view)
  const plan = nightPlan(view.room.deck)
  const done = ready.has(view.me.id)
  const notes = useSeatNotes()
  const t = useT()

  return (
    <>
      <PageContent>
        {clues.length > 0 && <ClueCard clues={clues} />}

        {plan.length > 0 && (
          <Section title={t.day.nightOrder}>
            <NightOrder roles={plan} />
          </Section>
        )}

        {/* 底牌也能备注，跟着座位那边的「初始 / 最终」开关 */}
        <Section
          title={t.common.centerCards}
          caption={t.day.centerCaption(t.notes.identity[notes.identity])}
          action={<IdentitySwitch />}
        >
          <CenterCardRow>
            {CENTER.map((slot) => (
              <CenterCard
                key={slot}
                letter={centerLetter(slot)}
                role={notes.roleOfCenter(slot)}
                onSelect={() => notes.editCenter(slot)}
              />
            ))}
          </CenterCardRow>
        </Section>

        <Section
          title={t.common.seats}
          caption={t.day.seatsCaption(t.notes.identity[notes.identity])}
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
            {/* 几个人已经同意开始投票 */}
            <span className="font-mono opacity-60">
              {ready.size}/{seats.length}
            </span>
          </Button>
        </PageFooter>
      )}
    </>
  )
}

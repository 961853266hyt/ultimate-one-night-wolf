import { ClueCard } from '@/components/game/Clues'
import { NightOrder } from '@/components/game/Deck'
import { PeekRoleRow } from '@/components/game/PeekRole'
import { SeatGrid, SeatTile } from '@/components/game/SeatGrid'
import { SeatProgress } from '@/components/game/SeatStatus'
import { PageContent, PageFooter } from '@/components/layout/Page'
import { Section } from '@/components/layout/Section'
import { Button } from '@/components/ui/button'
import { cluesOf } from '@/game/knowledge'
import { nightPlan } from '@/game/roles'
import { seatsOf } from '@/game/seats'
import type { PhaseProps } from './types'

export function DayPhase({ view, send }: PhaseProps) {
  const seats = seatsOf(view)
  const ready = new Set(view.day?.ready)
  const clues = cluesOf(view)
  const plan = nightPlan(view.room.deck)
  const card = view.me.card
  const done = ready.has(view.me.id)

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
          <Section title="今晚的行动顺序" caption="照着回忆：谁可能换过谁的牌">
            <NightOrder roles={plan} />
          </Section>
        )}

        <Section title="座位" caption={`${ready.size}/${seats.length} 准备投票 · 全部准备好就提前投票`}>
          <SeatGrid>
            {seats.map((seat) => (
              <SeatTile
                key={seat.id}
                seat={seat}
                status={
                  <SeatProgress done={ready.has(seat.id)} doneText="可以投了" pendingText="讨论中" />
                }
              />
            ))}
          </SeatGrid>
        </Section>
      </PageContent>

      {view.me.seat !== null && (
        <PageFooter>
          <Button size="xl" disabled={done} onClick={() => send({ type: 'ready_to_vote' })}>
            {done ? '等其他人…' : '讨论好了，可以投票'}
          </Button>
        </PageFooter>
      )}
    </>
  )
}

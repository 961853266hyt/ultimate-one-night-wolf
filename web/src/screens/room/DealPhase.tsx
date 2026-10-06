import { useState } from 'react'
import { RoleCard } from '@/components/game/RoleCard'
import { SeatGrid, SeatTile } from '@/components/game/SeatGrid'
import { SeatProgress } from '@/components/game/SeatStatus'
import { PageContent, PageFooter } from '@/components/layout/Page'
import { PageTitle, Section } from '@/components/layout/Section'
import { Button } from '@/components/ui/button'
import { wakeOrder } from '@/game/night'
import { seatsOf } from '@/game/seats'
import type { PhaseProps } from './types'

export function DealPhase({ view, send }: PhaseProps) {
  const seats = seatsOf(view)
  const confirmed = new Set(view.deal?.confirmed)
  const card = view.me.card
  const done = confirmed.has(view.me.id)
  const [revealed, setRevealed] = useState(false)
  // 已经点过「我记住了」，比如刷新了页面，就直接翻开
  const faceUp = revealed || done

  return (
    <>
      <PageContent>
        {card ? (
          <Section title="你的身份">
            <RoleCard
              role={card}
              wakeOrder={wakeOrder(view.room.deck, card)}
              revealed={faceUp}
              onReveal={() => setRevealed(true)}
            />
          </Section>
        ) : (
          <PageTitle title="这一局已经开始了" description="等下一局吧" />
        )}

        <Section title="座位" caption={`${confirmed.size}/${seats.length} 已看好 · 全部看好就入夜`}>
          <SeatGrid>
            {seats.map((seat) => (
              <SeatTile
                key={seat.id}
                seat={seat}
                status={
                  <SeatProgress done={confirmed.has(seat.id)} doneText="已看好" pendingText="看牌中…" />
                }
              />
            ))}
          </SeatGrid>
        </Section>
      </PageContent>

      {card && (
        <PageFooter>
          {/* 先翻开看过才能点 */}
          <Button
            size="xl"
            disabled={done || !faceUp}
            onClick={() => send({ type: 'confirm_card' })}
          >
            {done ? '等其他人看完…' : '我记住了'}
          </Button>
        </PageFooter>
      )}
    </>
  )
}

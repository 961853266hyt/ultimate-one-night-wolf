import { Mic, RotateCcw, RotateCw } from 'lucide-react'
import { CENTER } from '@/api/types'
import { ClueCard } from '@/components/game/Clues'
import { NightOrder } from '@/components/game/Deck'
import { CenterCard, CenterCardRow } from '@/components/game/PlayingCard'
import { IdentitySwitch, SeatNoteList, useSeatNotes } from '@/components/game/SeatNotes'
import { SeatGrid, SeatTile } from '@/components/game/SeatGrid'
import { PageContent, PageFooter } from '@/components/layout/Page'
import { Section } from '@/components/layout/Section'
import { Button } from '@/components/ui/button'
import { cluesOf } from '@/game/knowledge'
import { nightPlan } from '@/game/night'
import { centerLetter, seatLabel, seatsOf } from '@/game/seats'
import type { PhaseProps } from './types'
import { useT } from '@/i18n'

export function DayPhase({ view, send }: PhaseProps) {
  const seats = seatsOf(view)
  const clues = cluesOf(view)
  const plan = nightPlan(view.room.deck)
  // 谁第一个发言、往哪边轮是开局时随机定的，天亮后公开；怎么轮由大家自己掌握，房主点「开始投票」
  const day = view.day
  const first = seats.find((seat) => seat.id === day?.first_speaker)
  const isHost = view.me.id === view.room.host
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
          action={<IdentitySwitch />}
        >
          <SeatGrid>
            {seats.map((seat) => (
              <SeatTile
                key={seat.id}
                seat={seat}
                faceUp={view.face_up[seat.id]}
                onSelect={() => notes.edit(seat)}
              />
            ))}
          </SeatGrid>
        </Section>

        <SeatNoteList seats={seats} />
      </PageContent>

      <PageFooter>
        {first && day && (
          <p className="flex min-h-8 items-center justify-center gap-1.5 text-sm text-muted-foreground">
            <Mic aria-hidden className="size-4 text-destructive" />
            <span>
              <strong className="font-semibold text-foreground">{seatLabel(first)}</strong>
              {t.day.firstSpeaker}
            </span>
            <span aria-hidden>·</span>
            {day.clockwise ? (
              <RotateCw aria-hidden className="size-4" />
            ) : (
              <RotateCcw aria-hidden className="size-4" />
            )}
            <span>{day.clockwise ? t.day.clockwise : t.day.counterclockwise}</span>
          </p>
        )}
        {isHost && (
          <Button size="xl" onClick={() => send({ type: 'start_vote' })}>
            {t.day.startVote}
          </Button>
        )}
      </PageFooter>
    </>
  )
}

import { Mic, SkipForward } from 'lucide-react'
import { CENTER } from '@/api/types'
import { ClueCard } from '@/components/game/Clues'
import { NightOrder } from '@/components/game/Deck'
import { CenterCard, CenterCardRow } from '@/components/game/PlayingCard'
import { IdentitySwitch, SeatNoteList, useSeatNotes } from '@/components/game/SeatNotes'
import { SeatGrid, SeatTile } from '@/components/game/SeatGrid'
import { SeatProgress } from '@/components/game/SeatStatus'
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
  const ready = new Set(view.day?.ready)
  const clues = cluesOf(view)
  const plan = nightPlan(view.room.deck)
  const done = ready.has(view.me.id)
  // 轮流发言：正在说的人头像发红光；轮到自己时底下多一个「结束发言」，房主可以替别人结束
  const day = view.day
  const speaker = seats.find((seat) => seat.id === day?.speaker)
  const mySpeech = speaker?.isMe ?? false
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
                speaking={seat.id === speaker?.id}
                onSelect={() => notes.edit(seat)}
                status={
                  <SeatProgress done={ready.has(seat.id)} doneText={t.day.readyDone} pendingText={t.day.discussing} />
                }
              />
            ))}
          </SeatGrid>
        </Section>

        <SeatNoteList seats={seats} />
      </PageContent>

      {(speaker || view.me.seat !== null) && (
        <PageFooter>
          {speaker && day && (
            <p className="flex min-h-8 items-center justify-center gap-1.5 text-sm text-muted-foreground">
              <Mic aria-hidden className="size-4 text-destructive" />
              <span>
                {t.day.speaking(day.speech_round, day.speech_rounds)}
                <strong className="font-semibold text-foreground">{seatLabel(speaker)}</strong>
                {t.day.speakingSuffix}
              </span>
              {isHost && !mySpeech && (
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={t.day.endSpeechFor(seatLabel(speaker))}
                  onClick={() => send({ type: 'end_speech' })}
                >
                  <SkipForward aria-hidden />
                </Button>
              )}
            </p>
          )}
          {view.me.seat !== null && (
            <div className="flex gap-2.5">
              <Button
                size="xl"
                variant={mySpeech ? 'outline' : 'default'}
                className="flex-1"
                disabled={done}
                onClick={() => send({ type: 'ready_to_vote' })}
              >
                {done ? t.day.waitOthers : t.day.readyButton}
              </Button>
              {mySpeech && (
                <Button size="xl" className="flex-1" onClick={() => send({ type: 'end_speech' })}>
                  {t.day.endSpeech}
                </Button>
              )}
            </div>
          )}
        </PageFooter>
      )}
    </>
  )
}

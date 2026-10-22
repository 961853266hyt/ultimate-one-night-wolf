import { useState } from 'react'
import { t as tr, useT } from '@/i18n'
import { ClueCard } from '@/components/game/Clues'
import { SeatGrid, SeatTile } from '@/components/game/SeatGrid'
import { IdentitySwitch, SeatNoteList } from '@/components/game/SeatNotes'
import { SeatProgress } from '@/components/game/SeatStatus'
import { PageContent, PageFooter } from '@/components/layout/Page'
import { Section } from '@/components/layout/Section'
import { Button } from '@/components/ui/button'
import { cluesOf } from '@/game/knowledge'
import { seatLabel, seatsOf, type Seat } from '@/game/seats'
import type { PhaseProps } from './types'

export function VotePhase({ view, send }: PhaseProps) {
  const [target, setTarget] = useState<string | null>(null)
  const t = useT()
  const seats = seatsOf(view)
  const voted = new Set(view.vote?.voted)
  const mine = view.vote?.mine ?? null
  const clues = cluesOf(view)
  const playing = view.me.seat !== null
  // 投出去就不能改了，之后只显示投给了谁
  const canPick = playing && mine === null
  // 房间设置里关了「可以投自己」，自己的座位就点不了
  const canPickSeat = (isMe: boolean) => canPick && (view.room.self_vote || !isMe)
  const picked = seats.find((seat) => seat.id === (mine ?? target))

  return (
    <>
      <PageContent>
        <Section
          title={t.common.seats}
          action={<IdentitySwitch />}
        >
          <SeatGrid>
            {seats.map((seat) => (
              <SeatTile
                key={seat.id}
                seat={seat}
                selected={seat.id === picked?.id}
                onSelect={canPickSeat(seat.isMe) ? () => setTarget(seat.id) : undefined}
                status={
                  <SeatProgress done={voted.has(seat.id)} doneText={t.vote.done} pendingText={t.vote.thinking} />
                }
              />
            ))}
          </SeatGrid>
        </Section>

        <SeatNoteList seats={seats} />

        {clues.length > 0 && <ClueCard clues={clues} />}
      </PageContent>

      {playing && (
        <PageFooter>
          <Button
            size="xl"
            disabled={!canPick || !picked}
            onClick={() => picked && send({ type: 'vote', target: picked.id })}
          >
            {voteButtonText(mine !== null, picked)}
          </Button>
        </PageFooter>
      )}
    </>
  )
}

/** 「投给 3 号阿杰」「投给自己」。 */
function voteButtonText(hasVoted: boolean, picked: Seat | undefined): string {
  return tr().vote.button(hasVoted, picked ? (picked.isMe ? 'self' : seatLabel(picked)) : null)
}

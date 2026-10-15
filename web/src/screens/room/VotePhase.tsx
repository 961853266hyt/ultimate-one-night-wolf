import { useState } from 'react'
import { ClueCard } from '@/components/game/Clues'
import { SeatGrid, SeatTile } from '@/components/game/SeatGrid'
import { IdentitySwitch } from '@/components/game/SeatNotes'
import { SeatProgress } from '@/components/game/SeatStatus'
import { PageContent, PageFooter } from '@/components/layout/Page'
import { PageTitle, Section } from '@/components/layout/Section'
import { Button } from '@/components/ui/button'
import { cluesOf } from '@/game/knowledge'
import { seatLabel, seatsOf, type Seat } from '@/game/seats'
import type { PhaseProps } from './types'

export function VotePhase({ view, send }: PhaseProps) {
  const [target, setTarget] = useState<string | null>(null)
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
        <PageTitle
          title={mine ? '投好了，等大家亮票' : '你觉得谁是狼？'}
          description="得票最多且至少 2 票的人出局，平票一起出局"
        />

        <Section
          title="座位"
          caption={`${voted.size}/${seats.length} 已投票 · 全部投完同时亮票`}
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
                  <SeatProgress done={voted.has(seat.id)} doneText="已投票" pendingText="思考中…" />
                }
              />
            ))}
          </SeatGrid>
        </Section>

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

function voteButtonText(hasVoted: boolean, picked: Seat | undefined): string {
  // 「投给 3 号阿杰」「投给自己」
  const whom = picked ? (picked.isMe ? '自己' : ` ${seatLabel(picked)}`) : null
  if (hasVoted) return whom ? `已投给${whom}` : '已投票'
  return whom ? `投给${whom}` : '先选一个人'
}

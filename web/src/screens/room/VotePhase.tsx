import { useState } from 'react'
import { ClueCard } from '@/components/game/Clues'
import { SeatGrid, SeatTile } from '@/components/game/SeatGrid'
import { SeatProgress } from '@/components/game/SeatStatus'
import { PageContent, PageFooter } from '@/components/layout/Page'
import { PageTitle, Section } from '@/components/layout/Section'
import { Button } from '@/components/ui/button'
import { cluesOf } from '@/game/knowledge'
import { seatLabel, seatsOf } from '@/game/seats'
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
  const picked = seats.find((seat) => seat.id === (mine ?? target))

  return (
    <>
      <PageContent>
        <PageTitle
          title={mine ? '投好了，等大家亮票' : '你觉得谁是狼？'}
          description="得票最多且至少 2 票的人出局，平票一起出局"
        />

        <Section title="座位" caption={`${voted.size}/${seats.length} 已投票 · 全部投完同时亮票`}>
          <SeatGrid>
            {seats.map((seat) => (
              <SeatTile
                key={seat.id}
                seat={seat}
                selected={seat.id === picked?.id}
                onSelect={canPick && !seat.isMe ? () => setTarget(seat.id) : undefined}
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
            {voteButtonText(mine !== null, picked && seatLabel(picked))}
          </Button>
        </PageFooter>
      )}
    </>
  )
}

function voteButtonText(hasVoted: boolean, pickedLabel: string | undefined): string {
  if (hasVoted) return pickedLabel ? `已投给 ${pickedLabel}` : '已投票'
  return pickedLabel ? `投给 ${pickedLabel}` : '先选一个人'
}

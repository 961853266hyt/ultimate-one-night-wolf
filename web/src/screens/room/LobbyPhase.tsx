import { SlidersHorizontal, UserPlus } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import type { RoleId } from '@/api/types'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { DeckTray } from '@/components/game/Deck'
import { DeckEditor } from '@/components/game/DeckEditor'
import { EmptySeatTile, SeatGrid, SeatTile } from '@/components/game/SeatGrid'
import { SeatStatus } from '@/components/game/SeatStatus'
import { PageContent, PageFooter } from '@/components/layout/Page'
import { Section } from '@/components/layout/Section'
import { Button } from '@/components/ui/button'
import { deckSizeFor, emptySeatCount, startBlocker } from '@/game/lobby'
import { seatLabel, seatsOf, type Seat } from '@/game/seats'
import { inviteFriends } from './invite'
import type { PhaseProps } from './types'

export function LobbyPhase({ view, send }: PhaseProps) {
  const { code, deck, auto_deck: autoDeck, recommended_deck: recommendedDeck, timings } = view.room
  const seats = seatsOf(view)
  const isHost = view.me.id === view.room.host
  const need = deckSizeFor(seats.length)
  const blocker = startBlocker(seats, deck)
  const invite = () => void inviteFriends(code)

  // 房主调整这局用哪些牌
  const [editingDeck, setEditingDeck] = useState(false)
  const editDeck = () => setEditingDeck(true)
  const saveDeck = (next: RoleId[] | null) =>
    send({ type: 'configure', settings: { deck: next, timings } })

  // 房主点别人的头像，确认后把人移出房间
  const [kickTarget, setKickTarget] = useState<Seat | null>(null)
  const [kickOpen, setKickOpen] = useState(false)
  const askToKick = (seat: Seat) => {
    setKickTarget(seat)
    setKickOpen(true)
  }

  return (
    <>
      <PageContent>
        <Section title="本局角色" caption={deckCaption(deck.length, need, autoDeck)}>
          <DeckTray deck={deck} size={need} onFill={isHost ? editDeck : undefined} />
          {isHost && (
            <Button variant="outline" size="lg" className="h-11 px-4" onClick={editDeck}>
              <SlidersHorizontal aria-hidden />
              调整角色
            </Button>
          )}
        </Section>

        <Section
          title="座位"
          caption={`${seats.length} 人已入座${isHost && seats.length > 1 ? ' · 点头像可以移出房间' : ''}`}
        >
          <SeatGrid>
            {seats.map((seat) => (
              <SeatTile
                key={seat.id}
                seat={seat}
                badge={seat.isHost ? '房主' : undefined}
                muted={!seat.online}
                status={
                  seat.online ? (
                    <SeatStatus tone="done">已就位</SeatStatus>
                  ) : (
                    <SeatStatus tone="offline">离线</SeatStatus>
                  )
                }
                onSelect={isHost && !seat.isMe ? () => askToKick(seat) : undefined}
              />
            ))}
            {Array.from({ length: emptySeatCount(seats.length) }, (_, index) => (
              <EmptySeatTile key={`empty-${index}`} number={seats.length + index + 1} onInvite={invite} />
            ))}
          </SeatGrid>
        </Section>
      </PageContent>

      <PageFooter>
        <p className="text-center text-xs text-muted-foreground">
          {isHost
            ? (blocker ?? '人齐了就开始吧')
            : deck.length === need
              ? '等房主开始游戏…'
              : '等房主把牌调整好…'}
        </p>
        <div className="flex gap-2.5">
          <Button variant="outline" size="xl" className="flex-1" onClick={invite}>
            <UserPlus aria-hidden />
            邀请朋友
          </Button>
          {isHost && (
            <Button
              size="xl"
              className="flex-1"
              disabled={blocker !== null}
              onClick={() => send({ type: 'start' })}
            >
              开始游戏
            </Button>
          )}
        </div>
      </PageFooter>

      <ConfirmDialog
        open={kickOpen}
        onOpenChange={setKickOpen}
        title={`把 ${kickTarget ? seatLabel(kickTarget) : ''} 移出房间？`}
        description="被移出的人还可以用房间号重新进来。"
        confirmLabel="移出"
        onConfirm={() => kickTarget && send({ type: 'kick', player: kickTarget.id })}
      />

      {/* 房主身份转走时自动关上 */}
      <DeckEditor
        open={isHost && editingDeck}
        onOpenChange={setEditingDeck}
        deck={deck}
        players={seats.length}
        recommended={recommendedDeck}
        onSave={saveDeck}
      />
    </>
  )
}

/** 「本局角色」下面那行小字：牌数对上时说牌是怎么来的，对不上时说差几张。 */
function deckCaption(count: number, need: number, auto: boolean): ReactNode {
  if (count < need) return <span className="text-warning">需要 {need} 张，还差 {need - count} 张</span>
  if (count > need) {
    return <span className="text-destructive">需要 {need} 张，多了 {count - need} 张</span>
  }
  return `${count} 张 · ${auto ? '按人数推荐' : '自定义'} · 点头像看介绍`
}

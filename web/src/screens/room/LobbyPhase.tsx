import { UserPlus } from 'lucide-react'
import { useState } from 'react'
import type { Settings } from '@/api/types'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { DeckEditor } from '@/components/game/DeckEditor'
import { DeckOverview } from '@/components/game/DeckOverview'
import { DeckSummary } from '@/components/game/DeckSummary'
import { EmptySeatTile, SeatGrid, SeatTile } from '@/components/game/SeatGrid'
import { SeatStatus } from '@/components/game/SeatStatus'
import { PageContent, PageFooter } from '@/components/layout/Page'
import { Section } from '@/components/layout/Section'
import { Button } from '@/components/ui/button'
import { deckSizeFor, startBlocker } from '@/game/lobby'
import { seatLabel, seatsOf, type Seat } from '@/game/seats'
import { inviteFriends } from './invite'
import type { PhaseProps } from './types'
import { useT } from '@/i18n'

export function LobbyPhase({ view, send }: PhaseProps) {
  const { code, deck, seats: size, recommended_decks: recommendedDecks, timings } = view.room
  const seats = seatsOf(view)
  const isHost = view.me.id === view.room.host
  const need = deckSizeFor(size)
  const blocker = startBlocker(seats, size, deck)
  // 座位号从 1 开始，空着的座位是 undefined
  const bySeat = Array.from({ length: size }, (_, index) => seats.find((seat) => seat.number === index + 1))
  const invite = () => void inviteFriends(code)
  const t = useT()

  // 本局设置：房主点开能改，其他人点开只能看
  const [settingsOpen, setSettingsOpen] = useState(false)
  const saveSettings = (settings: Settings) => send({ type: 'configure', settings })

  // 房主点别人的头像把人移出房间：真人要确认一下，机器人直接移走
  const [kickTarget, setKickTarget] = useState<Seat | null>(null)
  const [kickOpen, setKickOpen] = useState(false)
  const kick = (seat: Seat) => send({ type: 'kick', player: seat.id })
  const askToKick = (seat: Seat) => {
    if (seat.isBot) return kick(seat)
    setKickTarget(seat)
    setKickOpen(true)
  }

  return (
    <>
      <PageContent>
        <Section
          title={t.common.seats}
        >
          <SeatGrid>
            {bySeat.map((seat, index) =>
              seat ? (
                <SeatTile
                  key={seat.id}
                  seat={seat}
                  badge={seat.isHost ? t.seat.host : seat.isBot ? t.seat.botBadge : undefined}
                  badgeVariant={seat.isBot ? 'secondary' : 'default'}
                  muted={!seat.online}
                  status={
                    seat.online ? (
                      <SeatStatus tone="done">{t.seat.ready}</SeatStatus>
                    ) : (
                      <SeatStatus tone="offline">{t.seat.offline}</SeatStatus>
                    )
                  }
                  onSelect={isHost && !seat.isMe ? () => askToKick(seat) : undefined}
                />
              ) : (
                <EmptySeatTile
                  key={`empty-${index}`}
                  number={index + 1}
                  onTake={() => send({ type: 'take_seat', seat: index })}
                />
              ),
            )}
          </SeatGrid>
        </Section>
      </PageContent>

      <PageFooter>
        <DeckSummary
          deck={deck}
          seats={size}
          need={need}
          nightStep={timings.night_step}
          board={view.room.board}
          onOpen={() => setSettingsOpen(true)}
        />
        <div className="flex gap-2.5">
          <Button variant="outline" size="xl" className="flex-1" onClick={invite}>
            <UserPlus aria-hidden />
            {t.lobby.invite}
          </Button>
          {isHost && (
            <Button
              size="xl"
              className="flex-1"
              disabled={blocker !== null}
              onClick={() => send({ type: 'start' })}
            >
              {t.lobby.start}
            </Button>
          )}
        </div>
      </PageFooter>

      <ConfirmDialog
        open={kickOpen}
        onOpenChange={setKickOpen}
        title={t.lobby.kickTitle(kickTarget ? seatLabel(kickTarget) : '')}
        description={t.lobby.kickDescription}
        confirmLabel={t.lobby.kick}
        onConfirm={() => kickTarget && kick(kickTarget)}
      />

      {/* 房主身份转走或转来时，跟着换成只能看或者能改的那一个 */}
      <DeckEditor
        open={isHost && settingsOpen}
        onOpenChange={setSettingsOpen}
        deck={deck}
        seats={size}
        occupied={seats.filter((seat) => !seat.isBot).length}
        recommended={recommendedDecks}
        nightStep={timings.night_step}
        selfVote={view.room.self_vote}
        speechRounds={view.room.speech_rounds}
        isPublic={view.room.public}
        debug={view.room.debug}
        onSave={saveSettings}
      />
      <DeckOverview
        open={!isHost && settingsOpen}
        onOpenChange={setSettingsOpen}
        deck={deck}
        seats={size}
        need={need}
        nightStep={timings.night_step}
        selfVote={view.room.self_vote}
        speechRounds={view.room.speech_rounds}
        isPublic={view.room.public}
        debug={view.room.debug}
      />
    </>
  )
}

import { Plus, UserPlus } from 'lucide-react'
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
import { seatLabel, seatsOf, spectatorsOf, type Seat, type Spectator } from '@/game/seats'
import { cn } from '@/lib/utils'
import { inviteFriends } from './invite'
import type { PhaseProps } from './types'
import { useT } from '@/i18n'

export function LobbyPhase({ view, send }: PhaseProps) {
  const { code, deck, seats: size, recommended_decks: recommendedDecks, timings } = view.room
  const seats = seatsOf(view)
  const spectators = spectatorsOf(view)
  const seated = seats.some((seat) => seat.isMe)
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

  // 房主点别人的头像（座位上的、观战席上的都行）把人移出房间：真人要确认一下，机器人直接移走
  const [kickTarget, setKickTarget] = useState<{ id: string; label: string } | null>(null)
  const [kickOpen, setKickOpen] = useState(false)
  const kick = (player: string) => send({ type: 'kick', player })
  const askToKick = (seat: Seat) => {
    if (seat.isBot) return kick(seat.id)
    setKickTarget({ id: seat.id, label: seatLabel(seat) })
    setKickOpen(true)
  }
  const askToKickSpectator = (spectator: Spectator) => {
    setKickTarget({ id: spectator.id, label: spectator.name })
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

        {/* 观战席：离开座位的人、座位坐满之后进来的人坐这里，下一局不玩。坐着的人点「去观战」过来 */}
        {(seated || spectators.length > 0) && (
          <Section title={t.lobby.spectators}>
            <ul className="flex flex-wrap justify-center gap-2">
              {spectators.map((spectator) => (
                <li key={spectator.id}>
                  <SpectatorChip
                    spectator={spectator}
                    onSelect={isHost && !spectator.isMe ? () => askToKickSpectator(spectator) : undefined}
                  />
                </li>
              ))}
              {seated && (
                <li>
                  <button
                    type="button"
                    onClick={() => send({ type: 'leave_seat' })}
                    className="flex h-9 items-center gap-1 rounded-full border border-dashed px-3.5 text-[13px] text-muted-foreground outline-none transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
                  >
                    <Plus aria-hidden className="size-3.5" />
                    {t.lobby.watch}
                  </button>
                </li>
              )}
            </ul>
          </Section>
        )}
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
        title={t.lobby.kickTitle(kickTarget?.label ?? '')}
        description={t.lobby.kickDescription}
        confirmLabel={t.lobby.kick}
        onConfirm={() => kickTarget && kick(kickTarget.id)}
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

/** 观战席上的一个人：名字一个胶囊，房主带个标，离线的变淡。房主点别人的能把人移出房间。 */
function SpectatorChip({ spectator, onSelect }: { spectator: Spectator; onSelect?: () => void }) {
  const t = useT()
  const className = cn(
    'flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-[13px] outline-none',
    !spectator.online && 'text-muted-foreground opacity-60',
    onSelect && 'transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50',
  )
  const content = (
    <>
      {spectator.isHost && (
        <span className="rounded-full bg-primary px-1.5 text-[11px] leading-4 text-primary-foreground">{t.seat.host}</span>
      )}
      {spectator.name}
      {spectator.isMe && <span className="text-muted-foreground">{t.common.youSuffix}</span>}
    </>
  )
  return onSelect ? (
    <button type="button" onClick={onSelect} className={className}>
      {content}
    </button>
  ) : (
    <span className={className}>{content}</span>
  )
}

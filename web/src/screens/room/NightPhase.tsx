import { ArrowLeft, ArrowRight, SkipForward } from 'lucide-react'
import { useState } from 'react'
import { t as tr, useT } from '@/i18n'
import { CENTER, type Copied, type Prompt, type RoleId } from '@/api/types'
import { CenterPeek } from '@/components/game/CenterPeek'
import { CluesDrawer } from '@/components/game/Clues'
import { PhaseProgress } from '@/components/game/PhaseProgress'
import { RoleThumbnail } from '@/components/game/RoleArtCard'
import { CenterCard, CenterCardRow } from '@/components/game/PlayingCard'
import { SeatGrid, SeatTile } from '@/components/game/SeatGrid'
import { IdentitySwitch } from '@/components/game/SeatNotes'
import { Curtain } from '@/components/layout/Curtain'
import { PageContent, PageFooter } from '@/components/layout/Page'
import { PageTitle, Section } from '@/components/layout/Section'
import { Button } from '@/components/ui/button'
import { centerSightings, cluesOf } from '@/game/knowledge'
import { centerLetter, seatsOf } from '@/game/seats'
import { canPickCenter, canPickSelf, describePrompt } from '@/game/targets'
import { useNightTargets } from '@/game/useNightTargets'
import { cn } from '@/lib/utils'
import { ROLES } from '@/roles/catalog'
import type { PhaseProps } from './types'

/**
 * 夜里的每一步都长这样，轮没轮到你看起来都一样：同样能点牌、能按「确定」。
 * 只有轮到你时，选择才会发给服务器。
 *
 * 要看底牌的角色（预言家、独狼、模仿者、女巫）轮到时，点底牌是放大翻开，翻开就是行动；
 * 翻开的牌这一步里一直正面朝上。没轮到的人点底牌只是选中，不会翻。
 */
export function NightPhase({ view, send }: PhaseProps) {
  const { night, prompt } = view
  const targets = useNightTargets(prompt)
  const [peeking, setPeeking] = useState<string | null>(null)
  const t = useT()
  if (!night) return null

  const seats = seatsOf(view)
  const clues = cluesOf(view)
  // 这一步醒来得知了什么（狼互认、预言家看牌……）
  const learned = clues.some((clue) => clue.step === night.step)
  const pickSelf = prompt !== null && canPickSelf(prompt)
  // 化身幽灵化身之后，这一步接着做化身成的角色的事，提示也换成那个角色的。
  // 只看在化身幽灵那一步的化身：模仿者模仿了化身幽灵，之前还有一次模仿
  const copied = view.me.knowledge.find(
    (fact): fact is Copied => fact.type === 'copied' && fact.step === 'doppelganger',
  )?.role
  const hintRole = night.step === 'doppelganger' && copied ? copied : night.step

  const sightings = centerSightings(view.me.knowledge, night.step)
  // 轮到你、是要看底牌的角色、这一步还能选底牌：点底牌放大翻开
  const peeks =
    prompt !== null && ROLES[hintRole].peeksCenter === true && prompt.options.some((o) => o.kind === 'center')
  const canFlip = (slot: string) => peeks && !sightings.now.has(slot) && canPickCenter(prompt!, slot)
  const tapCenter = (slot: string) =>
    peeks || sightings.now.has(slot) ? setPeeking(slot) : targets.tap(slot)
  // 白痴那一步，所有人都看到同样的两个方向，轮到的人选了才算数；化身幽灵化身成白痴时只有他自己的会变
  const directional =
    night.step === 'village_idiot' || (prompt?.options.some((option) => option.kind === 'direction') ?? false)
  // 有机器人的一局，每一步不限时：房主（或者正在替机器人操作）手动结束这一步
  const meIsBot = view.room.members.some((member) => member.id === view.me.id && member.bot)
  const canEndStep = night.manual && (view.me.id === view.room.host || meIsBot)

  const flip = (slot: string) => {
    send({ type: 'night_action', targets: [slot] })
    targets.clear() // 预言家先点了人又去翻底牌，就当没点过人
  }

  const confirm = () => {
    if (prompt) send({ type: 'night_action', targets: targets.selected })
    targets.clear()
  }

  return (
    <>
      <PageContent>
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <PhaseProgress current={night.index} total={night.total} label={t.night.progress} />
            </div>
            {canEndStep && (
              <Button variant="outline" size="sm" onClick={() => send({ type: 'end_step' })}>
                <SkipForward aria-hidden />
                {t.night.endStep}
              </Button>
            )}
          </div>
          <PageTitle
            title={t.night.wakeUp(ROLES[night.step].name)}
            description={hint(hintRole, prompt, learned)}
          />
        </div>

        {directional && (
          <div role="group" aria-label={t.night.direction} className="grid grid-cols-2 gap-2.5">
            {(['previous', 'next'] as const).map((direction) => {
              const picked = targets.selected.includes(direction)
              return (
                <button
                  key={direction}
                  type="button"
                  aria-pressed={picked}
                  onClick={() => targets.tap(direction)}
                  className={cn(
                    'flex h-12 items-center justify-center gap-1.5 rounded-xl border text-sm font-medium outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50',
                    picked ? 'border-primary bg-primary text-primary-foreground' : 'hover:bg-muted',
                  )}
                >
                  {direction === 'previous' && <ArrowLeft aria-hidden className="size-4" />}
                  {t.night.directions[direction]}
                  {direction === 'next' && <ArrowRight aria-hidden className="size-4" />}
                </button>
              )
            })}
          </div>
        )}

        <Section title={t.common.centerCards}>
          <CenterCardRow>
            {CENTER.map((slot) => (
              <CenterCard
                key={slot}
                letter={centerLetter(slot)}
                role={sightings.now.get(slot)}
                seen={sightings.before.has(slot)}
                selected={targets.selected.includes(slot)}
                onSelect={() => tapCenter(slot)}
              />
            ))}
          </CenterCardRow>
        </Section>

        <Section title={t.common.seats} action={<IdentitySwitch />}>
          <SeatGrid>
            {seats.map((seat) => (
              <SeatTile
                key={seat.id}
                seat={seat}
                selected={targets.selected.includes(seat.id)}
                onSelect={seat.isMe && !pickSelf ? undefined : () => targets.tap(seat.id)}
              />
            ))}
          </SeatGrid>
        </Section>
      </PageContent>

      <PageFooter>
        <Button size="xl" disabled={!targets.ready} onClick={confirm}>
          {t.common.confirm}
        </Button>
        <CluesDrawer clues={clues} fresh={learned} />
      </PageFooter>

      <CenterPeek
        slot={peeking}
        letter={peeking ? centerLetter(peeking) : ''}
        role={peeking ? sightings.now.get(peeking) : undefined}
        canFlip={peeking !== null && canFlip(peeking)}
        hint={prompt ? hint(hintRole, prompt, learned) : undefined}
        onFlip={() => peeking && flip(peeking)}
        onClose={() => setPeeking(null)}
      />

      {/* 每一步都会重新挂载，所以每个角色醒来时都放一次 */}
      <Curtain>
        {night.index === 1 && <p className="text-sm text-muted-foreground">{t.night.nightFalls}</p>}
        <RoleThumbnail role={night.step} className="w-32 rounded-xl" />
        <p className="text-2xl font-semibold tracking-wide">{t.night.wakeUp(ROLES[night.step].name)}</p>
      </Curtain>
    </>
  )
}

function hint(step: RoleId, prompt: Prompt | null, learned: boolean): string {
  if (prompt) return ROLES[step].promptHint?.(prompt) ?? describePrompt(prompt)
  if (learned) return tr().night.learned
  return tr().night.notYourTurn
}

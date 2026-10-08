import { CENTER, type Copied, type Prompt, type RoleId } from '@/api/types'
import { CluesDrawer } from '@/components/game/Clues'
import { PhaseProgress } from '@/components/game/PhaseProgress'
import { CenterCard, CenterCardRow } from '@/components/game/PlayingCard'
import { SeatGrid, SeatTile } from '@/components/game/SeatGrid'
import { PageContent, PageFooter } from '@/components/layout/Page'
import { PageTitle, Section } from '@/components/layout/Section'
import { Button } from '@/components/ui/button'
import { cluesOf } from '@/game/knowledge'
import { centerLetter, seatsOf } from '@/game/seats'
import { canPickSelf, describePrompt } from '@/game/targets'
import { useNightTargets } from '@/game/useNightTargets'
import { ROLES } from '@/roles/catalog'
import type { PhaseProps } from './types'

/**
 * 夜里的每一步都长这样，轮没轮到你看起来都一样：同样能点牌、能按「确定」。
 * 只有轮到你时，选择才会发给服务器。
 */
export function NightPhase({ view, send }: PhaseProps) {
  const { night, prompt } = view
  const targets = useNightTargets(prompt)
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

  const confirm = () => {
    if (prompt) send({ type: 'night_action', targets: targets.selected })
    targets.clear()
  }

  return (
    <>
      <PageContent>
        <div className="flex flex-col gap-6">
          <PhaseProgress current={night.index} total={night.total} label="夜晚进度" />
          <PageTitle
            title={`${ROLES[night.step].name}请睁眼`}
            description={hint(hintRole, prompt, learned)}
          />
        </div>

        <Section title="牌堆">
          <CenterCardRow>
            {CENTER.map((slot) => (
              <CenterCard
                key={slot}
                letter={centerLetter(slot)}
                selected={targets.selected.includes(slot)}
                onSelect={() => targets.tap(slot)}
              />
            ))}
          </CenterCardRow>
        </Section>

        <Section title="座位">
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
          确定
        </Button>
        <CluesDrawer clues={clues} fresh={learned} />
      </PageFooter>
    </>
  )
}

function hint(step: RoleId, prompt: Prompt | null, learned: boolean): string {
  if (prompt) return ROLES[step].promptHint?.(prompt) ?? describePrompt(prompt)
  if (learned) return '你得知了新线索，点开下面的「我的线索」看看'
  return '没轮到你 · 随便点点，别让旁人看出来'
}

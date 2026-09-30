import { CENTER } from '../api/types'
import { Button, Muted, Panel } from '../components/ui'
import { seated, slotName } from '../game/players'
import { ROLE_NAME, TEAM_NAME } from '../game/text'
import type { ScreenProps } from './RoomScreen'

export function Reveal({ view, send }: ScreenProps) {
  const result = view.result
  if (!result) return null

  const name = (slot: string) => slotName(view, slot)
  const isHost = view.me.id === view.room.host
  const played = view.me.seat !== null
  const won = result.winners.includes(view.me.id)
  const headline = result.winning_teams.length
    ? `${result.winning_teams.map((team) => TEAM_NAME[team]).join('、')}获胜`
    : '没有人获胜'

  const cardChange = (slot: string) => {
    const dealt = result.dealt[slot]
    const final = result.final[slot]
    return dealt === final ? ROLE_NAME[final] : `${ROLE_NAME[dealt]} → ${ROLE_NAME[final]}`
  }

  return (
    <>
      <Panel>
        <p className="text-2xl font-semibold">{headline}</p>
        {played && <p className="mt-1 text-slate-300">{won ? '你赢了 🎉' : '你输了'}</p>}
      </Panel>

      <Panel title="每个人的牌（发到的 → 最后的）">
        <ul className="space-y-2">
          {seated(view).map((member) => (
            <li key={member.id} className="flex items-center gap-2">
              <span className="w-20 shrink-0 truncate">{member.name}</span>
              <span className="flex-1 text-sm">{cardChange(member.id)}</span>
              {result.deaths.includes(member.id) && <span title="出局">☠️</span>}
              {result.winners.includes(member.id) && <span className="text-xs text-emerald-400">赢</span>}
            </li>
          ))}
        </ul>
        <ul className="mt-3 space-y-1 border-t border-slate-800 pt-3 text-sm text-slate-400">
          {CENTER.map((slot) => (
            <li key={slot}>
              {name(slot)}：{cardChange(slot)}
            </li>
          ))}
        </ul>
      </Panel>

      <Panel title="投票">
        <ul className="space-y-1 text-sm">
          {Object.entries(result.votes).map(([voter, target]) => (
            <li key={voter}>
              {name(voter)} → {name(target)}
            </li>
          ))}
        </ul>
      </Panel>

      <Panel title="夜里发生了什么">
        {result.night_log.length === 0 ? (
          <Muted>夜里没有人行动</Muted>
        ) : (
          <ul className="space-y-1 text-sm">
            {result.night_log.map((entry, i) => (
              <li key={i}>
                {ROLE_NAME[entry.step]}：{name(entry.player)} → {entry.targets.map(name).join('、')}
                {entry.auto && <span className="text-slate-500">（超时，系统代选）</span>}
              </li>
            ))}
          </ul>
        )}
      </Panel>

      {isHost ? (
        <Button onClick={() => send({ type: 'rematch' })}>再来一局</Button>
      ) : (
        <Muted>等房主开始下一局…</Muted>
      )}
    </>
  )
}

import { Button, Muted, Panel } from '../components/ui'
import { ROLE_NAME } from '../game/text'
import type { ScreenProps } from './RoomScreen'

const MIN_PLAYERS = 3
const MAX_PLAYERS = 10

export function Lobby({ view, send }: ScreenProps) {
  const { members, deck, host, code } = view.room
  const isHost = view.me.id === host
  const allOnline = members.every((member) => member.online)
  const canStart = members.length >= MIN_PLAYERS && members.length <= MAX_PLAYERS && allOnline

  return (
    <>
      <Panel title="房间号">
        <p className="text-center font-mono text-5xl tracking-[0.3em]">{code}</p>
        <Muted>把房间号告诉朋友，或者把这个页面的链接发给他们</Muted>
      </Panel>

      <Panel title={`玩家（${members.length}）`}>
        <ul className="space-y-2">
          {members.map((member) => (
            <li key={member.id} className="flex items-center gap-2">
              <span className={`size-2 rounded-full ${member.online ? 'bg-emerald-400' : 'bg-slate-600'}`} />
              <span className="flex-1">
                {member.name}
                {member.id === view.me.id && <span className="text-slate-400">（你）</span>}
              </span>
              {member.id === host && <span className="text-xs text-amber-300">房主</span>}
              {isHost && member.id !== view.me.id && (
                <button
                  className="text-xs text-slate-400"
                  onClick={() => send({ type: 'kick', player: member.id })}
                >
                  移出
                </button>
              )}
            </li>
          ))}
        </ul>
      </Panel>

      <Panel title={view.room.auto_deck ? '这局的牌（按人数自动推荐）' : '这局的牌'}>
        <div className="flex flex-wrap gap-2">
          {countRoles(deck).map(([role, count]) => (
            <span key={role} className="rounded-lg bg-slate-800 px-3 py-1 text-sm">
              {ROLE_NAME[role]}
              {count > 1 && <span className="text-slate-400"> ×{count}</span>}
            </span>
          ))}
        </div>
        <p className="mt-3 text-xs text-slate-500">
          {deck.length} 张牌，每人一张，剩下 3 张扣在中间当底牌
        </p>
      </Panel>

      {isHost ? (
        <>
          <Button disabled={!canStart} onClick={() => send({ type: 'start' })}>
            开始游戏
          </Button>
          {!canStart && <Muted>需要 3 到 10 人，并且所有人都在线</Muted>}
        </>
      ) : (
        <Muted>等房主开始游戏…</Muted>
      )}
    </>
  )
}

function countRoles<T extends string>(deck: T[]): [T, number][] {
  const counts = new Map<T, number>()
  for (const role of deck) counts.set(role, (counts.get(role) ?? 0) + 1)
  return [...counts]
}

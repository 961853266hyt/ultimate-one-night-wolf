import { CENTER, type PlayerView } from '../api/types'
import { seated, slotName } from '../game/players'

/** 可以点选的牌桌：其他玩家，以及（可选的）三张底牌。 */
export function SlotGrid({
  view,
  selected,
  onTap,
  center = false,
}: {
  view: PlayerView
  selected: string[]
  onTap: (slot: string) => void
  center?: boolean
}) {
  const others = seated(view).filter((member) => member.id !== view.me.id)
  const tile = (slot: string, label: string) => (
    <button
      key={slot}
      onClick={() => onTap(slot)}
      className={`rounded-xl px-3 py-4 text-sm font-medium transition ${
        selected.includes(slot)
          ? 'bg-indigo-500 text-white'
          : 'bg-slate-800 text-slate-200 active:bg-slate-700'
      }`}
    >
      {label}
    </button>
  )

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2">
        {others.map((member) => tile(member.id, member.name))}
      </div>
      {center && (
        <div className="grid grid-cols-3 gap-2">
          {CENTER.map((slot) => tile(slot, slotName(view, slot)))}
        </div>
      )}
    </div>
  )
}

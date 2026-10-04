/**
 * 夜间选目标：按服务端给的 Prompt 决定能选什么、选够了没有。
 * 这里只是为了界面好用，合不合法最终由服务端校验。
 */
import type { Prompt, TargetOption } from '@/api/types'
import { isCenter } from './seats'

export function kindOf(slot: string): TargetOption['kind'] {
  return isCenter(slot) ? 'center' : 'player'
}

/** 点了一个位置之后的选择。换了种类（玩家 ↔ 底牌）就从头选。 */
export function toggle(prompt: Prompt, selected: string[], slot: string): string[] {
  const kind = kindOf(slot)
  const max = Math.max(0, ...prompt.options.filter((o) => o.kind === kind).map((o) => o.count))
  if (max === 0) return selected
  if (selected.includes(slot)) return selected.filter((s) => s !== slot)
  const sameKind = selected.filter((s) => kindOf(s) === kind)
  return [...sameKind, slot].slice(-max)
}

export function isComplete(prompt: Prompt, selected: string[]): boolean {
  return prompt.options.some(
    (option) =>
      selected.length === option.count && selected.every((slot) => kindOf(slot) === option.kind),
  )
}

export function describePrompt(prompt: Prompt): string {
  const choices = prompt.options.map(
    (option) => `${option.count} ${option.kind === 'player' ? '名其他玩家' : '张底牌'}`,
  )
  return `选 ${choices.join('，或者 ')}${prompt.required ? '（必须选）' : ''}`
}

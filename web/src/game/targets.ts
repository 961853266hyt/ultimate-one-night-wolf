/**
 * 夜间选目标：按服务端给的 Prompt 决定能选什么、选够了没有。
 * 这里只是为了界面好用，合不合法最终由服务端校验。
 */
import type { Prompt, TargetOption } from '@/api/types'
import { isCenter } from './seats'

export function kindOf(slot: string): TargetOption['kind'] {
  return isCenter(slot) ? 'center' : 'player'
}

/** 这个位置能不能按 option 选：种类对，也不在排除的位置里。 */
function allows(option: TargetOption, slot: string): boolean {
  return option.kind === kindOf(slot) && !option.exclude.includes(slot)
}

/** 点了一个位置之后的选择。换了种类（玩家 ↔ 底牌）就从头选。 */
export function toggle(prompt: Prompt, selected: string[], slot: string): string[] {
  const kind = kindOf(slot)
  const options = prompt.options.filter((option) => allows(option, slot))
  const max = Math.max(0, ...options.map((option) => option.count))
  if (max === 0) return selected
  if (selected.includes(slot)) return selected.filter((s) => s !== slot)
  const sameKind = selected.filter((s) => kindOf(s) === kind)
  return [...sameKind, slot].slice(-max)
}

export function isComplete(prompt: Prompt, selected: string[]): boolean {
  return prompt.options.some(
    (option) =>
      selected.length === option.count && selected.every((slot) => allows(option, slot)),
  )
}

/** 能不能选自己的座位，比如女巫可以把底牌换给自己。 */
/** 这张底牌此刻能不能选，比如预言家已经看过的那张不能再看。 */
export function canPickCenter(prompt: Prompt, slot: string): boolean {
  return prompt.options.some((option) => allows(option, slot))
}

export function canPickSelf(prompt: Prompt): boolean {
  return prompt.options.some((option) => option.kind === 'player' && option.include_self)
}

export function describePrompt(prompt: Prompt): string {
  const choices = prompt.options.map((option) => `${option.count} ${noun(option)}`)
  return `选 ${choices.join('，或者 ')}${prompt.required ? '（必须选）' : ''}`
}

function noun(option: TargetOption): string {
  if (option.kind === 'center') return '张底牌'
  return option.include_self ? '名玩家（可以是你自己）' : '名其他玩家'
}

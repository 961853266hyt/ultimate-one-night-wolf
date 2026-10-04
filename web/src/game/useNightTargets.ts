import { useState } from 'react'
import type { Prompt } from '@/api/types'
import { isComplete, toggle } from './targets'

/**
 * 夜里点牌。
 *
 * 轮到你时按 Prompt 选目标；没轮到你也一样能点、能按「确定」，只是不会发给服务器。
 * 面对面玩时，这样旁边的人就看不出谁在行动。
 */
export function useNightTargets(prompt: Prompt | null) {
  const [selected, setSelected] = useState<string[]>([])

  const tap = (slot: string) =>
    setSelected((current) => {
      if (prompt) return toggle(prompt, current, slot)
      return current.includes(slot) ? [] : [slot]
    })

  return {
    selected,
    tap,
    clear: () => setSelected([]),
    /** 能不能按「确定」。没轮到你时，随便点了什么就能按。 */
    ready: prompt ? isComplete(prompt, selected) : selected.length > 0,
  }
}

import type { RoleId } from '@/api/types'

/** 句子里提到的一个角色。界面会按阵营给它上色。 */
export interface RoleMention {
  role: RoleId
}

/**
 * 一句给人看的话：普通文字和角色名混排，比如 ['A 号底牌是', mention('werewolf')]。
 *
 * 这样 game/ 里拼句子时不用碰界面，界面也不用去解析字符串找角色名。
 */
export type Phrase = readonly (string | RoleMention)[]

export function mention(role: RoleId): RoleMention {
  return { role }
}

/** 把几段话用分隔符连成一句，像 Array.join 一样。 */
export function joinPhrases(phrases: readonly Phrase[], separator: string): Phrase {
  return phrases.flatMap((phrase, index) => (index === 0 ? phrase : [separator, ...phrase]))
}

/** 把挨着的文字片段并成一段，方便按整句处理（比如补空格）。 */
export function mergeText(phrase: Phrase): Phrase {
  const merged: (string | RoleMention)[] = []
  for (const part of phrase) {
    const last = merged.at(-1)
    if (typeof part === 'string' && typeof last === 'string') {
      merged[merged.length - 1] = last + part
    } else {
      merged.push(part)
    }
  }
  return merged
}

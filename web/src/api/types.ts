// 协议类型都在 protocol.gen.ts（由后端生成）。这里只补几个方便用的别名。
import type { ClientMessage, Hello, PlayerView } from './protocol.gen'

export type * from './protocol.gen'

/** 除了 hello 以外，客户端能发的每一条指令。 */
export type Command = Exclude<ClientMessage, Hello>

/** 夜里得到的一条信息。 */
export type Knowledge = PlayerView['me']['knowledge'][number]

export const CENTER = ['C0', 'C1', 'C2'] as const

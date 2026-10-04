import type { Command, PlayerView } from '@/api/types'

/** 每个阶段的页面拿到的都是这两样：此刻的视图，和发指令的函数。 */
export interface PhaseProps {
  view: PlayerView
  send: (command: Command) => void
}

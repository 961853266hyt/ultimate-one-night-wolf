import type { ErrorMessage, Phase, PlayerView } from '@/api/types'

export const PHASE_NAME: Record<Phase, string> = {
  lobby: '等待开始',
  deal: '看牌',
  night: '夜晚',
  day: '白天 · 讨论',
  vote: '投票',
  reveal: '揭晓',
}

/** 顶栏上显示的阶段，夜里带上进度，比如「夜晚 · 3/6」。 */
export function phaseLabel(view: PlayerView): string {
  if (view.phase === 'night' && view.night) {
    return `${PHASE_NAME.night} · ${view.night.index}/${view.night.total}`
  }
  return PHASE_NAME[view.phase]
}

export const ERROR_TEXT: Record<ErrorMessage['code'], string> = {
  not_member: '你不在这个房间里',
  not_host: '只有房主可以这样做',
  not_playing: '你没有参加这一局',
  wrong_phase: '现在不能这样做',
  room_full: '房间已经满了',
  game_in_progress: '这一局已经开始了，等它结束再进来吧',
  player_count: '需要 3 到 10 名玩家',
  players_offline: '还有人不在线',
  deck_size: '牌的数量要比人数多 3 张',
  too_many_copies: '有角色的牌超过了上限',
  unknown_player: '没有这个玩家',
  cannot_kick_self: '不能把自己踢出去',
  not_your_turn: '还没轮到你',
  already_acted: '这一步你已经行动过了',
  bad_targets: '选的目标不对',
  already_voted: '你已经投过票了',
  bad_message: '消息格式不对',
  bad_token: '身份失效了，请回首页重新进入',
  room_not_found: '房间不存在，或者已经解散了',
  removed: '你已经离开了这个房间',
  internal: '服务器出了点问题',
}

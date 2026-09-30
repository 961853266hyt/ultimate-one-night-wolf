import type { ErrorMessage, Phase, RoleId, Team } from '../api/types'

export const ROLE_NAME: Record<RoleId, string> = {
  werewolf: '狼人',
  minion: '爪牙',
  mason: '守夜人',
  seer: '预言家',
  robber: '强盗',
  troublemaker: '捣蛋鬼',
  drunk: '酒鬼',
  insomniac: '失眠者',
  hunter: '猎人',
  tanner: '皮匠',
  villager: '村民',
}

export const ROLE_TEAM: Record<RoleId, Team> = {
  werewolf: 'werewolf',
  minion: 'werewolf',
  mason: 'village',
  seer: 'village',
  robber: 'village',
  troublemaker: 'village',
  drunk: 'village',
  insomniac: 'village',
  hunter: 'village',
  tanner: 'tanner',
  villager: 'village',
}

export const ROLE_HINT: Record<RoleId, string> = {
  werewolf: '夜里和其他狼互相确认。如果只有你一只狼，可以看一张底牌。',
  minion: '夜里知道谁是狼，狼不知道你。狼没被票出去就算你赢，你自己被票出去也没关系。',
  mason: '夜里和另一个守夜人互相确认。',
  seer: '夜里可以看一名其他玩家的牌，或者看两张底牌。',
  robber: '夜里可以和一名其他玩家换牌，然后看看你换到了什么。',
  troublemaker: '夜里可以交换另外两名玩家的牌，但不能看。',
  drunk: '夜里必须把自己的牌和一张底牌交换，并且不能看换到了什么。',
  insomniac: '夜里最后醒来，看看自己现在手里是什么牌。',
  hunter: '如果你被票出局，你投票指向的那个人也会一起出局。',
  tanner: '只有你自己被票出局，你才赢。',
  villager: '没有夜间能力，靠推理找出狼。',
}

export const TEAM_NAME: Record<Team, string> = {
  village: '好人阵营',
  werewolf: '狼人阵营',
  tanner: '皮匠',
}

export const PHASE_NAME: Record<Phase, string> = {
  lobby: '等待开始',
  deal: '看牌',
  night: '夜晚',
  day: '白天',
  vote: '投票',
  reveal: '揭晓',
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

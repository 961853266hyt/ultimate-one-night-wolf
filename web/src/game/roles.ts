/**
 * 角色目录：名字、阵营、说明、夜里的唤醒顺序。
 *
 * 前端关于角色的文字都在这里。加新角色时，在这里补一条（再到 components/game/roleIcons.ts 挑个图标），
 * 其他界面不用改。
 */
import type { RoleId, Team } from '@/api/types'

export interface RoleInfo {
  name: string
  team: Team
  /** 一句话讲清楚这张牌能做什么，看牌时展示。 */
  hint: string
  /**
   * 揭晓时怎么描述这个角色夜里做的事，targets 是目标的称呼，比如「2 号阿杰」「A 号底牌」。
   * 只看牌、不动牌的角色不用写：看到了什么会自动补上。
   */
  describeAction?: (targets: string[]) => string
}

export const ROLES: Record<RoleId, RoleInfo> = {
  werewolf: {
    name: '狼人',
    team: 'werewolf',
    hint: '夜里和其他狼互相确认。如果只有你一只狼，可以看一张底牌。',
  },
  minion: {
    name: '爪牙',
    team: 'werewolf',
    hint: '夜里知道谁是狼，狼不知道你。狼没被票出去就算你赢，你自己被票出去也没关系。',
  },
  mason: {
    name: '守夜人',
    team: 'village',
    hint: '夜里和另一个守夜人互相确认。',
  },
  seer: {
    name: '预言家',
    team: 'village',
    hint: '夜里可以看一名其他玩家的牌，或者看两张底牌。',
  },
  robber: {
    name: '强盗',
    team: 'village',
    hint: '夜里可以和一名其他玩家换牌，然后看看你换到了什么。',
    describeAction: ([target]) => `和${target}换了牌`,
  },
  troublemaker: {
    name: '捣蛋鬼',
    team: 'village',
    hint: '夜里可以交换另外两名玩家的牌，但不能看。',
    describeAction: (targets) => `交换了${targets.join('和')}的牌`,
  },
  drunk: {
    name: '酒鬼',
    team: 'village',
    hint: '夜里必须把自己的牌和一张底牌交换，并且不能看换到了什么。',
    describeAction: ([target]) => `和${target}换了牌`,
  },
  insomniac: {
    name: '失眠者',
    team: 'village',
    hint: '夜里最后醒来，看看自己现在手里是什么牌。',
  },
  hunter: {
    name: '猎人',
    team: 'village',
    hint: '如果你被票出局，你投票指向的那个人也会一起出局。',
  },
  tanner: {
    name: '皮匠',
    team: 'tanner',
    hint: '只有你自己被票出局，你才赢。',
  },
  villager: {
    name: '村民',
    team: 'village',
    hint: '没有夜间能力，靠推理找出狼。',
  },
}

export const TEAM_NAME: Record<Team, string> = {
  village: '好人阵营',
  werewolf: '狼人阵营',
  tanner: '皮匠',
}

/** 夜里的唤醒顺序。和服务端 server/app/domain/night.py 的 NIGHT_ORDER 保持一致。 */
export const NIGHT_ORDER: readonly RoleId[] = [
  'werewolf',
  'minion',
  'mason',
  'seer',
  'robber',
  'troublemaker',
  'drunk',
  'insomniac',
]

/** 这副牌里夜里会醒的角色，按唤醒顺序每种一个。牌堆是公开的，所以大家都可以看。 */
export function nightPlan(deck: readonly RoleId[]): RoleId[] {
  return NIGHT_ORDER.filter((role) => deck.includes(role))
}

/** 这个角色这局夜里第几个醒，从 1 开始；夜里不醒就是 null。 */
export function wakeOrder(deck: readonly RoleId[], role: RoleId): number | null {
  const index = nightPlan(deck).indexOf(role)
  return index >= 0 ? index + 1 : null
}

/** 牌堆里每种角色各有几张，按第一次出现的顺序。 */
export function countRoles(deck: readonly RoleId[]): [RoleId, number][] {
  const counts = new Map<RoleId, number>()
  for (const role of deck) counts.set(role, (counts.get(role) ?? 0) + 1)
  return [...counts]
}

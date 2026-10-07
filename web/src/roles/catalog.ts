/**
 * 角色和阵营的目录：名字、图标、颜色、说明文字、张数上限。
 *
 * 前端关于「一个角色是什么样的」都从这里取：头像、名字、看牌时的说明、角色详情……
 * 加新角色时在 ROLES 里补一条就够了，规则本身在服务端。可选的官方卡图见 art.ts。
 */
import {
  AlarmClock,
  Crosshair,
  Eye,
  FlaskRound,
  Ghost,
  Hammer,
  HandCoins,
  Handshake,
  House,
  PawPrint,
  Shuffle,
  VenetianMask,
  Wine,
  type LucideIcon,
} from 'lucide-react'
import type { Prompt, RoleId, Team } from '@/api/types'

export interface RoleInfo {
  name: string
  team: Team
  /** 没有卡图时显示的线条图标。 */
  icon: LucideIcon
  /** 一句话简介，放在列表里，比如配牌页。 */
  summary: string
  /** 这张牌能做什么。看牌时的大牌和角色详情里展示。 */
  ability: string
  /** 角色详情里补充的规则细节。 */
  notes?: readonly string[]
  /** 一局最多放几张，和服务端的 max_copies 一致。 */
  maxCopies: number
  /** 夜里轮到你时的提示。不写就按 Prompt 自动生成，比如「选 1 名其他玩家」。 */
  promptHint?: (prompt: Prompt) => string
  /** 阵营不固定时，代替阵营名显示的说明，比如化身幽灵。 */
  teamNote?: string
}

// 顺序就是界面上的排列顺序：先按夜里醒来的顺序，不醒的放最后。配牌时的牌库就按这个顺序摆
export const ROLES: Record<RoleId, RoleInfo> = {
  doppelganger: {
    name: '化身幽灵',
    team: 'village', // 没化身时算好人；化身之后跟着化身成的角色走
    teamNote: '阵营跟着化身的角色',
    icon: Ghost,
    summary: '看 1 名玩家的牌，变成那个角色',
    ability:
      '夜晚在其他角色之前睁眼，查看一名玩家的牌，化身为看到的角色（获得其技能，但是自己还是保持化身幽灵的卡牌）。如果看到的是狼人、爪牙、守夜人、失眠者，则夜晚与其一起睁眼操作；如果看到的是其他有技能的角色，则立即执行操作。',
    notes: [
      '化身幽灵的阵营，与其化身的角色一致。',
      '如果化身为狼人，则在狼人阶段与狼队友一起睁眼操作。',
      '如果化身为强盗，并且抢到狼人卡牌，化身幽灵不会在狼人阶段一起睁眼操作。',
    ],
    maxCopies: 1,
    promptHint: () => '看 1 名其他玩家的牌，你就变成那个角色（必须选）',
  },
  werewolf: {
    name: '狼人',
    team: 'werewolf',
    icon: PawPrint,
    summary: '和同伴互认；独狼能看 1 张底牌',
    ability: '夜里和其他狼互相确认。如果只有你一只狼，可以看一张底牌。',
    maxCopies: 2,
  },
  minion: {
    name: '爪牙',
    team: 'werewolf',
    icon: VenetianMask,
    summary: '知道谁是狼，帮狼人赢',
    ability: '夜里知道谁是狼，狼不知道你。狼没被票出去就算你赢，你自己被票出去也没关系。',
    notes: ['如果狼都在底牌里，只要你以外有人被票出局，你就赢。'],
    maxCopies: 1,
  },
  mason: {
    name: '守夜人',
    team: 'village',
    icon: Handshake,
    summary: '两人互相确认，要成对放',
    ability: '夜里和另一个守夜人互相确认。',
    notes: ['看不到同伴，就说明另一张守夜人在底牌里。'],
    maxCopies: 2,
  },
  seer: {
    name: '预言家',
    team: 'village',
    icon: Eye,
    summary: '看 1 名玩家，或者 2 张底牌',
    ability: '夜里可以看一名其他玩家的牌，或者看两张底牌。',
    maxCopies: 1,
  },
  robber: {
    name: '强盗',
    team: 'village',
    icon: HandCoins,
    summary: '和 1 人换牌，再看换到了什么',
    ability: '夜里可以和一名其他玩家换牌，然后看看你换到了什么。',
    notes: ['换到的牌决定你最后的阵营。被换的人拿到强盗牌，自己并不知道。'],
    maxCopies: 1,
  },
  witch: {
    name: '女巫',
    team: 'village',
    icon: FlaskRound,
    summary: '看 1 张底牌，再把它换给任意一人',
    ability: '夜里可以看一张底牌。看了就必须把这张牌和任意一名玩家的牌交换，也可以换给自己。',
    notes: [
      '换给自己，你就成了那张牌的角色；换给别人，他自己并不知道。',
      '看了却到时间还没换，系统会随机替你选一名玩家。',
    ],
    maxCopies: 1,
    promptHint: (prompt) =>
      prompt.options[0]?.kind === 'center'
        ? '可以看 1 张底牌，看了就必须把它换给一名玩家（也可以是你自己）'
        : '把刚看的底牌换给一名玩家，也可以换给自己（必须选）',
  },
  troublemaker: {
    name: '捣蛋鬼',
    team: 'village',
    icon: Shuffle,
    summary: '交换另外 2 人的牌，不能看',
    ability: '夜里可以交换另外两名玩家的牌，但不能看。',
    notes: ['被交换的两个人都不知道自己的牌变了。'],
    maxCopies: 1,
  },
  drunk: {
    name: '酒鬼',
    team: 'village',
    icon: Wine,
    summary: '和 1 张底牌交换，不能看',
    ability: '夜里必须把自己的牌和一张底牌交换，并且不能看换到了什么。',
    notes: ['到时间还没选，系统会随机替你选一张。'],
    maxCopies: 1,
  },
  insomniac: {
    name: '失眠者',
    team: 'village',
    icon: AlarmClock,
    summary: '最后醒来，看自己现在的牌',
    ability: '夜里最后醒来，看看自己现在手里是什么牌。',
    maxCopies: 1,
  },
  hunter: {
    name: '猎人',
    team: 'village',
    icon: Crosshair,
    summary: '出局时，投给的人一起出局',
    ability: '如果你被票出局，你投票指向的那个人也会一起出局。',
    notes: ['被带走的如果也是猎人，会接着带走那个人投的人。'],
    maxCopies: 1,
  },
  tanner: {
    name: '皮匠',
    team: 'tanner',
    icon: Hammer,
    summary: '只有自己被票出局才算赢',
    ability: '只有你自己被票出局，你才赢。',
    notes: ['你被票出局时，狼人阵营不能获胜。'],
    maxCopies: 1,
  },
  villager: {
    name: '村民',
    team: 'village',
    icon: House,
    summary: '没有能力，靠推理',
    ability: '没有夜间能力，靠推理找出狼。',
    maxCopies: 3,
  },
}

export interface TeamInfo {
  name: string
  /** 怎样算赢。胜负看的是夜里换完之后手里的牌。 */
  goal: string
  /** 文字和小圆点的颜色。类名要写完整，Tailwind 才扫描得到。 */
  textClass: string
  dotClass: string
}

export const TEAMS: Record<Team, TeamInfo> = {
  village: {
    name: '好人阵营',
    goal: '只要有一只狼被票出局就赢。如果狼都在底牌里，没有人出局才算赢。',
    textClass: 'text-village',
    dotClass: 'bg-village',
  },
  werewolf: {
    name: '狼人阵营',
    goal: '没有狼被票出局就赢，但皮匠被票出局时不算赢。',
    textClass: 'text-werewolf',
    dotClass: 'bg-werewolf',
  },
  tanner: {
    name: '皮匠',
    goal: '只有自己被票出局才算赢。',
    textClass: 'text-tanner',
    dotClass: 'bg-tanner',
  },
}

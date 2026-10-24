/**
 * 角色和阵营的目录：名字、图标、颜色、说明文字、张数上限。
 *
 * 前端关于「一个角色是什么样的」都从这里取：头像、名字、看牌时的说明、角色详情……
 * 这里只放结构（阵营、图标、张数……）；名字、说明这些文字按语言放在 i18n/ 里，
 * 读 ROLES[role].name 时取当前语言的那一份。
 * 加新角色时在 ROLE_BASE 里补一条、两份文案里各补一条就够了，规则本身在服务端。可选的官方卡图见 art.ts。
 */
import {
  AlarmClock,
  Cat,
  Crosshair,
  Eye,
  Flashlight,
  FlaskRound,
  Ghost,
  Hammer,
  HandCoins,
  Handshake,
  House,
  MoveHorizontal,
  PawPrint,
  Shuffle,
  VenetianMask,
  Wine,
  type LucideIcon,
} from 'lucide-react'
import type { RoleId, Team } from '@/api/types'
import { t } from '@/i18n'
import type { RoleText, TeamText } from '@/i18n/zh'

interface RoleBase {
  team: Team
  /** 没有卡图时显示的线条图标。 */
  icon: LucideIcon
  /** 一局最多放几张，和服务端的 max_copies 一致。 */
  maxCopies: number
  /** 要成对放，比如守夜人：配牌时点一张，同一对的另一张跟着进出。 */
  pairs?: boolean
  /** 夜里选底牌是为了看它：点底牌放大，点牌背翻开（见 CenterPeek）。酒鬼换底牌但不看，不算。 */
  peeksCenter?: boolean
}

export type RoleInfo = RoleBase & RoleText

// 顺序就是界面上的排列顺序：先按夜里醒来的顺序，不醒的放最后。配牌时的牌库就按这个顺序摆
const ROLE_BASE: Record<RoleId, RoleBase> = {
  // 模仿者、化身幽灵没变时算好人；变了之后跟着变成的角色走
  copycat: { team: 'village', icon: Cat, maxCopies: 1, peeksCenter: true },
  doppelganger: { team: 'village', icon: Ghost, maxCopies: 1 },
  werewolf: { team: 'werewolf', icon: PawPrint, maxCopies: 2, peeksCenter: true },
  minion: { team: 'werewolf', icon: VenetianMask, maxCopies: 1 },
  mason: { team: 'village', icon: Handshake, maxCopies: 2, pairs: true },
  seer: { team: 'village', icon: Eye, maxCopies: 1, peeksCenter: true },
  robber: { team: 'village', icon: HandCoins, maxCopies: 1 },
  witch: { team: 'village', icon: FlaskRound, maxCopies: 1, peeksCenter: true },
  troublemaker: { team: 'village', icon: Shuffle, maxCopies: 1 },
  village_idiot: { team: 'village', icon: MoveHorizontal, maxCopies: 1 },
  drunk: { team: 'village', icon: Wine, maxCopies: 1 },
  insomniac: { team: 'village', icon: AlarmClock, maxCopies: 1 },
  revealer: { team: 'village', icon: Flashlight, maxCopies: 1 },
  hunter: { team: 'village', icon: Crosshair, maxCopies: 1 },
  tanner: { team: 'tanner', icon: Hammer, maxCopies: 1 },
  villager: { team: 'village', icon: House, maxCopies: 3 },
}

/** 结构上加上文字：keys 里的每个字段都是 getter，每次读都取当前语言的。 */
function withText<T extends object, Text extends object>(
  base: T,
  text: () => Text,
  keys: readonly (keyof Text)[],
): T & Text {
  const descriptors = Object.fromEntries(
    keys.map((key) => [key, { get: () => text()[key], enumerable: true }]),
  )
  return Object.defineProperties({ ...base }, descriptors) as T & Text
}

// 可选的文字字段（notes、teamNote、promptHint）在某个语言里没写时，读出来是 undefined
const ROLE_TEXT_KEYS: readonly (keyof RoleText)[] = ['name', 'summary', 'ability', 'notes', 'teamNote', 'promptHint']

export const ROLES = Object.fromEntries(
  (Object.keys(ROLE_BASE) as RoleId[]).map((role) => [
    role,
    withText(ROLE_BASE[role], () => t().roles[role], ROLE_TEXT_KEYS),
  ]),
) as Record<RoleId, RoleInfo>

export interface TeamInfo extends TeamText {
  /** 文字和小圆点的颜色。类名要写完整，Tailwind 才扫描得到。 */
  textClass: string
  dotClass: string
}

const TEAM_BASE: Record<Team, Pick<TeamInfo, 'textClass' | 'dotClass'>> = {
  village: { textClass: 'text-village', dotClass: 'bg-village' },
  werewolf: { textClass: 'text-werewolf', dotClass: 'bg-werewolf' },
  tanner: { textClass: 'text-tanner', dotClass: 'bg-tanner' },
}

export const TEAMS = Object.fromEntries(
  (Object.keys(TEAM_BASE) as Team[]).map((team) => [
    team,
    withText(TEAM_BASE[team], () => t().teams[team], ['name', 'short', 'goal']),
  ]),
) as Record<Team, TeamInfo>

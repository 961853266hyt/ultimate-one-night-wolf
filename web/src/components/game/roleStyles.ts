/** 角色和阵营在界面上的样子：图标和颜色。角色的文字在 game/roles.ts。 */
import {
  AlarmClock,
  Crosshair,
  Eye,
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
import type { RoleId, Team } from '@/api/types'

export const ROLE_ICON: Record<RoleId, LucideIcon> = {
  werewolf: PawPrint,
  minion: VenetianMask,
  mason: Handshake,
  seer: Eye,
  robber: HandCoins,
  troublemaker: Shuffle,
  drunk: Wine,
  insomniac: AlarmClock,
  hunter: Crosshair,
  tanner: Hammer,
  villager: House,
}

// 类名要写完整，Tailwind 才扫描得到
export const TEAM_TEXT: Record<Team, string> = {
  village: 'text-village',
  werewolf: 'text-werewolf',
  tanner: 'text-tanner',
}

export const TEAM_DOT: Record<Team, string> = {
  village: 'bg-village',
  werewolf: 'bg-werewolf',
  tanner: 'bg-tanner',
}

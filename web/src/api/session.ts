/**
 * 访客身份和页面跳转。
 *
 * 身份存在 localStorage，刷新、关掉再打开都还是同一个人，能回到原来的座位。
 * 开发时在网址后面加 ?as=2，可以在同一个浏览器里扮演另一个玩家。
 */

export interface Session {
  player_id: string
  token: string
}

const profile = new URLSearchParams(location.search).get('as') ?? ''
const SESSION_KEY = storageKey('session')
const NAME_KEY = storageKey('name')

/** localStorage 的键，按 ?as= 分开：同一个浏览器里扮演的几个玩家互不干扰。 */
export function storageKey(name: string): string {
  return `uonw.${name}${profile}`
}

export async function ensureSession(): Promise<Session> {
  const saved = localStorage.getItem(SESSION_KEY)
  const token = saved ? (JSON.parse(saved) as Session).token : null
  const response = await fetch('/api/session', {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  if (!response.ok) throw new Error(`session: ${response.status}`)
  const session = (await response.json()) as Session
  localStorage.setItem(SESSION_KEY, JSON.stringify(session))
  return session
}

/** 开房，返回房间号。从首页的板子开房时带上板子的 id，房间一开就是那副牌。 */
export async function createRoom(session: Session, name: string, board?: string): Promise<string> {
  const response = await fetch('/api/rooms', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.token}` },
    body: JSON.stringify({ name, board }),
  })
  if (!response.ok) throw new Error(`create room: ${response.status}`)
  return ((await response.json()) as { code: string }).code
}

export function loadName(): string {
  return localStorage.getItem(NAME_KEY) ?? ''
}

export function saveName(name: string): void {
  localStorage.setItem(NAME_KEY, name)
}

/** 房间号是 4 个大写字母。 */
export function isRoomCode(code: string): boolean {
  return /^[A-Z]{4}$/.test(code)
}

/** 发给朋友的房间链接。不带开发时用的 ?as= 参数，朋友打开时用的是自己的身份。 */
export function roomUrl(code: string): string {
  return `${location.origin}/r/${code.toUpperCase()}`
}

export function roomCodeFromPath(): string | null {
  const match = location.pathname.match(/^\/r\/([A-Za-z]{4})\/?$/)
  return match ? match[1].toUpperCase() : null
}

export function goToRoom(code: string): void {
  location.assign(`/r/${code.toUpperCase()}${location.search}`)
}

const LAST_ROOM_KEY = storageKey('lastRoom')

/** 进房间时记下房间号：切到别的标签页之后，「房间」页能一键回来。 */
export function rememberRoom(code: string): void {
  localStorage.setItem(LAST_ROOM_KEY, code.toUpperCase())
}

/** 自己离开了房间，或者房间已经没了，就不再提示回去。 */
export function forgetRoom(): void {
  localStorage.removeItem(LAST_ROOM_KEY)
}

export function lastRoom(): string | null {
  return localStorage.getItem(LAST_ROOM_KEY)
}

export function goHome(): void {
  location.assign(`/${location.search}`)
}

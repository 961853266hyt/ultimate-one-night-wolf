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
const SESSION_KEY = `uonw.session${profile}`
const NAME_KEY = `uonw.name${profile}`

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

export async function createRoom(session: Session, name: string): Promise<string> {
  const response = await fetch('/api/rooms', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.token}` },
    body: JSON.stringify({ name }),
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

export function roomCodeFromPath(): string | null {
  const match = location.pathname.match(/^\/r\/([A-Za-z]{4})\/?$/)
  return match ? match[1].toUpperCase() : null
}

export function goToRoom(code: string): void {
  location.assign(`/r/${code.toUpperCase()}${location.search}`)
}

export function goHome(): void {
  location.assign(`/${location.search}`)
}

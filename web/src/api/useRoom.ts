/**
 * 一个房间的 WebSocket 连接。
 *
 * 连上就发 hello，断了就自动重连；服务端每次推来的都是完整视图，直接替换即可。
 * 房间不存在、被踢出这类错误是致命的，不再重连。
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import type { Session } from './session'
import type { Command, ErrorMessage, PlayerView, ServerMessage } from './types'

type ErrorCode = ErrorMessage['code']

const FATAL: ReadonlySet<ErrorCode> = new Set<ErrorCode>([
  'room_not_found',
  'bad_token',
  'removed',
  'room_full',
  'game_in_progress',
])
const RETRY_MS = 1000

export interface RoomConnection {
  view: PlayerView | null
  connected: boolean
  /** 最近一次被拒绝的指令，界面展示完自己清掉。 */
  error: ErrorCode | null
  clearError: () => void
  /** 不能再继续的错误，比如房间已经解散。 */
  fatal: ErrorCode | null
  /** 服务端时间 - 本机时间，毫秒。倒计时要用。 */
  clockOffset: number
  send: (command: Command) => void
}

export function useRoom(code: string, session: Session, name: string): RoomConnection {
  const [view, setView] = useState<PlayerView | null>(null)
  const [connected, setConnected] = useState(false)
  const [error, setError] = useState<ErrorCode | null>(null)
  const [fatal, setFatal] = useState<ErrorCode | null>(null)
  const [clockOffset, setClockOffset] = useState(0)
  const socket = useRef<WebSocket | null>(null)

  useEffect(() => {
    let stopped = false
    let retry: number | undefined

    const open = () => {
      const scheme = location.protocol === 'https:' ? 'wss' : 'ws'
      const ws = new WebSocket(`${scheme}://${location.host}/ws/rooms/${code}`)
      socket.current = ws

      ws.onopen = () => {
        setConnected(true)
        ws.send(JSON.stringify({ type: 'hello', token: session.token, name }))
      }
      ws.onmessage = (event) => {
        const message = JSON.parse(event.data as string) as ServerMessage
        if (message.type === 'state') {
          setView(message.view)
          setClockOffset(message.server_now - Date.now())
        } else if (FATAL.has(message.code)) {
          stopped = true
          setFatal(message.code)
        } else {
          setError(message.code)
        }
      }
      ws.onclose = () => {
        setConnected(false)
        if (!stopped) retry = window.setTimeout(open, RETRY_MS)
      }
    }

    open()
    return () => {
      stopped = true
      window.clearTimeout(retry)
      socket.current?.close()
    }
  }, [code, session.token, name])

  const send = useCallback((command: Command) => {
    if (socket.current?.readyState === WebSocket.OPEN) {
      socket.current.send(JSON.stringify(command))
    }
  }, [])
  const clearError = useCallback(() => setError(null), [])

  return { view, connected, error, clearError, fatal, clockOffset, send }
}

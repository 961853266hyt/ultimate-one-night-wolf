/** 「房间」页用的：现在能加入的房间。 */
import { useEffect, useState } from 'react'
import { forgetRoom, lastRoom } from './session'
import type { BoardKind, Phase, RoleId } from './types'

export interface OpenRoom {
  code: string
  /** 房主的名字。 */
  host: string
  /** lobby 是等开局，reveal 是一局刚结束、等下一局。 */
  phase: Phase
  players: number
  seats: number
  deck: RoleId[]
  /** 用的是哪个板子，房主自己配的牌是 null。 */
  board: BoardKind | null
}

/** 隔几秒重新拉一次。 */
const REFRESH_MS = 5000

async function fetchOpenRooms(): Promise<OpenRoom[]> {
  const response = await fetch('/api/rooms')
  if (!response.ok) throw new Error(`open rooms: ${response.status}`)
  return (await response.json()) as OpenRoom[]
}

/**
 * 能加入的房间，每隔几秒刷新一次；切回这个页面时马上刷新。
 * 还没拉到是 null；拉失败时 failed 为 true，之前拉到的照样留着。
 */
export function useOpenRooms(): { rooms: OpenRoom[] | null; failed: boolean } {
  const [rooms, setRooms] = useState<OpenRoom[] | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let alive = true
    const load = () => {
      if (document.hidden) return
      fetchOpenRooms().then(
        (next) => {
          if (!alive) return
          setRooms(next)
          setFailed(false)
        },
        () => alive && setFailed(true),
      )
    }
    load()
    const timer = setInterval(load, REFRESH_MS)
    document.addEventListener('visibilitychange', load)
    return () => {
      alive = false
      clearInterval(timer)
      document.removeEventListener('visibilitychange', load)
    }
  }, [])

  return { rooms, failed }
}

/** 进房前的预览：GET /api/rooms/{code}。 */
export interface RoomSummary {
  code: string
  phase: Phase
  players: number
  joinable: boolean
}

/**
 * 刚才在的房间（切到别的标签页之前），还在就返回它的预览，好在「房间」页一键回去。
 * 房间已经没了就忘掉它。
 */
export function useLastRoom(): RoomSummary | null {
  const [summary, setSummary] = useState<RoomSummary | null>(null)
  useEffect(() => {
    const code = lastRoom()
    if (!code) return
    let alive = true
    fetch(`/api/rooms/${code}`).then(async (response) => {
      if (response.status === 404) forgetRoom()
      if (alive && response.ok) setSummary((await response.json()) as RoomSummary)
    }, () => {})
    return () => {
      alive = false
    }
  }, [])
  return summary
}

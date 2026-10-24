/** 首页的板子：GET /api/boards。服务端只给牌和设置，名字和标签在语言包里按 kind 翻译。 */
import { useEffect, useState } from 'react'
import type { BoardKind, RoleId } from './types'

export interface Board {
  /** 比如 chaos-5，开房时带上。 */
  id: string
  kind: BoardKind
  seats: number
  deck: RoleId[]
  /** 招牌角色：卡片上放它的大卡图。 */
  signature: RoleId
}

/** 板子不会变，拉一次就留着；失败了下次再拉。 */
let loading: Promise<Board[]> | null = null

function fetchBoards(): Promise<Board[]> {
  loading ??= fetch('/api/boards').then(async (response) => {
    if (!response.ok) throw new Error(`boards: ${response.status}`)
    return (await response.json()) as Board[]
  })
  loading.catch(() => {
    loading = null
  })
  return loading
}

/** 所有板子，按玩法、人数排好。还没拉到是 null；拉失败时 failed 为 true。 */
export function useBoards(): { boards: Board[] | null; failed: boolean } {
  const [boards, setBoards] = useState<Board[] | null>(null)
  const [failed, setFailed] = useState(false)
  useEffect(() => {
    let alive = true
    fetchBoards().then(
      (next) => alive && setBoards(next),
      () => alive && setFailed(true),
    )
    return () => {
      alive = false
    }
  }, [])
  return { boards, failed }
}

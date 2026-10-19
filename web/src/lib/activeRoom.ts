/**
 * 现在所在的房间。房间页进房时登记，真正离开（或者房间页卸载）时撤掉。
 *
 * 切到别的标签页时房间页只是藏起来，连接不断，所以还算在房间里。标签栏在房间页外面，靠它知道：
 * 中间的按钮该变成「离开房间」、「房间」标签点了回哪个房间、要不要亮红点提醒轮到你了。
 */
import { useSyncExternalStore } from 'react'

export interface ActiveRoom {
  code: string
  leave: () => void
  /** 这一局还没打完：离开时提醒座位会留到这局结束。 */
  inGame: boolean
  /** 房间里有事等着你：看牌、夜里轮到你、轮到你发言、该投票了。人在别的标签页时亮红点。 */
  attention: boolean
}

let current: ActiveRoom | null = null
const listeners = new Set<() => void>()

export function setActiveRoom(room: ActiveRoom | null): void {
  current = room
  listeners.forEach((listener) => listener())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

/** 在房间里（哪怕藏在后台）就是这个房间，不在房间里是 null。 */
export function useActiveRoom(): ActiveRoom | null {
  return useSyncExternalStore(subscribe, () => current)
}

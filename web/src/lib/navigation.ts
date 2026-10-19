/**
 * 首页、角色、房间三个页面之间切换：只改网址，不重新加载页面，订阅了的组件跟着重新渲染。
 * 进房间、回首页那种跳转还是整页加载，见 api/session。
 */
import { useSyncExternalStore } from 'react'

const listeners = new Set<() => void>()
const notify = () => listeners.forEach((listener) => listener())
// 浏览器的后退、前进
window.addEventListener('popstate', notify)

/** 换到另一个页面。保留开发时用的 ?as= 参数。 */
export function navigate(path: string): void {
  if (path === location.pathname) return
  history.pushState(null, '', `${path}${location.search}`)
  window.scrollTo(0, 0)
  notify()
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

/** 现在的路径，切换时重新渲染。 */
export function usePath(): string {
  return useSyncExternalStore(subscribe, () => location.pathname)
}

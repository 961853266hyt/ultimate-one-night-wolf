/**
 * 深浅色：浅色、深色、跟随系统。选过的存在 localStorage，没选过跟随系统。
 *
 * 夜里不管选的是什么都是深色（见 useNightTheme），天亮回到选的那个。
 * 最后都落到 <html> 的 dark class 上：抽屉、弹窗挂在 body 下面，也要跟着变。手机浏览器地址栏的颜色一起改。
 * index.html 里有一小段脚本，页面加载前先按存下的设置加上 dark，深色模式下打开页面不会先闪一下白。
 */
import { useSyncExternalStore } from 'react'

export type Theme = 'light' | 'dark' | 'system'

export const THEMES: readonly Theme[] = ['light', 'dark', 'system']

// 和 index.html 里那段脚本用同一个 key
const STORAGE_KEY = 'uonw.theme'
/** 地址栏颜色：浅色主题的背景是白色，深色主题的背景是 oklch(0.145 0 0)。 */
const BAR_COLOR = { light: '#ffffff', dark: '#0a0a0a' }

const systemDark = window.matchMedia('(prefers-color-scheme: dark)')
let current: Theme = initialTheme()
let night = false
const listeners = new Set<() => void>()
apply()
systemDark.addEventListener('change', () => {
  if (current === 'system') apply()
})

function initialTheme(): Theme {
  const saved = localStorage.getItem(STORAGE_KEY)
  return saved === 'light' || saved === 'dark' ? saved : 'system'
}

function apply() {
  const dark = night || current === 'dark' || (current === 'system' && systemDark.matches)
  document.documentElement.classList.toggle('dark', dark)
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', BAR_COLOR[dark ? 'dark' : 'light'])
}

export function setTheme(theme: Theme) {
  if (theme === current) return
  current = theme
  if (theme === 'system') localStorage.removeItem(STORAGE_KEY)
  else localStorage.setItem(STORAGE_KEY, theme)
  apply()
  listeners.forEach((listener) => listener())
}

/** 天黑时打开、天亮时关掉：夜里整个页面强制深色。 */
export function setNight(on: boolean) {
  night = on
  apply()
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

/** 选的深浅色，切换时重新渲染。 */
export function useTheme(): Theme {
  return useSyncExternalStore(subscribe, () => current)
}

/**
 * 界面语言：中文和英文。
 *
 * 文案按语言分两份，zh.ts 定结构，en.ts 必须一条不落地实现同样的结构（少一条类型检查就报错）。
 * 组件里用 useT() 取当前语言的文案，切换语言时跟着重新渲染；game/ 这类不是组件的代码直接调 t()。
 * 选过的语言存在 localStorage；没选过时看浏览器语言，中文浏览器用中文，其他用英文。
 */
import { useSyncExternalStore } from 'react'
import { en } from './en'
import { zh, type Messages } from './zh'

export type Locale = 'zh' | 'en'

export const LOCALES: readonly Locale[] = ['zh', 'en']

/** 语言列表里显示的名字，用各自的语言写，不跟着当前语言变。 */
export const LOCALE_NAME: Record<Locale, string> = { zh: '中文', en: 'English' }

const MESSAGES: Record<Locale, Messages> = { zh, en }
// 不按 ?as= 区分：同一个浏览器里扮演的几个玩家，界面语言总是一样的
const STORAGE_KEY = 'uonw.locale'

let current: Locale = initialLocale()
const listeners = new Set<() => void>()
applyToDocument(current)

function initialLocale(): Locale {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved === 'zh' || saved === 'en') return saved
  return navigator.language.toLowerCase().startsWith('zh') ? 'zh' : 'en'
}

function applyToDocument(locale: Locale) {
  document.documentElement.lang = locale === 'zh' ? 'zh-CN' : 'en'
  document.title = MESSAGES[locale].app.name
}

export function getLocale(): Locale {
  return current
}

export function setLocale(locale: Locale) {
  if (locale === current) return
  current = locale
  localStorage.setItem(STORAGE_KEY, locale)
  applyToDocument(locale)
  listeners.forEach((listener) => listener())
}

/** 当前语言的文案。给不是组件的代码用；组件里用 useT()，切换语言时才会重新渲染。 */
export function t(): Messages {
  return MESSAGES[current]
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

/** 当前语言，切换时重新渲染。 */
export function useLocale(): Locale {
  return useSyncExternalStore(subscribe, getLocale)
}

/** 当前语言的文案，切换时重新渲染。 */
export function useT(): Messages {
  return MESSAGES[useLocale()]
}

export type { Messages }

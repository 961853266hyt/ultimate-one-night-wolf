import { useEffect } from 'react'

/** 深色主题的背景色 oklch(0.145 0 0)，给手机浏览器的地址栏用。 */
const NIGHT_BAR_COLOR = '#0a0a0a'

/**
 * 天黑时整个页面换成深色主题，天亮换回来。
 *
 * 加在 <html> 上而不是某个组件上：抽屉、弹窗都挂在 body 下面，也要跟着变黑。
 * 手机浏览器地址栏的颜色一起改。
 */
export function useNightTheme(night: boolean) {
  useEffect(() => {
    if (!night) return
    const root = document.documentElement
    const meta = document.querySelector('meta[name="theme-color"]')
    const dayBarColor = meta?.getAttribute('content')

    root.classList.add('dark')
    meta?.setAttribute('content', NIGHT_BAR_COLOR)
    return () => {
      root.classList.remove('dark')
      if (dayBarColor) meta?.setAttribute('content', dayBarColor)
    }
  }, [night])
}

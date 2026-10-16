import { useEffect } from 'react'
import { setNight } from '@/theme'

/** 天黑时整个页面换成深色主题，天亮回到自己选的深浅色（见 theme/）。 */
export function useNightTheme(night: boolean) {
  useEffect(() => {
    if (!night) return
    setNight(true)
    return () => setNight(false)
  }, [night])
}

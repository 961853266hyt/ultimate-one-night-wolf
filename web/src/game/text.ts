/** 顶栏的阶段、错误提示。文字在 i18n/ 里，这里只负责挑哪一句。 */
import type { ErrorMessage, PlayerView } from '@/api/types'
import { t } from '@/i18n'

/** 顶栏上显示的阶段，夜里带上进度，比如「夜晚 · 3/6」。 */
export function phaseLabel(view: PlayerView): string {
  if (view.phase === 'night' && view.night) {
    return t().phase.nightProgress(view.night.index, view.night.total)
  }
  return t().phase[view.phase]
}

/** 服务端拒绝一条指令、或者连接出错时给人看的话。 */
export function errorText(code: ErrorMessage['code']): string {
  return t().errors[code]
}

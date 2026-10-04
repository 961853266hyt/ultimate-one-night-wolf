import { useState, type KeyboardEvent, type MouseEvent, type PointerEvent } from 'react'

/**
 * 按住时 held 为 true，松手、手指滑走、窗口失焦都会变回 false。用来做「按住查看身份」。
 *
 * 把 handlers 展开到一个 <button> 上即可；键盘按住空格或回车也行。
 * 记得给元素加上 touch-none select-none，防止手机长按弹出菜单或选中文字。
 */
export function usePressAndHold() {
  const [held, setHeld] = useState(false)
  const release = () => setHeld(false)

  const handlers = {
    onPointerDown: (event: PointerEvent<HTMLElement>) => {
      // 手指按下后滑出元素也算按着，直到抬起
      event.currentTarget.setPointerCapture(event.pointerId)
      setHeld(true)
    },
    onPointerUp: release,
    onPointerCancel: release,
    onLostPointerCapture: release,
    onKeyDown: (event: KeyboardEvent<HTMLElement>) => {
      if (event.key === ' ' || event.key === 'Enter') {
        event.preventDefault()
        setHeld(true)
      }
    },
    onKeyUp: release,
    onBlur: release,
    onContextMenu: (event: MouseEvent<HTMLElement>) => event.preventDefault(),
  }

  return { held, handlers }
}

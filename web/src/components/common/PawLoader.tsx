import { cn } from '@/lib/utils'

/** 四个爪印的位置，左右交替，从左下走到右上。 */
const STEPS = [
  { x: 12, y: 50 },
  { x: 26, y: 44 },
  { x: 32, y: 28 },
  { x: 46, y: 22 },
]

/** 一个爪印走一步的间隔，和 index.css 里 paw-step 的时长配合。 */
const STEP_DELAY = 0.45

/** 加载动画：一串狼爪印一个接一个走过去。颜色跟着文字颜色。 */
export function PawLoader({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={cn('size-16', className)} aria-hidden>
      {STEPS.map(({ x, y }, i) => (
        <g
          key={i}
          transform={`translate(${x} ${y}) rotate(50)`}
          fill="currentColor"
          className="animate-paw-step opacity-0 motion-reduce:animate-none motion-reduce:opacity-100"
          style={{ animationDelay: `${i * STEP_DELAY}s` }}
        >
          {/* 掌垫加四个趾垫，脚尖朝上 */}
          <path d="M0 -1.2 C2.8 -1.2 4.4 1.6 4.4 3.4 C4.4 5 3 5.6 0 5.6 C-3 5.6 -4.4 5 -4.4 3.4 C-4.4 1.6 -2.8 -1.2 0 -1.2 Z" />
          <ellipse cx="-4.6" cy="-2.2" rx="1.4" ry="1.9" transform="rotate(-25 -4.6 -2.2)" />
          <ellipse cx="-1.6" cy="-5" rx="1.4" ry="2" />
          <ellipse cx="1.6" cy="-5" rx="1.4" ry="2" />
          <ellipse cx="4.6" cy="-2.2" rx="1.4" ry="1.9" transform="rotate(25 4.6 -2.2)" />
        </g>
      ))}
    </svg>
  )
}

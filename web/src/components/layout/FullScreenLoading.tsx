import { PawLoader } from '@/components/common/PawLoader'

/** 占满一屏的加载动画。文字只给读屏软件念，屏幕上只有爪印。 */
export function FullScreenLoading({ label }: { label: string }) {
  return (
    <div role="status" className="flex min-h-dvh items-center justify-center p-6">
      <PawLoader />
      <span className="sr-only">{label}</span>
    </div>
  )
}

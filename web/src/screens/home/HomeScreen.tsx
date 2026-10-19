import { Page } from '@/components/layout/Page'
import { cn } from '@/lib/utils'
import { useT } from '@/i18n'

/** 首页：大图标和名字。创建、加入房间都在标签栏中间的「+」里。 */
export function HomeScreen() {
  const t = useT()
  return (
    <Page>
      <div className="flex flex-1 flex-col items-center justify-center gap-3.5 px-5 py-10">
        <img src="/icon.svg" alt="" className="size-16" />
        {/* 英文名长（One Night Ultimate Werewolf），40px 会折成三行，用小一号排成两行 */}
        <h1
          className={cn(
            'text-center leading-tight font-semibold tracking-wide text-balance',
            t.app.name.length > 10 ? 'text-[32px]' : 'text-[40px]',
          )}
        >
          {t.app.name}
        </h1>
      </div>
    </Page>
  )
}

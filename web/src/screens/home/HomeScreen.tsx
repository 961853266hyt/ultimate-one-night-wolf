import { useState, useTransition, type FormEvent } from 'react'
import { toast } from 'sonner'
import { createRoom, goToRoom, isRoomCode, loadName, saveName, type Session } from '@/api/session'
import { AppMenu } from '@/components/layout/AppMenu'
import { Page } from '@/components/layout/Page'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { NameField } from './NameField'
import { useT } from '@/i18n'

export function HomeScreen({ session }: { session: Session }) {
  const [name, setName] = useState(loadName)
  const [code, setCode] = useState('')
  const [creating, startCreating] = useTransition()
  const trimmed = name.trim()
  const t = useT()

  const create = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    startCreating(async () => {
      try {
        saveName(trimmed)
        goToRoom(await createRoom(session, trimmed))
      } catch {
        toast.error(t.home.createFailed)
      }
    })
  }

  // 没填名字也能加入：进了房间会再问一次
  const join = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (trimmed) saveName(trimmed)
    goToRoom(code)
  }

  return (
    <Page className="px-5 pb-[max(1.75rem,env(safe-area-inset-bottom))]">
      {/* 顶栏只有右边的菜单，标题在下面的大图标那里 */}
      <header className="sticky top-0 z-20 -mx-5 flex h-15 items-center justify-end bg-background/95 pr-2 backdrop-blur">
        <AppMenu />
      </header>

      <div className="flex flex-1 flex-col items-center justify-center gap-3.5 py-10">
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

      <form onSubmit={create} className="flex flex-col gap-3">
        <NameField value={name} onChange={setName} />
        <Button type="submit" size="xl" disabled={!trimmed || creating}>
          {creating ? t.home.creating : t.home.create}
        </Button>
      </form>

      <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        or
        <span className="h-px flex-1 bg-border" />
      </div>

      <form onSubmit={join} className="flex gap-2.5">
        <Input
          aria-label={t.home.roomCode}
          placeholder={t.home.roomCode}
          value={code}
          onChange={(event) => setCode(event.target.value.replace(/[^a-z]/gi, '').toUpperCase())}
          maxLength={4}
          autoComplete="off"
          autoCapitalize="characters"
          className="h-12 flex-1 px-3.5 font-mono text-lg tracking-[0.3em] placeholder:font-sans placeholder:text-base placeholder:tracking-normal"
        />
        <Button type="submit" variant="outline" size="xl" className="w-22" disabled={!isRoomCode(code)}>
          {t.home.join}
        </Button>
      </form>
    </Page>
  )
}

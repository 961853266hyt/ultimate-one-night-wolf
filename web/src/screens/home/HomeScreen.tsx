import { useState, useTransition, type FormEvent } from 'react'
import { toast } from 'sonner'
import { createRoom, goToRoom, isRoomCode, loadName, saveName, type Session } from '@/api/session'
import { Page } from '@/components/layout/Page'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { HomeMenu } from './HomeMenu'
import { NameField } from './NameField'

export function HomeScreen({ session }: { session: Session }) {
  const [name, setName] = useState(loadName)
  const [code, setCode] = useState('')
  const [creating, startCreating] = useTransition()
  const trimmed = name.trim()

  const create = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    startCreating(async () => {
      try {
        saveName(trimmed)
        goToRoom(await createRoom(session, trimmed))
      } catch {
        toast.error('创建失败，请重试')
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
        <HomeMenu />
      </header>

      <div className="flex flex-1 flex-col items-center justify-center gap-3.5 py-10">
        <img src="/icon.svg" alt="" className="size-16" />
        <h1 className="text-[40px] leading-tight font-semibold tracking-wide">一夜狼</h1>
      </div>

      <form onSubmit={create} className="flex flex-col gap-3">
        <NameField value={name} onChange={setName} />
        <Button type="submit" size="xl" disabled={!trimmed || creating}>
          {creating ? '创建中…' : '创建房间'}
        </Button>
      </form>

      <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        or
        <span className="h-px flex-1 bg-border" />
      </div>

      <form onSubmit={join} className="flex gap-2.5">
        <Input
          aria-label="房间号"
          placeholder="房间号"
          value={code}
          onChange={(event) => setCode(event.target.value.replace(/[^a-z]/gi, '').toUpperCase())}
          maxLength={4}
          autoComplete="off"
          autoCapitalize="characters"
          className="h-12 flex-1 px-3.5 font-mono text-lg tracking-[0.3em] placeholder:font-sans placeholder:text-base placeholder:tracking-normal"
        />
        <Button type="submit" variant="outline" size="xl" className="w-22" disabled={!isRoomCode(code)}>
          加入
        </Button>
      </form>
    </Page>
  )
}

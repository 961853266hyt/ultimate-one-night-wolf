import { useState } from 'react'
import { createRoom, goToRoom, loadName, saveName, type Session } from '../api/session'
import { Button, Panel } from '../components/ui'

const inputStyle =
  'w-full rounded-xl bg-slate-800 px-4 py-3 text-base outline-none placeholder:text-slate-500 focus:ring-2 focus:ring-indigo-500'

export function Home({ session }: { session: Session }) {
  const [name, setName] = useState(loadName)
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [failed, setFailed] = useState(false)
  const trimmed = name.trim()
  const roomCode = code.trim().toUpperCase()

  const create = async () => {
    setBusy(true)
    setFailed(false)
    try {
      saveName(trimmed)
      goToRoom(await createRoom(session, trimmed))
    } catch {
      setFailed(true)
      setBusy(false)
    }
  }

  const join = () => {
    saveName(trimmed)
    goToRoom(roomCode)
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-4 p-6">
      <h1 className="mb-4 text-center text-4xl font-bold">一夜狼</h1>
      <input
        className={inputStyle}
        placeholder="你的名字"
        maxLength={16}
        value={name}
        onChange={(event) => setName(event.target.value)}
      />
      <Button disabled={!trimmed || busy} onClick={create}>
        开一个房间
      </Button>
      <Panel title="加入朋友的房间">
        <div className="flex gap-2">
          <input
            className={`${inputStyle} uppercase tracking-widest`}
            placeholder="房间号"
            maxLength={4}
            value={code}
            onChange={(event) => setCode(event.target.value)}
          />
          <Button
            variant="ghost"
            disabled={!trimmed || !/^[A-Z]{4}$/.test(roomCode)}
            onClick={join}
          >
            加入
          </Button>
        </div>
      </Panel>
      {failed && <p className="text-center text-sm text-rose-400">开房失败，请稍后再试</p>}
    </main>
  )
}

/** 直接打开房间链接、还没起名字的人先在这里起个名字。 */
export function NamePrompt({ code, onSubmit }: { code: string; onSubmit: (name: string) => void }) {
  const [name, setName] = useState('')
  const trimmed = name.trim()
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-4 p-6">
      <h1 className="text-center text-2xl font-bold">进入房间 {code}</h1>
      <input
        className={inputStyle}
        placeholder="你的名字"
        maxLength={16}
        value={name}
        onChange={(event) => setName(event.target.value)}
      />
      <Button disabled={!trimmed} onClick={() => onSubmit(trimmed)}>
        进入
      </Button>
    </main>
  )
}

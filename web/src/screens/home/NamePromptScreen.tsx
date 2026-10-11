import { useState, type FormEvent } from 'react'
import { Page } from '@/components/layout/Page'
import { PageTitle } from '@/components/layout/Section'
import { Button } from '@/components/ui/button'
import { NameField } from './NameField'

interface NamePromptScreenProps {
  code: string
  onSubmit: (name: string) => void
}

/** 直接打开房间链接、还没起名字的人，先在这里起个名字。 */
export function NamePromptScreen({ code, onSubmit }: NamePromptScreenProps) {
  const [name, setName] = useState('')
  const trimmed = name.trim()

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (trimmed) onSubmit(trimmed)
  }

  return (
    <Page className="justify-center px-5">
      <form onSubmit={submit} className="flex flex-col gap-8">
        <PageTitle title={`进入房间 ${code}`} />
        <div className="flex flex-col gap-3">
          <NameField value={name} onChange={setName} autoFocus />
          <Button type="submit" size="xl" disabled={!trimmed}>
            进入
          </Button>
        </div>
      </form>
    </Page>
  )
}

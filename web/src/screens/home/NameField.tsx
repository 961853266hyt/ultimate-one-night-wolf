import { useId } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

/** 和服务端 protocol.py 里 Name 的长度上限一致。 */
const NAME_MAX_LENGTH = 16

interface NameFieldProps {
  value: string
  onChange: (value: string) => void
  autoFocus?: boolean
}

/** 「你的名字」输入框，首页和直接打开房间链接时都用它。 */
export function NameField({ value, onChange, autoFocus }: NameFieldProps) {
  const id = useId()
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id} className="font-normal text-muted-foreground">
        你的名字
      </Label>
      <Input
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="朋友们怎么叫你"
        maxLength={NAME_MAX_LENGTH}
        autoComplete="nickname"
        autoFocus={autoFocus}
        className="h-12 px-3.5 text-base"
      />
    </div>
  )
}

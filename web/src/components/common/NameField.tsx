import { useId } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useT } from '@/i18n'

/** 和服务端 protocol.py 里 Name 的长度上限一致。 */
const NAME_MAX_LENGTH = 16

interface NameFieldProps {
  value: string
  onChange: (value: string) => void
  autoFocus?: boolean
}

/** 「你的名字」输入框，首页、直接打开房间链接时、标签栏的「加入房间」都用它。标签只给屏幕阅读器，看得见的是占位文字。 */
export function NameField({ value, onChange, autoFocus }: NameFieldProps) {
  const id = useId()
  const t = useT()
  return (
    <div>
      <Label htmlFor={id} className="sr-only">
        {t.home.yourName}
      </Label>
      <Input
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={t.home.yourName}
        maxLength={NAME_MAX_LENGTH}
        autoComplete="nickname"
        autoFocus={autoFocus}
        className="h-12 px-3.5 text-base"
      />
    </div>
  )
}

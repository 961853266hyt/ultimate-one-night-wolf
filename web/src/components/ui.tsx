import type { ButtonHTMLAttributes, ReactNode } from 'react'

const BUTTON_STYLE = {
  primary: 'bg-indigo-500 text-white active:bg-indigo-600',
  ghost: 'bg-slate-800 text-slate-100 active:bg-slate-700',
  danger: 'bg-rose-600 text-white active:bg-rose-700',
}

export function Button({
  variant = 'primary',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: keyof typeof BUTTON_STYLE }) {
  return (
    <button
      className={`rounded-xl px-4 py-3 font-medium transition disabled:opacity-40 ${BUTTON_STYLE[variant]} ${className}`}
      {...props}
    />
  )
}

export function Panel({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl bg-slate-900 p-4">
      {title && <h2 className="mb-3 text-sm text-slate-400">{title}</h2>}
      {children}
    </section>
  )
}

export function Centered({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 p-6 text-center text-slate-400">
      {children}
    </div>
  )
}

export function Muted({ children }: { children: ReactNode }) {
  return <p className="text-center text-sm text-slate-400">{children}</p>
}

import type { ReactNode } from 'react'
import { cx } from '../../lib/cx'

export function FormField({
  label,
  hint,
  error,
  required,
  htmlFor,
  children,
}: {
  label: string
  hint?: string
  error?: string
  required?: boolean
  htmlFor?: string
  children: ReactNode
}) {
  return (
    <label className="block" htmlFor={htmlFor}>
      <span className="mb-1.5 flex items-baseline justify-between gap-3">
        <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink/50">
          {label}
          {required ? <span className="ml-1 text-clay">*</span> : null}
        </span>
        {hint ? <span className="text-[10.5px] text-ink/35">{hint}</span> : null}
      </span>
      {children}
      {error ? <span className="mt-1 block text-[11px] text-danger">{error}</span> : null}
    </label>
  )
}

export const fieldClass =
  'w-full rounded-xl border border-ink/12 bg-ink-soft/70 px-4 py-3 text-[13.5px] text-ink outline-none transition-colors placeholder:text-ink/30 focus:border-clay/60'

export const fieldErrorClass = 'border-danger/70'

export function FormError({ message }: { message: string | null }) {
  if (!message) return null
  return (
    <p
      className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-[12.5px] leading-relaxed text-danger"
      role="alert"
    >
      {message}
    </p>
  )
}

export function Badge({
  children,
  tone = 'neutral',
}: {
  children: ReactNode
  tone?: 'neutral' | 'live' | 'beta' | 'planned' | 'danger'
}) {
  const tones: Record<string, string> = {
    neutral: 'border-ink/15 bg-ink/5 text-ink/55',
    live: 'border-cyan/30 bg-cyan/10 text-cyan',
    beta: 'border-clay/35 bg-clay/15 text-ink',
    planned: 'border-ink/12 bg-ink/[0.03] text-ink/40',
    danger: 'border-danger/30 bg-danger/10 text-danger',
  }
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[9.5px] font-bold uppercase tracking-[0.14em]',
        tones[tone],
      )}
    >
      {children}
    </span>
  )
}

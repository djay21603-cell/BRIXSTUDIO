import type { ReactNode } from 'react'
import { cx } from '../../lib/cx'

export function StepHeading({
  step,
  kicker,
  title,
  description,
  children,
}: {
  step: number
  kicker: string
  title: string
  description: string
  children?: ReactNode
}) {
  return (
    <div className="mb-8">
      <p className="eyebrow text-clay">
        <span className="h-px w-6 bg-clay" aria-hidden="true" />
        Step {String(step).padStart(2, '0')} · {kicker}
      </p>
      <h1 className={cx('display mt-4 text-[clamp(2rem,3.6vw,3.1rem)] text-ink')}>{title}</h1>
      <p className="mt-3 max-w-2xl text-[13.5px] leading-relaxed text-ink/55">{description}</p>
      {children}
    </div>
  )
}

export function Field({
  label,
  hint,
  error,
  required,
  children,
}: {
  label: string
  hint?: string
  error?: string
  required?: boolean
  children: ReactNode
}) {
  return (
    <label className="block">
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

export const inputClass =
  'w-full rounded-xl border border-ink/12 bg-ink-soft/70 px-4 py-3 text-[13.5px] text-ink outline-none transition-colors placeholder:text-ink/30 focus:border-clay/60'

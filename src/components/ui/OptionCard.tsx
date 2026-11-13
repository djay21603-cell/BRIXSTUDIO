import type { ReactNode } from 'react'
import { Check } from 'lucide-react'
import { cx } from '../../lib/cx'

interface OptionCardProps {
  selected?: boolean
  onClick: () => void
  children: ReactNode
  className?: string
  label?: string
  describedBy?: string
}

export function OptionCard({ selected, onClick, children, className, label, describedBy }: OptionCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      aria-label={label}
      aria-describedby={describedBy}
      className={cx(
        'group relative w-full overflow-hidden rounded-2xl border p-4 text-left transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]',
        selected
          ? 'border-clay/60 bg-card shadow-[0_18px_40px_-30px_rgba(56,107,255,0.65)]'
          : 'border-ink/10 bg-ink/[0.03] hover:border-ink/25 hover:bg-ink/[0.06]',
        className,
      )}
    >
      {children}
      <span
        className={cx(
          'absolute right-3 top-3 grid h-5 w-5 place-items-center rounded-full border transition-all duration-300',
          selected
            ? 'border-clay bg-clay text-white'
            : 'border-ink/20 bg-ink/5 text-transparent group-hover:border-ink/40',
        )}
        aria-hidden="true"
      >
        <Check className="h-3 w-3" strokeWidth={3} />
      </span>
    </button>
  )
}

interface SelectPillProps {
  selected?: boolean
  onClick: () => void
  children: ReactNode
  className?: string
}

export function SelectPill({ selected, onClick, children, className }: SelectPillProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cx(
        'inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[13px] font-medium transition-all duration-300',
        selected
          ? 'border-clay bg-clay text-white'
          : 'border-ink/15 bg-transparent text-ink/70 hover:border-ink/35 hover:text-ink',
        className,
      )}
    >
      {children}
    </button>
  )
}

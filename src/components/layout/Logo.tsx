import { Link } from 'react-router-dom'
import { cx } from '../../lib/cx'

export function Logo({ compact = false, className }: { compact?: boolean; className?: string }) {
  return (
    <Link
      to="/"
      className={cx('group inline-flex items-center gap-3', className)}
      aria-label="BRIX Studio home"
    >
      <span className="gradient-brand relative grid h-9 w-9 place-items-center rounded-[10px] shadow-[0_10px_26px_-14px_rgba(56,107,255,0.95)] transition-transform duration-500 group-hover:-rotate-6">
        <span className="font-grotesk text-[10.5px] font-bold leading-none tracking-[-0.03em] text-white">
          BS
        </span>
        <span
          className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-cyan ring-2 ring-bone"
          aria-hidden="true"
        />
      </span>
      {!compact ? (
        <span className="flex flex-col leading-none">
          <span className="font-grotesk text-[13.5px] font-semibold tracking-[0.2em] text-ink">BRIX</span>
          <span className="mt-1 text-[8px] font-bold uppercase tracking-[0.42em] text-ink/45">Studio</span>
        </span>
      ) : null}
    </Link>
  )
}

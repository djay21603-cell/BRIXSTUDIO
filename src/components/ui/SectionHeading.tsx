import type { ReactNode } from 'react'
import { cx } from '../../lib/cx'

interface SectionHeadingProps {
  eyebrow?: string
  title: ReactNode
  description?: ReactNode
  align?: 'left' | 'center'
  tone?: 'dark' | 'light'
  className?: string
  action?: ReactNode
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = 'left',
  tone = 'dark',
  className,
  action,
}: SectionHeadingProps) {
  const light = tone === 'light'
  return (
    <div
      className={cx(
        'flex flex-col gap-6',
        align === 'center' && 'items-center text-center',
        Boolean(action) && 'md:flex-row md:items-end md:justify-between',
        className,
      )}
    >
      <div className={cx('max-w-2xl', align === 'center' && 'mx-auto')}>
        {eyebrow ? (
          <p className={cx('eyebrow mb-5', light ? 'text-ink/55' : 'text-clay')}>
            <span className={cx('h-px w-6', light ? 'bg-ink/40' : 'bg-clay')} aria-hidden="true" />
            {eyebrow}
          </p>
        ) : null}
        <h2
          className={cx(
            'display text-[clamp(2.35rem,4.4vw,4rem)]',
            light ? 'text-ink' : 'text-ink',
          )}
        >
          {title}
        </h2>
        {description ? (
          <p
            className={cx(
              'mt-6 max-w-xl text-[15px] leading-relaxed',
              align === 'center' && 'mx-auto',
              light ? 'text-ink/62' : 'text-ink/62',
            )}
          >
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  )
}

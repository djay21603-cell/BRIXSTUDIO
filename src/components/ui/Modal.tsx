import { useEffect, useRef, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { cx } from '../../lib/cx'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  children: ReactNode
  size?: 'default' | 'wide'
  tone?: 'light' | 'dark'
}

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  size = 'default',
  tone = 'light',
}: ModalProps) {
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previous
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center p-0 sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className="absolute inset-0 bg-bone/80 backdrop-blur-md"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className={cx(
          'relative flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-[24px] border shadow-[0_60px_140px_-50px_rgba(0,0,0,0.95)] sm:rounded-[24px]',
          size === 'wide' ? 'max-w-6xl' : 'max-w-2xl',
          tone === 'dark' ? 'border-ink/12 bg-bone text-ink' : 'border-ink/10 bg-ink-soft text-ink',
        )}
      >
        <div
          className={cx(
            'flex items-start justify-between gap-6 border-b px-6 py-5 sm:px-8',
            tone === 'dark' ? 'border-ink/12' : 'border-ink/10',
          )}
        >
          <div>
            <h2 className={cx('text-lg font-semibold tracking-tight', tone === 'dark' && 'text-ink')}>
              {title}
            </h2>
            {description ? (
              <p className={cx('mt-1 text-[13px]', tone === 'dark' ? 'text-ink/55' : 'text-ink/55')}>
                {description}
              </p>
            ) : null}
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close preview"
            className={cx(
              'grid h-9 w-9 shrink-0 place-items-center rounded-full border transition-colors',
              tone === 'dark'
                ? 'border-ink/20 text-ink hover:bg-ink/10'
                : 'border-ink/15 text-ink hover:bg-ink/5',
            )}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="overflow-y-auto">{children}</div>
      </div>
    </div>
  )
}

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { cx } from '../../lib/cx'

export type DeviceKind = 'desktop' | 'tablet' | 'mobile'

export const deviceDimensions: Record<DeviceKind, { width: number; height: number; label: string }> = {
  desktop: { width: 1440, height: 900, label: 'Desktop' },
  tablet: { width: 834, height: 1024, label: 'Tablet' },
  mobile: { width: 390, height: 844, label: 'Mobile' },
}

export function useFitScale(width: number) {
  const ref = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(0)

  useEffect(() => {
    const node = ref.current
    if (!node) return
    const measure = () => {
      const bounds = node.getBoundingClientRect()
      if (bounds.width > 0) setScale(bounds.width / width)
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(node)
    return () => observer.disconnect()
  }, [width])

  return { ref, scale }
}

interface DeviceFrameProps {
  device: DeviceKind
  children: ReactNode
  className?: string
  chrome?: boolean
  url?: string
  widget?: ReactNode
}

export function DeviceFrame({
  device,
  children,
  className,
  chrome = true,
  url = 'aureliabay.com',
  widget,
}: DeviceFrameProps) {
  const dims = deviceDimensions[device]
  const { ref, scale } = useFitScale(dims.width)
  const radius = device === 'mobile' ? 'rounded-[2.4rem]' : device === 'tablet' ? 'rounded-[1.4rem]' : 'rounded-xl'

  return (
    <div
      className={cx(
        device === 'mobile' && 'mx-auto w-full max-w-[300px]',
        device === 'tablet' && 'mx-auto w-full max-w-[620px]',
        className,
      )}
    >
      <div
        className={cx(
          'relative overflow-hidden border border-ink/10 bg-bone p-1.5 shadow-[0_36px_90px_-40px_rgba(0,0,0,0.95)]',
          radius,
        )}
      >
        {chrome && device !== 'mobile' ? (
          <div className="flex h-7 items-center gap-1.5 rounded-t-lg bg-ink-soft px-3">
            <span className="h-1.5 w-1.5 rounded-full bg-ink/25" />
            <span className="h-1.5 w-1.5 rounded-full bg-ink/25" />
            <span className="h-1.5 w-1.5 rounded-full bg-ink/25" />
            <span className="mx-auto rounded-full bg-ink/10 px-3 py-0.5 text-[8px] tracking-wide text-ink/45">
              {url}
            </span>
          </div>
        ) : null}
        <div
          ref={ref}
          className={cx(
            'relative overflow-hidden bg-bone',
            chrome && device !== 'mobile' ? 'rounded-b-lg' : radius,
          )}
          style={{ aspectRatio: `${dims.width} / ${dims.height}` }}
        >
          <div
            className="absolute left-0 top-0 origin-top-left"
            style={{
              width: dims.width,
              height: dims.height,
              transform: `scale(${scale})`,
              visibility: scale ? 'visible' : 'hidden',
            }}
          >
            {children}
          </div>
          {device === 'mobile' ? (
            <div className="pointer-events-none absolute left-1/2 top-2 z-10 h-[18px] w-[92px] -translate-x-1/2 rounded-full bg-bone/95" />
          ) : null}
          {widget}
        </div>
      </div>
    </div>
  )
}

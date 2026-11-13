import { Monitor, Smartphone, Tablet } from 'lucide-react'
import type { DeviceKind } from '../ui/DeviceFrame'
import { deviceDimensions } from '../ui/DeviceFrame'
import { cx } from '../../lib/cx'

const icons = {
  desktop: Monitor,
  tablet: Tablet,
  mobile: Smartphone,
}

export function DeviceTabs({
  device,
  onChange,
  className,
}: {
  device: DeviceKind
  onChange: (device: DeviceKind) => void
  className?: string
}) {
  return (
    <div
      className={cx(
        'inline-flex items-center gap-1 rounded-full border border-ink/10 bg-ink/[0.04] p-1 backdrop-blur',
        className,
      )}
      role="group"
      aria-label="Preview device"
    >
      {(Object.keys(deviceDimensions) as DeviceKind[]).map((kind) => {
        const Icon = icons[kind]
        return (
          <button
            key={kind}
            type="button"
            onClick={() => onChange(kind)}
            aria-pressed={device === kind}
            className={cx(
              'inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-[11.5px] font-semibold transition-all duration-300',
              device === kind
                ? 'bg-clay text-white shadow-[0_8px_20px_-10px_rgba(56,107,255,0.9)]'
                : 'text-ink/55 hover:text-ink',
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{deviceDimensions[kind].label}</span>
          </button>
        )
      })}
    </div>
  )
}

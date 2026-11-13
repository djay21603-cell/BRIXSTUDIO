import { useState } from 'react'
import { MessageCircle, X } from 'lucide-react'
import { channelLabel } from '../../data/options'
import { ChannelIcon } from '../ui/ChannelIcon'

interface PreviewWidgetProps {
  name: string
  channels: string[]
  accent: string
  accentInk: string
  bg: string
  ink: string
  muted: string
  line: string
}

export function PreviewWidget({ name, channels, accent, accentInk, bg, ink, muted, line }: PreviewWidgetProps) {
  const [open, setOpen] = useState(false)
  if (!channels.length) return null

  return (
    <div className="absolute bottom-3 right-3 z-30 flex flex-col items-end gap-2">
      {open ? (
        <div
          className="w-[min(15.5rem,calc(100vw-3rem))] overflow-hidden rounded-2xl border shadow-[0_20px_50px_-20px_rgba(0,0,0,0.45)]"
          role="dialog"
          aria-label="Sample contact widget"
          style={{ background: bg, borderColor: line, color: ink }}
        >
          <div
            className="flex items-center justify-between gap-4 px-3.5 py-2.5"
            style={{ background: accent, color: accentInk }}
          >
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em]">{name}</p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close contact widget"
              className="grid h-6 w-6 place-items-center rounded-full transition-opacity hover:opacity-70"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="p-3.5">
            <p className="text-[11px] leading-relaxed" style={{ color: muted }}>
              Hi — thanks for stopping by. How would you like to reach us?
            </p>
            <div className="mt-3 space-y-1.5">
              {channels.slice(0, 4).map((channel) => (
                <span
                  key={channel}
                  className="flex items-center gap-2 rounded-lg border px-2.5 py-2 text-[10px] font-medium"
                  style={{ borderColor: line }}
                >
                  <ChannelIcon id={channel} className="h-3.5 w-3.5" />
                  {channelLabel(channel)}
                </span>
              ))}
            </div>
            <p className="mt-3 text-[8px] uppercase tracking-[0.12em]" style={{ color: muted }}>
              Preview widget · not live
            </p>
          </div>
        </div>
      ) : null}
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-label={open ? 'Close contact options' : 'Open contact options preview'}
        className="grid h-11 w-11 place-items-center rounded-full shadow-xl transition-transform duration-300 hover:scale-105"
        style={{ background: accent, color: accentInk }}
      >
        {open ? <X className="h-5 w-5" /> : <MessageCircle className="h-5 w-5" />}
      </button>
    </div>
  )
}

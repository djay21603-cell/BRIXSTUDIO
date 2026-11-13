import { useState } from 'react'
import { ArrowRight, Eye, Layers } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useProject } from '../../context/ProjectContext'
import { getCategory } from '../../data/categories'
import { getTemplate } from '../../data/templates'
import { isHex, readableOn } from '../../data/options'
import { DeviceFrame, type DeviceKind } from '../ui/DeviceFrame'
import { DeviceTabs } from '../preview/DeviceTabs'
import { PreviewWidget } from '../preview/PreviewWidget'
import { MiniSite } from '../templates/MiniSite'
import { cx } from '../../lib/cx'

export function LivePreview({ className, onChooseDesign }: { className?: string; onChooseDesign?: () => void }) {
  const { draft } = useProject()
  const [device, setDevice] = useState<DeviceKind>('desktop')
  const template = getTemplate(draft.templateId)
  const category = getCategory(draft.categoryId)
  const accent = template && isHex(draft.brand.primary) ? draft.brand.primary : template?.palette.accent
  const url =
    (draft.brand.businessName.trim() || category?.sample.brand || 'yourbusiness')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '') + '.com'

  return (
    <div className={cx('overflow-hidden rounded-[20px] border border-ink/12 bg-card shadow-[0_40px_100px_-60px_rgba(0,0,0,0.95)]', className)}>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink/10 px-4 py-3">
        <div>
          <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-ink/60">
            <Eye className="h-3.5 w-3.5 text-clay" />
            Live preview
          </p>
          <p className="mt-1 text-[10.5px] text-ink/35">
            {template ? `${template.name} · sample content` : 'Waiting for a design'}
          </p>
        </div>
        <DeviceTabs device={device} onChange={setDevice} />
      </div>

      {template ? (
        <>
          <div className="bg-cream/55 p-3 sm:p-4">
            <DeviceFrame
              device={device}
              url={url}
              widget={
                <PreviewWidget
                  name={draft.brand.businessName.trim() || category?.sample.brand || template.name}
                  channels={draft.channels}
                  accent={accent ?? '#386bff'}
                  accentInk={readableOn(accent ?? '#386bff')}
                  bg={template.palette.surface}
                  ink={template.palette.ink}
                  muted={template.palette.muted}
                  line={template.palette.line}
                />
              }
            >
              <MiniSite
                template={template}
                category={category}
                brand={draft.brand}
                pages={draft.pages}
                features={draft.features}
                channels={draft.channels}
                motion={draft.motion}
                showSampleBadge={!draft.brand.businessName.trim()}
              />
            </DeviceFrame>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-ink/8 px-4 py-2.5">
            <p className="text-[10px] text-ink/35">
              Preview uses sample copy. Real content is added during the build.
            </p>
            <span className="inline-flex items-center gap-1.5 text-[9.5px] font-semibold uppercase tracking-[0.12em] text-ink/35">
              <Layers className="h-3 w-3" />
              {device === 'desktop' ? '1440 px' : device === 'tablet' ? '834 px' : '390 px'}
            </span>
          </div>
        </>
      ) : (
        <div className="p-4">
          <div className="relative overflow-hidden rounded-xl border border-dashed border-ink/15 bg-cream/45 px-6 py-14 text-center">
            <div className="pointer-events-none absolute inset-0 blueprint opacity-40" />
            <div className="relative mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-ink/5">
              <Eye className="h-5 w-5 text-ink/30" />
            </div>
            <p className="relative mt-4 text-[13px] font-semibold text-ink/70">No design selected yet</p>
            <p className="relative mx-auto mt-1.5 max-w-[240px] text-[11.5px] leading-relaxed text-ink/40">
              Choose a business type and a design direction to render your preview here.
            </p>
            {onChooseDesign ? (
              <button
                type="button"
                onClick={onChooseDesign}
                className="relative mt-5 inline-flex items-center gap-1.5 rounded-full border border-ink/15 bg-card px-4 py-2 text-[11.5px] font-semibold text-ink transition-colors hover:border-ink/35"
              >
                Choose a design
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            ) : (
              <Link
                to="/start?step=2"
                className="relative mt-5 inline-flex items-center gap-1.5 rounded-full border border-ink/15 bg-card px-4 py-2 text-[11.5px] font-semibold text-ink transition-colors hover:border-ink/35"
              >
                Choose a design
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

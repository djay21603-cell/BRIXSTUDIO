import { useEffect, useState } from 'react'
import { ArrowUpRight, Eye, Check, Maximize2, Minimize2, Palette } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import type { BusinessCategory, WebsiteTemplate } from '../../types'
import { getCategory } from '../../data/categories'
import { useProject } from '../../context/ProjectContext'
import { useFitScale, DeviceFrame, deviceDimensions, type DeviceKind } from '../ui/DeviceFrame'
import { Modal } from '../ui/Modal'
import { Button, ButtonLink } from '../ui/Button'
import { MiniSite } from './MiniSite'
import { PreviewWidget } from '../preview/PreviewWidget'
import { DeviceTabs } from '../preview/DeviceTabs'
import { readableOn } from '../../data/options'
import { cx } from '../../lib/cx'

export function TemplateThumb({
  template,
  category,
  className,
}: {
  template: WebsiteTemplate
  category?: BusinessCategory | null
  className?: string
}) {
  const { ref, scale } = useFitScale(1440)
  return (
    <div ref={ref} className={cx('relative aspect-[1440/1010] w-full overflow-hidden bg-cream', className)}>
      <div
        className="pointer-events-none absolute left-0 top-0 origin-top-left"
        style={{ width: 1440, height: 1010, transform: `scale(${scale})`, visibility: scale ? 'visible' : 'hidden' }}
        aria-hidden="true"
      >
        <MiniSite
          template={template}
          category={category}
          motion="none"
          showSuites
          channels={[]}
        />
      </div>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-bone/60 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
    </div>
  )
}

export function TemplateDemoModal({
  template,
  open,
  onClose,
}: {
  template: WebsiteTemplate | null
  open: boolean
  onClose: () => void
}) {
  const [device, setDevice] = useState<DeviceKind>('desktop')
  const [fullscreen, setFullscreen] = useState(false)
  const navigate = useNavigate()
  const { draft, setTemplate } = useProject()
  const category = template ? getCategory(template.bestFor[0]) : null

  useEffect(() => {
    if (open) {
      setDevice('desktop')
      setFullscreen(false)
    }
  }, [open, template?.id])

  if (!template || !category) return null

  const accentInk = readableOn(template.palette.accent)

  const useDesign = () => {
    setTemplate(template.id)
    navigate(draft.categoryId ? '/start?step=3' : '/start?step=1')
    onClose()
  }

  const customizeDesign = () => {
    setTemplate(template.id)
    navigate(draft.categoryId ? '/start?step=4' : '/start?step=1')
    onClose()
  }

  const handleClose = () => {
    if (fullscreen) {
      setFullscreen(false)
      return
    }
    onClose()
  }

  const samplePreview = (
    <DeviceFrame
      device={device}
      url={`${template.name.toLowerCase().replace(/[^a-z0-9]+/g, '')}.com`}
      widget={
        <PreviewWidget
          name={`${template.name} sample`}
          channels={['form', 'whatsapp', 'messenger']}
          accent={template.palette.accent}
          accentInk={accentInk}
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
        channels={['form', 'whatsapp', 'messenger']}
        motion="subtle"
        showSuites
        showSampleBadge
      />
    </DeviceFrame>
  )

  return (
    <>
      <Modal
        open={open}
        onClose={handleClose}
        size="wide"
        title={`${template.name} — ${template.style}`}
        description="A working sample rendered in your browser. Copy and imagery are illustrative."
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink/10 px-4 py-3 sm:px-6">
          <DeviceTabs device={device} onChange={setDevice} />
          <div className="flex items-center gap-3">
            <p className="hidden text-[11px] uppercase tracking-[0.16em] text-ink/40 sm:block">
              Preview only · sample content
            </p>
            <button
              type="button"
              onClick={() => setFullscreen(true)}
              className="inline-flex items-center gap-1.5 rounded-full border border-ink/15 px-3 py-1.5 text-[11.5px] font-semibold text-ink/70 transition-colors hover:border-clay/50 hover:text-ink"
            >
              <Maximize2 className="h-3.5 w-3.5" />
              Full screen
            </button>
          </div>
        </div>
        <div className="bg-cream/60 p-4 sm:p-8">{samplePreview}</div>
        <div className="flex flex-wrap items-center justify-between gap-4 px-4 py-5 sm:px-6">
          <div className="flex flex-wrap items-center gap-2">
            {[template.palette.bg, template.palette.surface, template.palette.accent, template.palette.ink].map(
              (color) => (
                <span
                  key={color}
                  className="h-6 w-6 rounded-full border border-ink/10"
                  style={{ background: color }}
                  title={color}
                />
              ),
            )}
            <span className="ml-2 text-[12px] text-ink/55">
              {template.style} · {template.tagline}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            <ButtonLink to="/designs" variant="secondary" size="sm" onClick={onClose}>
              All designs
            </ButtonLink>
            <Button variant="light" size="sm" onClick={customizeDesign}>
              <Palette className="h-3.5 w-3.5" />
              Customize
            </Button>
            <Button size="sm" onClick={useDesign}>
              Use this design
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </Modal>

      {fullscreen ? (
        <div className="fixed inset-0 z-[90] flex flex-col bg-bone/95 backdrop-blur-xl" role="dialog" aria-label="Full screen design preview">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink/10 px-4 py-3 sm:px-6">
            <div className="flex flex-wrap items-center gap-3">
              <DeviceTabs device={device} onChange={setDevice} />
              <p className="text-[11.5px] text-ink/45">
                {template.name} · {deviceDimensions[device].label} full screen
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="secondary" size="sm" onClick={customizeDesign}>
                <Palette className="h-3.5 w-3.5" />
                Customize
              </Button>
              <Button size="sm" onClick={useDesign}>
                Use this design
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Button>
              <button
                type="button"
                onClick={() => setFullscreen(false)}
                className="inline-flex items-center gap-1.5 rounded-full border border-ink/15 px-3 py-2 text-[11.5px] font-semibold text-ink/70 transition-colors hover:border-clay/50 hover:text-ink"
              >
                <Minimize2 className="h-3.5 w-3.5" />
                Exit
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 sm:p-8">
            <div className="mx-auto w-full max-w-[1400px]">{samplePreview}</div>
          </div>
        </div>
      ) : null}
    </>
  )
}

export function TemplateCard({
  template,
  onPreview,
}: {
  template: WebsiteTemplate
  onPreview: (template: WebsiteTemplate) => void
}) {
  const navigate = useNavigate()
  const { draft, setTemplate } = useProject()
  const category = getCategory(template.bestFor[0])
  const selected = draft.templateId === template.id

  const selectDesign = () => {
    setTemplate(template.id)
    navigate(draft.categoryId ? '/start?step=3' : '/start?step=1')
  }

  const customizeDesign = () => {
    setTemplate(template.id)
    navigate(draft.categoryId ? '/start?step=4' : '/start?step=1')
  }

  return (
    <article
      className={cx(
        'group relative flex flex-col overflow-hidden rounded-[20px] border bg-card transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_32px_70px_-40px_rgba(0,0,0,0.9),0_0_50px_-28px_rgba(56,107,255,0.5)]',
        selected ? 'border-clay/70' : 'border-ink/10 hover:border-ink/25',
      )}
    >
      <button
        type="button"
        onClick={() => onPreview(template)}
        className="relative block w-full text-left"
        aria-label={`Preview ${template.name} demo`}
      >
        <TemplateThumb template={template} category={category} />
        <span className="absolute left-3 top-3 rounded-full border border-ink/10 bg-bone/85 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-ink/75 backdrop-blur">
          {template.style}
        </span>
        {selected ? (
          <span className="gradient-brand absolute right-3 top-3 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-white">
            <Check className="h-3 w-3" strokeWidth={3} />
            Selected
          </span>
        ) : (
          <span className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-full border border-ink/10 bg-bone/90 px-3 py-1.5 text-[11px] font-semibold text-ink opacity-0 shadow-sm backdrop-blur transition-opacity duration-300 group-hover:opacity-100">
            <Eye className="h-3.5 w-3.5" />
            Preview demo
          </span>
        )}
      </button>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-[17px] font-semibold tracking-tight text-ink">{template.name}</h3>
            <p className="mt-0.5 text-[12px] text-ink/45">{template.tagline}</p>
          </div>
          <div className="mt-1 flex gap-1">
            {[template.palette.accent, template.palette.accentAlt, template.palette.bg].map((color) => (
              <span
                key={color}
                className="h-3 w-3 rounded-full border border-ink/10"
                style={{ background: color }}
                aria-hidden="true"
              />
            ))}
          </div>
        </div>
        <p className="mt-3 line-clamp-2 text-[12.5px] leading-relaxed text-ink/55">{template.description}</p>
        <div className="mt-auto flex flex-wrap items-center gap-2 pt-5">
          <Button variant="secondary" size="sm" onClick={() => onPreview(template)}>
            <Eye className="h-3.5 w-3.5" />
            Preview
          </Button>
          <Button variant="primary" size="sm" onClick={selectDesign}>
            {selected ? 'Continue with this' : 'Select design'}
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="sm" onClick={customizeDesign}>
            <Palette className="h-3.5 w-3.5" />
            Customize
          </Button>
        </div>
      </div>
    </article>
  )
}

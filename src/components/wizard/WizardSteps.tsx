import { useEffect, useRef, useState, type ReactNode } from 'react'
import {
  AlertTriangle,
  ArrowUpRight,
  Check,
  CheckCircle2,
  Download,
  FileText,
  Loader2,
  Lock,
  Mail,
  Paperclip,
  Pencil,
  RotateCcw,
  Send,
  Upload,
  X,
} from 'lucide-react'
import { useProject } from '../../context/ProjectContext'
import { categories, getCategory } from '../../data/categories'
import { getTemplate, templates } from '../../data/templates'
import {
  brandPresets,
  channels,
  featureGroups,
  featureOptions,
  fontPairings,
  formatBytes,
  isHex,
  motionOptions,
  pageOptions,
  readableOn,
  channelLabel,
  featureLabel,
  pageLabel,
} from '../../data/options'
import { briefFileName, downloadBrief, fontPairingName } from '../../lib/brief'
import { downloadBriefPdf } from '../../lib/pdfBrief'
import type { ConfirmationState } from '../../lib/submit'
import { site } from '../../data/site'
import type { CategoryId, WebsiteTemplate } from '../../types'
import { OptionCard } from '../ui/OptionCard'
import { TemplateThumb, TemplateDemoModal } from '../templates/TemplateCard'
import { StepHeading, Field, inputClass } from './StepHeading'
import { getAttachmentPreview, useAssetUpload } from './useAssetUpload'
import { logoAccept, referenceAccept, uploadLimits } from '../../lib/uploads'
import { ChannelIcon } from '../ui/ChannelIcon'
import { cx } from '../../lib/cx'

const recommendedPages: Record<CategoryId, string[]> = {
  hotel: ['about', 'services', 'portfolio'],
  restaurant: ['about', 'services', 'portfolio'],
  corporate: ['about', 'services', 'testimonials'],
  clinic: ['about', 'services', 'faq'],
  salon: ['about', 'services', 'portfolio'],
  realestate: ['about', 'services', 'portfolio'],
  ecommerce: ['about', 'services', 'faq'],
  general: ['about', 'services', 'portfolio'],
}

export function StepBusiness() {
  const { draft, setCategory } = useProject()

  return (
    <>
      <StepHeading
        step={1}
        kicker="Business type"
        title="What kind of business is this for?"
        description="Your category sets the starting structure, sample content and the designs we recommend. Choose the closest fit — you can refine everything later."
      />
      <div className="grid gap-3 sm:grid-cols-2">
        {categories.map((category) => {
          const Icon = category.icon
          const active = draft.categoryId === category.id
          return (
            <button
              key={category.id}
              type="button"
              onClick={() => setCategory(category.id)}
              aria-pressed={active}
              className={cx(
                'group flex items-center gap-4 rounded-2xl border p-3 text-left transition-all duration-300',
                active
                  ? 'border-clay/60 bg-card shadow-[0_18px_40px_-30px_rgba(56,107,255,0.7)]'
                  : 'border-ink/10 bg-ink/[0.03] hover:border-ink/25 hover:bg-ink/[0.06]',
              )}
            >
              <div className="relative h-[74px] w-[74px] shrink-0 overflow-hidden rounded-xl">
                <img src={category.image} alt="" className="h-full w-full object-cover" loading="lazy" />
                <span className="absolute inset-0 bg-bone/25" />
                <span className="absolute bottom-1.5 left-1.5 grid h-6 w-6 place-items-center rounded-full bg-bone/90 text-ink">
                  <Icon className="h-3.5 w-3.5" />
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-semibold tracking-tight text-ink">{category.name}</p>
                <p className="mt-1 line-clamp-2 text-[11.5px] leading-relaxed text-ink/45">
                  {category.description}
                </p>
              </div>
              <span
                className={cx(
                  'grid h-5 w-5 shrink-0 place-items-center rounded-full border transition-all',
                  active ? 'border-clay bg-clay text-white' : 'border-ink/15 text-transparent',
                )}
                aria-hidden="true"
              >
                <Check className="h-3 w-3" strokeWidth={3} />
              </span>
            </button>
          )
        })}
      </div>
    </>
  )
}

export function StepDesign() {
  const { draft, setTemplate } = useProject()
  const [preview, setPreview] = useState<WebsiteTemplate | null>(null)
  const category = getCategory(draft.categoryId)
  const ordered = category
    ? [...templates].sort((a, b) => {
        const aFit = a.bestFor.includes(category.id) ? 0 : 1
        const bFit = b.bestFor.includes(category.id) ? 0 : 1
        return aFit - bFit
      })
    : templates

  return (
    <>
      <StepHeading
        step={2}
        kicker="Website design"
        title="Choose your starting direction."
        description="Each direction is a complete visual language, not a skin. Preview the sample, then pick the one closest to the feeling you want. Colours and type are refined in the next steps."
      />
      <div className="grid gap-4 sm:grid-cols-2">
        {ordered.map((template) => {
          const active = draft.templateId === template.id
          const fits = category ? template.bestFor.includes(category.id) : false
          return (
            <div
              key={template.id}
              className={cx(
                'group overflow-hidden rounded-2xl border bg-card transition-all duration-300',
                active ? 'border-clay/60 shadow-[0_18px_40px_-30px_rgba(56,107,255,0.7)]' : 'border-ink/10 hover:border-ink/25',
              )}
            >
              <button
                type="button"
                onClick={() => setPreview(template)}
                className="relative block w-full text-left"
                aria-label={`Preview ${template.name} design`}
              >
                <TemplateThumb
                  template={template}
                  category={category ?? getCategory(template.bestFor[0])}
                />
                <span className="absolute left-2.5 top-2.5 rounded-full bg-bone/90 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.14em] text-ink/60 backdrop-blur">
                  {template.style}
                </span>
                {fits ? (
                  <span className="gradient-brand absolute right-2.5 top-2.5 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em] text-white">
                    Good fit
                  </span>
                ) : null}
              </button>
              <div className="flex items-center justify-between gap-3 p-3.5">
                <div className="min-w-0">
                  <p className="truncate text-[13.5px] font-semibold text-ink">{template.name}</p>
                  <p className="mt-0.5 truncate text-[10.5px] text-ink/40">{template.tagline}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPreview(template)}
                    className="rounded-full border border-ink/15 px-2.5 py-1.5 text-[10.5px] font-semibold text-ink/60 transition-colors hover:border-ink/35 hover:text-ink"
                  >
                    Preview
                  </button>
                  <button
                    type="button"
                    onClick={() => setTemplate(template.id)}
                    aria-pressed={active}
                    className={cx(
                      'inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-[10.5px] font-semibold transition-colors',
                      active ? 'bg-clay text-white' : 'bg-ink/5 text-ink hover:bg-ink/10',
                    )}
                  >
                    {active ? <Check className="h-3 w-3" /> : null}
                    {active ? 'Selected' : 'Select'}
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
      <p className="mt-5 text-[11px] leading-relaxed text-ink/35">
        Choosing a design also applies its suggested palette and typography. You can override both in
        the next step.
      </p>
      <TemplateDemoModal template={preview} open={Boolean(preview)} onClose={() => setPreview(null)} />
    </>
  )
}

export function StepPages() {
  const { draft, togglePage } = useProject()
  const recommended = draft.categoryId ? recommendedPages[draft.categoryId] : []

  return (
    <>
      <StepHeading
        step={3}
        kicker="Website pages"
        title="Which pages does the site need?"
        description="Start with the essentials. We can add or remove sections during scoping — this tells us the shape of the site and the navigation."
      />
      <div className="grid gap-3 sm:grid-cols-2">
        {pageOptions.map((page) => {
          const active = draft.pages.includes(page.id)
          const locked = Boolean(page.locked)
          const isRecommended = recommended.includes(page.id)
          return (
            <button
              key={page.id}
              type="button"
              onClick={() => !locked && togglePage(page.id)}
              aria-pressed={active}
              disabled={locked}
              className={cx(
                'relative flex items-start gap-3 rounded-2xl border p-4 text-left transition-all duration-300',
                active
                  ? 'border-clay/60 bg-card'
                  : 'border-ink/10 bg-ink/[0.03] hover:border-ink/25 hover:bg-ink/[0.06]',
                locked && 'cursor-default',
              )}
            >
              <span
                className={cx(
                  'mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md border transition-colors',
                  active ? 'border-clay bg-clay text-white' : 'border-ink/15 text-transparent',
                )}
                aria-hidden="true"
              >
                {locked ? <Lock className="h-3 w-3" /> : <Check className="h-3 w-3" strokeWidth={3} />}
              </span>
              <span className="min-w-0">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="text-[13.5px] font-semibold text-ink">{page.label}</span>
                  {locked ? (
                    <span className="rounded-full bg-ink/5 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.1em] text-ink/35">
                      Always included
                    </span>
                  ) : null}
                  {isRecommended && !locked ? (
                    <span className="rounded-full bg-clay/10 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.1em] text-clay">
                      Recommended
                    </span>
                  ) : null}
                </span>
                <span className="mt-1 block text-[11.5px] leading-relaxed text-ink/45">
                  {page.description}
                </span>
              </span>
            </button>
          )
        })}
      </div>
      <div className="mt-5 flex items-center justify-between gap-3 rounded-xl border border-ink/10 bg-ink/[0.03] px-4 py-3">
        <p className="text-[11.5px] text-ink/45">
          {draft.pages.length} pages selected. Home and Contact are always included.
        </p>
        <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink/30">Step 03</span>
      </div>
    </>
  )
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (value: string) => void
}) {
  const [text, setText] = useState(value)

  useEffect(() => {
    setText(value)
  }, [value])

  const valid = isHex(text)

  return (
    <div>
      <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-ink/50">{label}</p>
      <div className="flex items-center gap-2">
        <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl border border-ink/12">
          <span className="absolute inset-0" style={{ background: valid ? text : value }} />
          <input
            type="color"
            value={valid ? text : value}
            onChange={(event) => {
              setText(event.target.value)
              onChange(event.target.value)
            }}
            aria-label={`${label} colour picker`}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          />
        </span>
        <input
          value={text}
          onChange={(event) => {
            const next = event.target.value
            setText(next)
            if (isHex(next)) onChange(next)
          }}
          onBlur={() => {
            if (!isHex(text)) setText(value)
          }}
          aria-label={`${label} hex value`}
          aria-invalid={!valid}
          spellCheck={false}
          className={cx(inputClass, 'h-11 py-0 font-mono text-[12.5px] uppercase', !valid && 'border-danger/70')}
        />
      </div>
      {!valid ? <p className="mt-1 text-[10.5px] text-danger">Use a 6-digit hex value, e.g. #386BFF.</p> : null}
    </div>
  )
}

export function StepBranding() {
  const { draft, updateBrand } = useProject()
  const category = getCategory(draft.categoryId)
  const accentInk = readableOn(draft.brand.primary)
  const logoRef = useRef<HTMLInputElement>(null)
  const { uploading, error, uploadFiles, removeFile } = useAssetUpload()
  const logo = draft.details.attachments.find((file) => file.kind === 'logo')
  const logoPreview = logo ? getAttachmentPreview(logo.id) : undefined

  return (
    <>
      <StepHeading
        step={4}
        kicker="Colours & branding"
        title="Make the direction yours."
        description="Add the business name and choose the palette and typography. These become the default brand tokens for the design."
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Business name" hint="Shown in the header">
          <input
            value={draft.brand.businessName}
            onChange={(event) => updateBrand({ businessName: event.target.value })}
            maxLength={60}
            placeholder={category?.sample.brand ?? 'Your business'}
            className={inputClass}
            autoComplete="organization"
          />
        </Field>
        <Field label="Tagline or short description" hint={`${draft.brand.tagline.length}/100`}>
          <input
            value={draft.brand.tagline}
            onChange={(event) => updateBrand({ tagline: event.target.value.slice(0, 100) })}
            placeholder="A quiet retreat on the northern coast"
            className={inputClass}
          />
        </Field>
      </div>

      <div className="mt-8">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink/50">Brand logo</p>
          <span className="text-[10.5px] text-ink/35">Optional · PNG, JPG, WebP · up to 10 MB</span>
        </div>

        {logo ? (
          <div className="mt-2.5 flex items-center gap-4 rounded-2xl border border-ink/10 bg-card p-4">
            <div className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-xl border border-ink/10 bg-ink/[0.04]">
              {logoPreview ? (
                <img src={logoPreview} alt="Uploaded logo preview" className="h-full w-full object-contain p-1.5" />
              ) : (
                <Paperclip className="h-5 w-5 text-ink/30" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[12.5px] font-medium text-ink">{logo.name}</p>
              <p
                className={cx(
                  'mt-0.5 text-[10.5px]',
                  logo.status === 'error' ? 'text-danger' : 'text-ink/40',
                )}
              >
                {logo.status === 'uploading'
                  ? 'Uploading…'
                  : logo.status === 'error'
                    ? logo.error
                    : `${formatBytes(logo.size)} · stored securely with your brief`}
              </p>
            </div>
            <button
              type="button"
              onClick={() => removeFile(logo.id)}
              aria-label={`Remove ${logo.name}`}
              className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-ink/35 transition-colors hover:bg-ink/5 hover:text-ink"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => logoRef.current?.click()}
            disabled={uploading}
            className="mt-2.5 flex w-full items-center gap-4 rounded-2xl border border-dashed border-ink/20 bg-ink/[0.03] p-4 text-left transition-colors hover:border-clay/50 disabled:opacity-60"
          >
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-ink/10 bg-card">
              {uploading ? (
                <Loader2 className="h-5 w-5 animate-spin text-ink/40" />
              ) : (
                <Upload className="h-5 w-5 text-ink/35" />
              )}
            </span>
            <span>
              <span className="block text-[12px] font-semibold text-ink/70">
                {uploading ? 'Uploading your logo…' : 'Upload your logo'}
              </span>
              <span className="mt-0.5 block text-[10.5px] text-ink/40">
                Transparent PNG works best. We use it as the starting point for the header mark.
              </span>
            </span>
          </button>
        )}

        <input
          ref={logoRef}
          type="file"
          accept={logoAccept}
          className="sr-only"
          onChange={(event) => {
            void uploadFiles(event.target.files ?? [], 'logo')
            event.currentTarget.value = ''
          }}
        />
        {error ? <p className="mt-2 text-[11px] text-danger">{error}</p> : null}
      </div>

      <div className="mt-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink/50">Preset palettes</p>
        <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
          {brandPresets.map((preset) => {
            const active =
              draft.brand.primary.toLowerCase() === preset.primary &&
              draft.brand.accent.toLowerCase() === preset.accent
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() =>
                  updateBrand({ primary: preset.primary, accent: preset.accent, fontKey: preset.fontKey })
                }
                aria-pressed={active}
                className={cx(
                  'flex items-center gap-3 rounded-xl border p-3 text-left transition-all duration-300',
                  active ? 'border-clay/60 bg-card' : 'border-ink/10 bg-ink/[0.03] hover:border-ink/25 hover:bg-ink/[0.06]',
                )}
              >
                <span className="flex gap-1">
                  {[preset.primary, preset.accent, '#F4F7FF'].map((color) => (
                    <span
                      key={color}
                      className="h-7 w-7 rounded-full border border-ink/10"
                      style={{ background: color }}
                    />
                  ))}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[12.5px] font-semibold text-ink">{preset.name}</span>
                  <span className="mt-0.5 block text-[10px] text-ink/40">
                    {fontPairings.find((pairing) => pairing.id === preset.fontKey)?.name}
                  </span>
                </span>
                {active ? <Check className="h-4 w-4 shrink-0 text-ink" strokeWidth={2.5} /> : null}
              </button>
            )
          })}
        </div>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <ColorField label="Primary" value={draft.brand.primary} onChange={(value) => updateBrand({ primary: value })} />
        <ColorField label="Accent" value={draft.brand.accent} onChange={(value) => updateBrand({ accent: value })} />
      </div>

      <div className="mt-6 rounded-2xl border border-ink/10 bg-card p-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-ink/35">Brand preview</p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <span
            className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-[12px] font-semibold"
            style={{ background: draft.brand.primary, color: accentInk }}
          >
            Book with us
            <ArrowUpRight className="h-3.5 w-3.5" />
          </span>
          <span className="h-9 w-9 rounded-full border border-ink/10" style={{ background: draft.brand.accent }} />
          <div className="min-w-0">
            <p className={cx('truncate text-[16px] leading-tight', draft.brand.fontKey === 'grotesk' ? 'font-grotesk font-medium' : draft.brand.fontKey === 'serif' ? 'display' : 'font-semibold')}>
              {draft.brand.businessName.trim() || category?.sample.brand || 'Your business'}
            </p>
            <p className="mt-0.5 truncate text-[10.5px] text-ink/40">
              {draft.brand.tagline.trim() || category?.sample.eyebrow || 'Tagline preview'}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink/50">Typography</p>
        <div className="mt-3 grid gap-2.5 sm:grid-cols-3">
          {fontPairings.map((pairing) => {
            const active = draft.brand.fontKey === pairing.id
            return (
              <button
                key={pairing.id}
                type="button"
                onClick={() => updateBrand({ fontKey: pairing.id })}
                aria-pressed={active}
                className={cx(
                  'rounded-xl border p-3.5 text-left transition-all duration-300',
                  active ? 'border-clay/60 bg-card' : 'border-ink/10 bg-ink/[0.03] hover:border-ink/25 hover:bg-ink/[0.06]',
                )}
              >
                <span
                  className={cx(
                    'block text-[30px] leading-none text-ink',
                    pairing.id === 'serif' && 'display',
                    pairing.id === 'grotesk' && 'font-grotesk font-medium',
                    pairing.id === 'sans' && 'font-semibold',
                  )}
                >
                  Aa
                </span>
                <span className="mt-3 block text-[12px] font-semibold text-ink">{pairing.name}</span>
                <span className="mt-0.5 block text-[10px] text-ink/40">{pairing.sample}</span>
                <span className="mt-2 block text-[10.5px] leading-relaxed text-ink/45">{pairing.description}</span>
              </button>
            )
          })}
        </div>
      </div>
    </>
  )
}

export function StepFeatures() {
  const { draft, toggleFeature } = useProject()

  return (
    <>
      <StepHeading
        step={5}
        kicker="Features & functionality"
        title="What should the site do?"
        description="Choose the functionality you need now. Everything here is planned into the build; more can be added later as the business grows."
      />
      <div className="space-y-7">
        {featureGroups.map((group) => {
          const options = featureOptions.filter((feature) => feature.group === group)
          return (
            <div key={group}>
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-ink/45">{group}</p>
                <span className="text-[10px] text-ink/30">
                  {options.filter((option) => draft.features.includes(option.id)).length} selected
                </span>
              </div>
              <div className="mt-2.5 grid gap-2.5 sm:grid-cols-2">
                {options.map((feature) => {
                  const Icon = feature.icon
                  const active = draft.features.includes(feature.id)
                  return (
                    <OptionCard key={feature.id} selected={active} onClick={() => toggleFeature(feature.id)}>
                      <div className="flex items-start gap-3 pr-6">
                        <span
                          className={cx(
                            'grid h-8 w-8 shrink-0 place-items-center rounded-lg transition-colors',
                            active ? 'bg-clay text-white' : 'bg-ink/5 text-ink/55',
                          )}
                        >
                          <Icon className="h-4 w-4" strokeWidth={1.8} />
                        </span>
                        <span>
                          <span className="block text-[12.5px] font-semibold text-ink">{feature.label}</span>
                          <span className="mt-0.5 block text-[10.5px] leading-relaxed text-ink/45">
                            {feature.description}
                          </span>
                        </span>
                      </div>
                    </OptionCard>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
      <p className="mt-6 text-[11px] leading-relaxed text-ink/35">
        Optional. Select nothing if you are unsure — we will recommend a sensible baseline for your
        business type.
      </p>
    </>
  )
}

export function StepCommunication() {
  const { draft, toggleChannel } = useProject()

  return (
    <>
      <StepHeading
        step={6}
        kicker="Communication & integrations"
        title="How should customers reach you?"
        description="Choose the channels you want on the site. We will plan the links, forms and widgets during the build — nothing is connected automatically."
      />
      <div className="grid gap-2.5 sm:grid-cols-2">
        {channels.map((channel) => {
          const active = draft.channels.includes(channel.id)
          return (
            <OptionCard key={channel.id} selected={active} onClick={() => toggleChannel(channel.id)}>
              <div className="flex items-start gap-3 pr-6">
                <span
                  className={cx(
                    'grid h-9 w-9 shrink-0 place-items-center rounded-full transition-colors',
                    active ? 'bg-clay text-white' : 'bg-ink/5 text-ink/55',
                  )}
                >
                  <ChannelIcon id={channel.id} />
                </span>
                <span className="min-w-0">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="text-[12.5px] font-semibold text-ink">{channel.label}</span>
                    <span
                      className={cx(
                        'rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.08em]',
                        channel.note === 'Add-on'
                          ? 'bg-clay/10 text-clay'
                          : 'bg-ink/5 text-ink/40',
                      )}
                    >
                      {channel.note}
                    </span>
                  </span>
                  <span className="mt-1 block text-[10.5px] leading-relaxed text-ink/45">
                    {channel.description}
                  </span>
                </span>
              </div>
            </OptionCard>
          )
        })}
      </div>
      <div className="mt-5 rounded-xl border border-ink/10 bg-ink/[0.03] px-4 py-3 text-[11px] leading-relaxed text-ink/45">
        {draft.channels.length
          ? `${draft.channels.length} channel${draft.channels.length > 1 ? 's' : ''} selected. These appear in the live preview's contact widget and CTA.`
          : 'No channels selected yet. At least one contact route is recommended for every business.'}
      </div>
    </>
  )
}

export function StepMotion() {
  const { draft, setMotion } = useProject()

  return (
    <>
      <StepHeading
        step={7}
        kicker="Animations & effects"
        title="How should the site move?"
        description="Motion sets the pace of the experience. Every option respects a visitor's reduced-motion preference automatically."
      />
      <div className="grid gap-3 sm:grid-cols-2">
        {motionOptions.map((option) => {
          const active = draft.motion === option.id
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => setMotion(option.id)}
              aria-pressed={active}
              className={cx(
                'overflow-hidden rounded-2xl border text-left transition-all duration-300',
                active ? 'border-clay/60 bg-card' : 'border-ink/10 bg-ink/[0.03] hover:border-ink/25 hover:bg-ink/[0.06]',
              )}
            >
              <div className="relative h-24 overflow-hidden bg-cream/80">
                <div className="absolute inset-0 blueprint opacity-40" />
                <div className="absolute inset-x-4 bottom-4 flex items-end gap-2">
                  <span
                    className={cx(
                      'h-8 w-16 rounded-md bg-clay/70',
                      option.id === 'cinematic' && 'animate-float-slow',
                      option.id === 'subtle' && 'animate-soft-pulse',
                    )}
                  />
                  <span
                    className={cx(
                      'h-4 w-10 rounded-md bg-clay/70',
                      option.id === 'playful' && 'animate-bounce',
                      option.id === 'cinematic' && 'animate-float-slow [animation-delay:0.6s]',
                    )}
                  />
                  <span
                    className={cx(
                      'h-12 w-6 rounded-md bg-cyan/25',
                      option.id === 'cinematic' && 'animate-float-slow [animation-delay:0.3s]',
                      option.id === 'playful' && 'animate-bounce [animation-delay:0.15s]',
                    )}
                  />
                </div>
                <span className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full border border-ink/10 bg-bone/80 px-2 py-1 text-[9px] font-bold uppercase tracking-[0.1em] text-ink/50 backdrop-blur">
                  {option.tempo}
                </span>
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[13px] font-semibold text-ink">{option.label}</p>
                  {active ? (
                    <span className="grid h-5 w-5 place-items-center rounded-full bg-clay text-white">
                      <Check className="h-3 w-3" strokeWidth={3} />
                    </span>
                  ) : null}
                </div>
                <p className="mt-1.5 text-[11px] leading-relaxed text-ink/45">{option.description}</p>
              </div>
            </button>
          )
        })}
      </div>
      <p className="mt-5 text-[11px] leading-relaxed text-ink/35">
        The preview replays motion when you switch options, so you can compare the feel.
      </p>
    </>
  )
}

export function StepDetails({ showErrors }: { showErrors: boolean }) {
  const { draft, updateDetails } = useProject()
  const fileRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const { uploading, error: uploadError, uploadFiles, removeFile } = useAssetUpload()

  const details = draft.details
  const references = details.attachments.filter((file) => file.kind === 'reference')
  const nameError = showErrors && !details.contactName.trim() ? 'Add your name so we know who to reply to.' : undefined
  const emailError =
    showErrors && !details.email.trim()
      ? 'Add an email address.'
      : showErrors && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(details.email.trim())
        ? 'Check the email address.'
        : undefined

  const collect = (files: FileList | null) => {
    if (!files?.length) return
    void uploadFiles(files, 'reference')
    if (fileRef.current) fileRef.current.value = ''
  }

  return (
    <>
      <StepHeading
        step={8}
        kicker="Business details & assets"
        title="The practical details."
        description="These details help us reply with a relevant scope. Only your name and email are required at this stage."
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Your name" required error={nameError}>
          <input
            value={details.contactName}
            onChange={(event) => updateDetails({ contactName: event.target.value })}
            className={cx(inputClass, nameError && 'border-danger/70')}
            placeholder="Alex Reyes"
            autoComplete="name"
          />
        </Field>
        <Field label="Email" required error={emailError}>
          <input
            type="email"
            value={details.email}
            onChange={(event) => updateDetails({ email: event.target.value })}
            className={cx(inputClass, emailError && 'border-danger/70')}
            placeholder="you@business.com"
            autoComplete="email"
          />
        </Field>
        <Field label="Phone" hint="Optional">
          <input
            value={details.phone}
            onChange={(event) => updateDetails({ phone: event.target.value })}
            className={inputClass}
            placeholder="+63 900 000 0000"
            autoComplete="tel"
          />
        </Field>
        <Field label="Location" hint="Optional">
          <input
            value={details.location}
            onChange={(event) => updateDetails({ location: event.target.value })}
            className={inputClass}
            placeholder="City, country"
          />
        </Field>
      </div>

      <div className="mt-4">
        <Field label="Existing website" hint="Optional">
          <input
            value={details.existingUrl}
            onChange={(event) => updateDetails({ existingUrl: event.target.value })}
            className={inputClass}
            placeholder="https://"
            inputMode="url"
          />
        </Field>
      </div>

      <div className="mt-4">
        <Field label="About the business" hint="What should we understand before we reply?">
          <textarea
            value={details.about}
            onChange={(event) => updateDetails({ about: event.target.value })}
            rows={4}
            className={cx(inputClass, 'resize-none')}
            placeholder="Who you serve, what makes you different, what needs to change online."
          />
        </Field>
      </div>

      <div className="mt-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink/50">Assets</p>
        <div
          onDragOver={(event) => {
            event.preventDefault()
            setDragging(true)
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => {
            event.preventDefault()
            setDragging(false)
            collect(event.dataTransfer.files)
          }}
          className={cx(
            'mt-2.5 rounded-2xl border border-dashed p-5 text-center transition-colors',
            dragging ? 'border-clay bg-clay/5' : 'border-ink/20 bg-ink/[0.03]',
          )}
        >
          <Upload className="mx-auto h-5 w-5 text-ink/30" />
          <p className="mt-2 text-[12px] font-semibold text-ink/65">
            Add photography, floor plans or a brand PDF
          </p>
          <p className="mt-1 text-[10.5px] text-ink/40">
            PNG, JPG, WebP or PDF · up to 10 MB each · {uploadLimits.maxFiles} files per brief
          </p>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="mt-3 inline-flex items-center gap-2 rounded-full border border-ink/15 bg-card px-4 py-2 text-[11px] font-semibold text-ink transition-colors hover:border-ink/40 disabled:opacity-60"
          >
            {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
            {uploading ? 'Uploading…' : 'Choose files'}
          </button>
          <input
            ref={fileRef}
            type="file"
            multiple
            accept={referenceAccept}
            onChange={(event) => collect(event.target.files)}
            className="sr-only"
          />
        </div>

        {uploadError ? <p className="mt-2 text-[11px] text-danger">{uploadError}</p> : null}

        {references.length ? (
          <ul className="mt-3 space-y-2">
            {references.map((file) => (
              <li
                key={file.id}
                className="flex items-center gap-3 rounded-xl border border-ink/10 bg-card px-3 py-2.5"
              >
                {file.status === 'uploading' ? (
                  <Loader2 className="h-4 w-4 shrink-0 animate-spin text-ink/40" />
                ) : file.status === 'error' ? (
                  <AlertTriangle className="h-4 w-4 shrink-0 text-danger" />
                ) : (
                  <Paperclip className="h-4 w-4 shrink-0 text-ink/30" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[12px] font-medium text-ink">{file.name}</p>
                  <p
                    className={cx(
                      'text-[10px]',
                      file.status === 'error' ? 'text-danger' : 'text-ink/35',
                    )}
                  >
                    {file.status === 'uploading'
                      ? `${formatBytes(file.size)} · uploading…`
                      : file.status === 'error'
                        ? file.error
                        : `${formatBytes(file.size)} · uploaded securely`}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => removeFile(file.id)}
                  aria-label={`Remove ${file.name}`}
                  className="grid h-7 w-7 place-items-center rounded-full text-ink/35 transition-colors hover:bg-ink/5 hover:text-ink"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        ) : null}

        <p className="mt-3 rounded-xl bg-ink/[0.04] px-4 py-3 text-[10.5px] leading-relaxed text-ink/55">
          Files are uploaded with your brief and are only visible to the BRIX Studio team. Prefer a
          link? Add one below instead.
        </p>
      </div>

      <div className="mt-4">
        <Field label="Links to existing assets" hint="Drive, Dropbox, Instagram — optional">
          <textarea
            value={details.assetLinks}
            onChange={(event) => updateDetails({ assetLinks: event.target.value })}
            rows={3}
            className={cx(inputClass, 'resize-none')}
            placeholder="https://drive.google.com/..."
          />
        </Field>
      </div>
    </>
  )
}

function SummaryBlock({
  title,
  onEdit,
  children,
}: {
  title: string
  onEdit: () => void
  children: ReactNode
}) {
  return (
    <div className="rounded-2xl border border-ink/10 bg-card p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-ink/40">{title}</p>
        <button
          type="button"
          onClick={onEdit}
          className="inline-flex items-center gap-1 text-[10.5px] font-semibold text-ink/45 transition-colors hover:text-ink"
        >
          <Pencil className="h-3 w-3" />
          Edit
        </button>
      </div>
      <div className="mt-3">{children}</div>
    </div>
  )
}

function ChipList({ items, empty }: { items: string[]; empty: string }) {
  if (!items.length) return <p className="text-[11.5px] text-ink/35">{empty}</p>
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <span
          key={item}
          className="rounded-full bg-ink/5 px-2.5 py-1 text-[10.5px] font-medium text-ink/60"
        >
          {item}
        </span>
      ))}
    </div>
  )
}

export function StepReview({
  goToStep,
  canSend,
  uploadsPending,
  sendStatus,
  sendError,
  sentAt,
  isSent,
  confirmation,
  onSend,
  emailOpened,
  onEmail,
}: {
  goToStep: (step: number) => void
  canSend: boolean
  uploadsPending: boolean
  sendStatus: 'idle' | 'sending' | 'sent' | 'error'
  sendError: { code: string; message: string } | null
  sentAt: string | null
  isSent: boolean
  confirmation: ConfirmationState | null
  onSend: () => void
  emailOpened: boolean
  onEmail: () => void
}) {
  const { draft, reset } = useProject()
  const [confirmReset, setConfirmReset] = useState(false)
  const [pdfState, setPdfState] = useState<'idle' | 'working' | 'fallback'>('idle')
  const category = getCategory(draft.categoryId)
  const template = getTemplate(draft.templateId)
  const motion = motionOptions.find((option) => option.id === draft.motion)
  const businessName = draft.brand.businessName.trim() || 'Unnamed business'
  const sendErrorGuidance: Record<string, string> = {
    email_not_configured:
      'Email delivery is not switched on for this deployment yet. Download the brief or use the email fallback — your answers are safe.',
    delivery_failed: 'The email could not be delivered just now. Try again, or use the email fallback.',
    rate_limited: 'Several attempts were made in a short time. Wait a few minutes, or use the email fallback.',
    invalid_request: 'Some details did not pass the server checks. Review your contact details and try again.',
    timeout: 'The server did not respond in time. Check your connection and try again.',
    network_error: 'The request could not reach the server. Check your connection, or use the email fallback.',
    duplicate_in_progress: 'This request is already being sent. Give it a moment, then check again.',
  }
  const sentLabel = sentAt
    ? new Date(sentAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
    : null

  const handleDownload = async () => {
    if (pdfState === 'working') return
    setPdfState('working')
    try {
      await downloadBriefPdf(draft)
      setPdfState('idle')
    } catch {
      /* Fall back to the plain-text brief so the customer still leaves with their answers. */
      downloadBrief(draft)
      setPdfState('fallback')
    }
  }

  return (
    <>
      <StepHeading
        step={9}
        kicker="Review & submit"
        title="Your brief is ready."
        description="Check the direction and details below, then send the request straight to the studio. You'll get a reply at the email address you provided."
      />

      {!canSend ? (
        <div className="mb-5 flex items-start gap-3 rounded-2xl border border-clay/25 bg-clay/5 px-4 py-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-clay" />
          {uploadsPending ? (
            <div className="text-[11.5px] leading-relaxed text-ink/65">
              Your files are still uploading. Sending unlocks as soon as they finish — you can also
              remove any file that failed in step 8.
            </div>
          ) : (
            <div className="text-[11.5px] leading-relaxed text-ink/65">
              Add your name and a valid email in step 8 before sending the brief.{' '}
              <button
                type="button"
                onClick={() => goToStep(8)}
                className="font-semibold underline underline-offset-2"
              >
                Go to business details
              </button>
            </div>
          )}
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2">
        <SummaryBlock title="Business type" onEdit={() => goToStep(1)}>
          <p className="text-[14px] font-semibold text-ink">{category?.name ?? 'Not selected'}</p>
          <p className="mt-1 text-[11px] text-ink/40">
            {category?.tagline ?? 'Choose a category to shape the site.'}
          </p>
        </SummaryBlock>

        <SummaryBlock title="Design direction" onEdit={() => goToStep(2)}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[14px] font-semibold text-ink">{template?.name ?? 'Not selected'}</p>
              <p className="mt-1 text-[11px] text-ink/40">{template?.style ?? 'Choose a starting design.'}</p>
            </div>
            {template ? (
              <div className="flex gap-1">
                {[draft.brand.primary, draft.brand.accent, template.palette.bg].map((color) => (
                  <span
                    key={color}
                    className="h-5 w-5 rounded-full border border-ink/10"
                    style={{ background: color }}
                  />
                ))}
              </div>
            ) : null}
          </div>
        </SummaryBlock>

        <SummaryBlock title="Brand" onEdit={() => goToStep(4)}>
          <p className={cx('text-[14px] font-semibold text-ink', draft.brand.fontKey === 'serif' && 'display' )}>
            {businessName}
          </p>
          <p className="mt-1 text-[11px] text-ink/40">
            {fontPairingName(draft.brand.fontKey)} · {draft.brand.primary} / {draft.brand.accent}
          </p>
          {draft.brand.tagline ? (
            <p className="mt-2 line-clamp-2 text-[11px] text-ink/45">{draft.brand.tagline}</p>
          ) : null}
        </SummaryBlock>

        <SummaryBlock title="Motion" onEdit={() => goToStep(7)}>
          <p className="text-[14px] font-semibold text-ink">{motion?.label ?? 'Subtle & smooth'}</p>
          <p className="mt-1 text-[11px] leading-relaxed text-ink/40">{motion?.description}</p>
        </SummaryBlock>

        <SummaryBlock title="Pages" onEdit={() => goToStep(3)}>
          <ChipList items={draft.pages.map(pageLabel)} empty="No pages selected." />
        </SummaryBlock>

        <SummaryBlock title="Features" onEdit={() => goToStep(5)}>
          <ChipList items={draft.features.map(featureLabel)} empty="No extra functionality selected." />
        </SummaryBlock>

        <SummaryBlock title="Communication" onEdit={() => goToStep(6)}>
          <div className="flex flex-wrap gap-1.5">
            {draft.channels.length ? (
              draft.channels.map((channel) => (
                <span
                  key={channel}
                  className="inline-flex items-center gap-1.5 rounded-full bg-ink/5 px-2.5 py-1 text-[10.5px] font-medium text-ink/60"
                >
                  <ChannelIcon id={channel} className="h-3 w-3" />
                  {channelLabel(channel)}
                </span>
              ))
            ) : (
              <p className="text-[11.5px] text-ink/35">No channels selected.</p>
            )}
          </div>
        </SummaryBlock>

        <SummaryBlock title="Contact" onEdit={() => goToStep(8)}>
          <p className="text-[13px] font-semibold text-ink">{draft.details.contactName.trim() || 'Name missing'}</p>
          <p className="mt-1 text-[11px] text-ink/45">{draft.details.email.trim() || 'Email missing'}</p>
          <p className="mt-1 text-[11px] text-ink/40">
            {[draft.details.phone, draft.details.location].filter(Boolean).join(' · ') || 'No phone or location yet'}
          </p>
        </SummaryBlock>

        <SummaryBlock title="Files" onEdit={() => goToStep(8)}>
          {draft.details.attachments.length ? (
            <ul className="space-y-1.5">
              {draft.details.attachments.map((file) => (
                <li key={file.id} className="flex items-center justify-between gap-3 text-[11px]">
                  <span className="truncate text-ink/70">{file.name}</span>
                  <span
                    className={cx(
                      'shrink-0 font-semibold',
                      file.status === 'uploaded'
                        ? 'text-moss'
                        : file.status === 'error'
                          ? 'text-danger'
                          : 'text-ink/40',
                    )}
                  >
                    {file.status === 'uploaded'
                      ? 'Uploaded'
                      : file.status === 'error'
                        ? 'Not uploaded'
                        : 'Uploading'}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[11.5px] text-ink/35">No files attached. That is fine — you can send them later.</p>
          )}
        </SummaryBlock>
      </div>

      <div className="mt-6 rounded-2xl border border-ink/10 bg-card p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[13px] font-semibold text-ink">Send this brief to the studio</p>
            <p className="mt-1 max-w-sm text-[11px] leading-relaxed text-ink/45">
              Your request is emailed to BRIX Studio directly from this page — no email app needed. We
              reply to {draft.details.email.trim() || 'the address in step 8'}.
            </p>
            <p className="mt-1.5 max-w-sm text-[10.5px] leading-relaxed text-ink/35">
              Download brief saves a branded PDF of your selections and design preview, ready to attach
              in Gmail.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleDownload}
              disabled={pdfState === 'working'}
              className="inline-flex h-10 items-center gap-2 rounded-full border border-ink/20 px-4 text-[11.5px] font-semibold text-ink transition-colors hover:border-ink/40 disabled:cursor-wait disabled:opacity-60"
            >
              {pdfState === 'working' ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Preparing PDF…
                </>
              ) : (
                <>
                  <Download className="h-3.5 w-3.5" />
                  Download brief (PDF)
                </>
              )}
            </button>
            <button
              type="button"
              onClick={onSend}
              disabled={!canSend || sendStatus === 'sending' || isSent}
              className="gradient-brand inline-flex h-10 items-center gap-2 rounded-full px-4 text-[11.5px] font-semibold text-white transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {sendStatus === 'sending' ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Sending request…
                </>
              ) : isSent ? (
                <>
                  <Check className="h-3.5 w-3.5" strokeWidth={3} />
                  Request sent
                </>
              ) : (
                <>
                  <Send className="h-3.5 w-3.5" />
                  {sendStatus === 'error' ? 'Try sending again' : 'Send my project request'}
                </>
              )}
            </button>
          </div>
        </div>

        {isSent ? (
          <div role="status" className="mt-4 rounded-xl border border-moss/30 bg-moss/10 px-3.5 py-3">
            <p className="flex items-center gap-1.5 text-[11.5px] font-semibold text-moss">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Request sent{sentLabel ? ` · ${sentLabel}` : ''}
            </p>
            <p className="mt-1 text-[11px] leading-relaxed text-ink/60">
              {confirmation === 'sent' ? (
                <>
                  Your brief was delivered to the studio and a confirmation copy is on its way to{' '}
                  <span className="font-medium text-ink/80">{draft.details.email.trim()}</span>. A copy
                  of your answers stays saved on this device.
                </>
              ) : (
                <>
                  Your brief was delivered to the studio. We'll reply to{' '}
                  <span className="font-medium text-ink/80">{draft.details.email.trim()}</span>. A copy
                  of your answers stays saved on this device.
                </>
              )}
            </p>
            {confirmation === 'failed' ? (
              <p className="mt-1.5 text-[10.5px] leading-relaxed text-ink/45">
                The confirmation email could not be sent, but the studio has your request. Keep the
                date and time above for your records.
              </p>
            ) : null}
          </div>
        ) : null}

        {pdfState === 'fallback' ? (
          <p role="status" className="mt-4 rounded-lg bg-clay/10 px-3 py-2 text-[11px] leading-relaxed text-clay">
            The PDF could not be generated in this browser, so a plain-text brief was saved instead
            ({briefFileName(draft, 'md')}). Try the PDF again, or open Gmail and attach the text file.
          </p>
        ) : null}

        {sendStatus === 'error' && sendError ? (
          <div role="alert" className="mt-4 rounded-xl border border-danger/40 bg-danger/10 px-3.5 py-3">
            <p className="flex items-center gap-1.5 text-[11.5px] font-semibold text-danger">
              <AlertTriangle className="h-3.5 w-3.5" />
              Request not sent
            </p>
            <p className="mt-1 text-[11px] leading-relaxed text-ink/65">
              {sendErrorGuidance[sendError.code] ?? sendError.message}
            </p>
            <button
              type="button"
              onClick={onEmail}
              disabled={!canSend}
              className="mt-2.5 inline-flex items-center gap-1.5 rounded-full border border-danger/30 px-3 py-1.5 text-[10.5px] font-semibold text-danger transition-colors hover:bg-danger/10 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Mail className="h-3 w-3" />
              Open Gmail compose instead
            </button>
          </div>
        ) : null}

        {emailOpened ? (
          <div role="status" className="mt-4 rounded-xl bg-moss/10 px-3.5 py-3">
            <p className="text-[11.5px] font-semibold text-moss">Gmail Compose opened in a new tab</p>
            <p className="mt-1 text-[11px] leading-relaxed text-ink/65">
              The recipient ({site.email}), subject and message are already filled in.
              Download the PDF brief above, attach it in Gmail, then press Send there. Nothing is sent
              from this page.
            </p>
          </div>
        ) : null}

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-ink/8 pt-3">
          <p className="max-w-md text-[10.5px] leading-relaxed text-ink/35">
            Files you attached are uploaded securely with your brief and are only visible to the
            studio. You can add more in step 8.
          </p>
          <button
            type="button"
            onClick={onEmail}
            disabled={!canSend}
            className="inline-flex items-center gap-1.5 text-[10.5px] font-semibold text-ink/45 underline underline-offset-2 transition-colors hover:text-ink disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Mail className="h-3 w-3" />
            Email the brief yourself in Gmail
          </button>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-ink/10 px-4 py-3">
        <p className="text-[11px] text-ink/40">
          Your answers are saved on this device so you can return later.
        </p>
        {confirmReset ? (
          <div className="flex items-center gap-2">
            <span className="text-[10.5px] text-ink/45">Clear all answers?</span>
            <button
              type="button"
              onClick={() => {
                reset()
                setConfirmReset(false)
                goToStep(1)
              }}
              className="rounded-full bg-clay px-3 py-1.5 text-[10.5px] font-semibold text-white transition-colors hover:bg-clay-deep"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => setConfirmReset(false)}
              className="rounded-full border border-ink/15 px-3 py-1.5 text-[10.5px] font-semibold text-ink/55 transition-colors hover:border-ink/35"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmReset(true)}
            className="inline-flex items-center gap-1.5 text-[10.5px] font-semibold text-ink/40 transition-colors hover:text-clay"
          >
            <RotateCcw className="h-3 w-3" />
            Start over
          </button>
        )}
      </div>

      <div className="relative mt-6 overflow-hidden rounded-2xl border border-ink/10 bg-ink-soft p-5 text-ink">
        <div className="pointer-events-none absolute -right-20 -top-24 h-[240px] w-[240px] rounded-full bg-clay/15 blur-3xl" />
        <p className="relative text-[10px] font-bold uppercase tracking-[0.18em] text-ink/40">What happens next</p>
        <ol className="relative mt-3 grid gap-3 sm:grid-cols-3">
          {[
            { icon: FileText, title: 'We review the brief', text: 'Scope, direction and any open questions.' },
            { icon: Mail, title: 'You receive a reply', text: 'A clear proposal with timeline and quote.' },
            { icon: ArrowUpRight, title: 'We build together', text: 'Design checkpoints, build, launch and handover.' },
          ].map((item, index) => {
            const Icon = item.icon
            return (
              <li key={item.title} className="flex gap-2.5">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-ink/10 text-ink/70">
                  <Icon className="h-3.5 w-3.5" />
                </span>
                <span>
                  <span className="block text-[11.5px] font-semibold text-ink/90">
                    0{index + 1}. {item.title}
                  </span>
                  <span className="mt-0.5 block text-[10.5px] leading-relaxed text-ink/45">{item.text}</span>
                </span>
              </li>
            )
          })}
        </ol>
        <p className="relative mt-4 text-[10px] text-ink/30">
          A project starts once we receive your request and confirm the scope together.
        </p>
      </div>
    </>
  )
}

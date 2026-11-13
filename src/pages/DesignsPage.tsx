import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ArrowUpRight, Sparkles } from 'lucide-react'
import { templates } from '../data/templates'
import { getCategory } from '../data/categories'
import { useProject } from '../context/ProjectContext'
import { usePageTitle } from '../hooks/usePageTitle'
import { SelectPill } from '../components/ui/OptionCard'
import { Reveal } from '../components/ui/Reveal'
import { ButtonLink } from '../components/ui/Button'
import { TemplateCard, TemplateDemoModal } from '../components/templates/TemplateCard'
import type { WebsiteTemplate } from '../types'

const styles = ['All', ...Array.from(new Set(templates.map((template) => template.style)))]

export function DesignsPage() {
  usePageTitle('Design gallery — BRIX Studio')
  const { draft } = useProject()
  const [params] = useSearchParams()
  const [style, setStyle] = useState('All')
  const [fitOnly, setFitOnly] = useState(params.get('fit') === '1')
  const [preview, setPreview] = useState<WebsiteTemplate | null>(null)
  const category = getCategory(draft.categoryId)

  const visible = useMemo(() => {
    const filtered = templates.filter((template) => {
      const matchesStyle = style === 'All' || template.style === style
      const matchesFit = !fitOnly || !category || template.bestFor.includes(category.id)
      return matchesStyle && matchesFit
    })
    if (!category) return filtered
    return [...filtered].sort((a, b) => {
      const aFit = a.bestFor.includes(category.id) ? 0 : 1
      const bFit = b.bestFor.includes(category.id) ? 0 : 1
      return aFit - bFit
    })
  }, [style, fitOnly, category])

  const selectedTemplate = templates.find((template) => template.id === draft.templateId)

  return (
    <>
      <section className="relative overflow-hidden border-b border-ink/10 bg-cream/40 py-16 sm:py-20">
        <div className="pointer-events-none absolute inset-0 blueprint opacity-50 [mask-image:linear-gradient(to_bottom,black,transparent)]" />
        <div className="pointer-events-none absolute -right-40 -top-24 h-[420px] w-[420px] rounded-full bg-violet/12 blur-3xl" />
        <div className="shell relative">
          <p className="eyebrow text-clay">
            <span className="h-px w-6 bg-clay" aria-hidden="true" />
            Design gallery
          </p>
          <div className="mt-6 grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
            <h1 className="display max-w-[800px] text-[clamp(2.8rem,5.6vw,5.2rem)] text-ink">
              Find the direction that feels like you.
            </h1>
            <div>
              <p className="max-w-md text-[14px] leading-relaxed text-ink/60">
                Eight complete design languages. Preview any direction at desktop, tablet and mobile
                size, then take it into the customiser and make it yours.
              </p>
              {category ? (
                <p className="mt-4 inline-flex items-center gap-2 rounded-full border border-ink/10 bg-ink/[0.04] px-3.5 py-2 text-[11.5px] text-ink/60">
                  <Sparkles className="h-3.5 w-3.5 text-clay" />
                  Showing suitability for <strong className="font-semibold text-ink">{category.name}</strong>
                </p>
              ) : null}
            </div>
          </div>

          <div className="mt-10 flex flex-col gap-4 border-t border-ink/12 pt-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              {styles.map((item) => (
                <SelectPill key={item} selected={style === item} onClick={() => setStyle(item)}>
                  {item}
                </SelectPill>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {category ? (
                <label className="inline-flex cursor-pointer items-center gap-2 text-[12px] font-medium text-ink/60">
                  <input
                    type="checkbox"
                    checked={fitOnly}
                    onChange={(event) => setFitOnly(event.target.checked)}
                    className="h-4 w-4 rounded border-ink/25 accent-clay"
                  />
                  Only show designs suited to my business
                </label>
              ) : null}
              <span className="text-[11.5px] text-ink/35">
                {visible.length} {visible.length === 1 ? 'design' : 'designs'}
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="py-14 sm:py-20">
        <div className="shell">
          {selectedTemplate ? (
            <div className="mb-8 flex flex-col items-start justify-between gap-4 rounded-2xl border border-ink/12 bg-card px-5 py-4 sm:flex-row sm:items-center">
              <p className="text-[13px] text-ink/60">
                Your current direction is{' '}
                <strong className="font-semibold text-ink">{selectedTemplate.name}</strong>. You can
                change it any time in the builder.
              </p>
              <ButtonLink to="/start" size="sm">
                Resume your brief
                <ArrowUpRight className="h-3.5 w-3.5" />
              </ButtonLink>
            </div>
          ) : null}

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {visible.map((template, index) => (
              <Reveal key={template.id} delay={(index % 3) * 60}>
                <TemplateCard template={template} onPreview={setPreview} />
              </Reveal>
            ))}
          </div>

          <div className="mt-14 flex flex-col items-start justify-between gap-5 rounded-2xl border border-ink/10 bg-cream/50 px-6 py-7 sm:flex-row sm:items-center sm:px-8">
            <div>
              <p className="display text-[clamp(1.6rem,2.6vw,2.2rem)] text-ink">
                Chosen? Make it completely yours.
              </p>
              <p className="mt-2 text-[12.5px] text-ink/50">
                Colours, type, pages, features and contact channels — all in the guided builder.
              </p>
            </div>
            <ButtonLink to="/start" size="md">
              Start customising
              <ArrowUpRight className="h-4 w-4" />
            </ButtonLink>
          </div>
        </div>
      </section>

      <TemplateDemoModal template={preview} open={Boolean(preview)} onClose={() => setPreview(null)} />
    </>
  )
}

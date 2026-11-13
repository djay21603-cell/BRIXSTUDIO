import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowRight, ArrowUpRight, Check } from 'lucide-react'
import { categories, getCategory } from '../data/categories'
import { useProject } from '../context/ProjectContext'
import { usePageTitle } from '../hooks/usePageTitle'
import { Reveal } from '../components/ui/Reveal'
import { Button, ButtonLink } from '../components/ui/Button'
import { cx } from '../lib/cx'

export function BusinessTypesPage() {
  usePageTitle('Business types — BRIX Studio')
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { draft, setCategory } = useProject()
  const selected = getCategory(draft.categoryId)

  useEffect(() => {
    const requested = params.get('category')
    if (requested && getCategory(requested) && requested !== draft.categoryId) {
      setCategory(requested as typeof draft.categoryId)
    }
    // Only react to the URL parameter changing.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params])

  return (
    <section className={cx('pb-16 pt-14 sm:pt-20', selected && 'pb-32')}>
      <div className="shell">
        <p className="eyebrow text-clay">
          <span className="h-px w-6 bg-clay" aria-hidden="true" />
          Business categories
        </p>
        <div className="mt-6 grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
          <h1 className="display max-w-[780px] text-[clamp(2.8rem,5.6vw,5rem)] text-ink">
            What kind of business are we building for?
          </h1>
          <p className="max-w-md text-[14px] leading-relaxed text-ink/60">
            Pick the closest fit. It shapes the starting structure, the sample content and which
            design directions we recommend. You can refine everything later.
          </p>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((category, index) => {
            const Icon = category.icon
            const isSelected = draft.categoryId === category.id
            return (
              <Reveal key={category.id} delay={(index % 4) * 50}>
                <button
                  type="button"
                  onClick={() => setCategory(category.id)}
                  aria-pressed={isSelected}
                  className={cx(
                    'group flex h-full w-full flex-col overflow-hidden rounded-[18px] border bg-card text-left transition-all duration-500',
                    isSelected
                      ? 'border-clay/60 shadow-[0_24px_60px_-40px_rgba(56,107,255,0.7)]'
                      : 'border-ink/10 hover:-translate-y-1 hover:border-ink/25 hover:shadow-[0_24px_60px_-45px_rgba(0,0,0,0.9)]',
                  )}
                >
                  <div className="relative aspect-[16/11] overflow-hidden">
                    <img
                      src={category.image}
                      alt={category.name}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-[900ms] group-hover:scale-[1.05]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-bone/95 via-bone/25 to-transparent" />
                    <span className="absolute left-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-bone/80 text-ink backdrop-blur">
                      <Icon className="h-4 w-4" strokeWidth={1.7} />
                    </span>
                    <span
                      className={cx(
                        'absolute right-3 top-3 grid h-6 w-6 place-items-center rounded-full border transition-all duration-300',
                        isSelected
                          ? 'border-clay bg-clay text-white'
                          : 'border-white/50 bg-bone/40 text-transparent backdrop-blur',
                      )}
                      aria-hidden="true"
                    >
                      <Check className="h-3 w-3" strokeWidth={3} />
                    </span>
                    <p className="absolute bottom-3 left-3 text-[9px] font-bold uppercase tracking-[0.16em] text-ink/80">
                      {category.tagline}
                    </p>
                  </div>
                  <div className="flex flex-1 flex-col p-4">
                    <h2 className="text-[16px] font-semibold tracking-tight text-ink">{category.name}</h2>
                    <p className="mt-2 text-[11.5px] leading-relaxed text-ink/50">{category.description}</p>
                  </div>
                </button>
              </Reveal>
            )
          })}
        </div>

        {!selected ? (
          <div className="mt-10 flex flex-col items-start justify-between gap-4 rounded-2xl border border-dashed border-ink/20 px-6 py-6 sm:flex-row sm:items-center">
            <p className="text-[13px] text-ink/50">
              Choose a category above to continue, or explore the design gallery first.
            </p>
            <ButtonLink to="/designs" variant="secondary" size="sm">
              Browse designs
              <ArrowUpRight className="h-3.5 w-3.5" />
            </ButtonLink>
          </div>
        ) : null}
      </div>

      {selected ? (
        <div className="fixed inset-x-0 bottom-0 z-40 px-4 pb-4">
          <div className="relative mx-auto flex max-w-3xl flex-col gap-3 overflow-hidden rounded-2xl border border-ink/12 bg-ink-soft px-5 py-4 text-ink shadow-[0_30px_80px_-25px_rgba(0,0,0,0.9)] sm:flex-row sm:items-center sm:justify-between">
            <div className="pointer-events-none absolute -right-16 -top-24 h-[220px] w-[220px] rounded-full bg-clay/20 blur-3xl" />
            <div className="relative flex items-center gap-3">
              <span className="hidden h-9 w-9 place-items-center rounded-full bg-ink/10 sm:grid">
                <Check className="h-4 w-4" />
              </span>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink/45">
                  Selected business type
                </p>
                <p className="text-[14px] font-semibold">{selected.name}</p>
              </div>
            </div>
            <div className="relative flex flex-wrap items-center gap-2">
              <Button
                variant="light"
                size="sm"
                onClick={() => navigate('/designs?fit=1')}
                className="border-ink/25"
              >
                See matching designs
              </Button>
              <Button
                variant="inverse"
                size="sm"
                onClick={() => navigate('/start?step=2')}
              >
                Continue
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  )
}

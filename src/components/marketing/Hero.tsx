import { ArrowUpRight, ChevronDown, CircleDot, Palette, Sparkles } from 'lucide-react'
import { ButtonLink } from '../ui/Button'
import { TemplateThumb } from '../templates/TemplateCard'
import { getCategory } from '../../data/categories'
import { getTemplate } from '../../data/templates'
import { site } from '../../data/site'

const heroTemplate = getTemplate('grand-maison')!
const heroCategory = getCategory('hotel')

const heroFacts = [
  { value: '08', label: 'Business types' },
  { value: '08', label: 'Design directions' },
  { value: '09', label: 'Guided steps' },
  { value: '03', label: 'Device previews' },
]

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 blueprint opacity-70 [mask-image:linear-gradient(to_bottom,black,transparent_85%)]" />
      <div className="pointer-events-none absolute -right-40 top-[-18%] h-[640px] w-[640px] rounded-full bg-[radial-gradient(circle,rgba(56,107,255,0.28),transparent_66%)]" />
      <div className="pointer-events-none absolute -left-40 top-[30%] h-[460px] w-[460px] rounded-full bg-[radial-gradient(circle,rgba(129,87,245,0.18),transparent_70%)]" />
      <div className="pointer-events-none absolute right-[26%] top-[58%] h-[320px] w-[320px] rounded-full bg-[radial-gradient(circle,rgba(34,211,238,0.08),transparent_70%)]" />

      <div className="shell relative pb-14 pt-12 lg:pb-20 lg:pt-16">
        <div className="grid items-center gap-14 lg:grid-cols-[1.04fr_0.96fr] lg:gap-10">
          <div className="relative z-10">
            <p className="inline-flex items-center gap-2.5 rounded-full border border-ink/12 bg-ink/[0.04] px-3.5 py-1.5 text-[10.5px] font-semibold uppercase tracking-[0.16em] text-ink/60 backdrop-blur">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-clay opacity-60" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-clay" />
              </span>
              {site.availability}
            </p>

            <h1 className="display mt-7 text-[clamp(3.1rem,6.1vw,6.15rem)] text-ink">
              Websites that make your business{' '}
              <span className="italic text-clay">impossible to ignore.</span>
            </h1>

            <p className="mt-7 max-w-[30rem] text-[15px] leading-relaxed text-ink/60">
              Choose a direction, shape every detail and send us your brief. We design and build
              premium websites for hotels, restaurants, clinics, studios and growing businesses.
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-3">
              <ButtonLink to="/start" size="lg">
                Start your project
                <ArrowUpRight className="h-4 w-4" />
              </ButtonLink>
              <ButtonLink to="/designs" variant="secondary" size="lg">
                Browse the designs
              </ButtonLink>
            </div>

            <div className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-3 text-[11.5px] text-ink/45">
              <span className="inline-flex items-center gap-2">
                <CircleDot className="h-3.5 w-3.5 text-clay" />
                No templates dropped in
              </span>
              <span className="inline-flex items-center gap-2">
                <Sparkles className="h-3.5 w-3.5 text-clay" />
                Built around your business
              </span>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[620px] lg:mx-0">
            <div className="absolute -inset-x-6 -inset-y-8 rounded-[36px] bg-[radial-gradient(ellipse_at_center,rgba(56,107,255,0.22),rgba(129,87,245,0.12)_45%,transparent_72%)] blur-2xl" />
            <div className="relative rotate-[-1.3deg] rounded-[20px] border border-ink/12 bg-card p-1.5 shadow-[0_50px_110px_-45px_rgba(0,0,0,0.9),0_0_60px_-24px_rgba(56,107,255,0.45)] transition-transform duration-700 hover:rotate-0">
              <div className="flex h-8 items-center gap-1.5 rounded-t-[14px] border-b border-ink/8 bg-ink-soft px-3">
                <span className="h-1.5 w-1.5 rounded-full bg-clay" />
                <span className="h-1.5 w-1.5 rounded-full bg-violet" />
                <span className="h-1.5 w-1.5 rounded-full bg-cyan" />
                <span className="mx-auto rounded-full bg-ink/5 px-4 py-1 text-[8.5px] tracking-wide text-ink/35">
                  aureliabay.com
                </span>
              </div>
              <div className="overflow-hidden rounded-b-[14px]">
                <TemplateThumb template={heroTemplate} category={heroCategory} />
              </div>
            </div>

            <div className="absolute -left-3 top-6 hidden items-center gap-2 rounded-full border border-ink/10 bg-bone/95 px-3 py-1.5 text-[9.5px] font-bold uppercase tracking-[0.16em] text-ink/55 shadow-lg backdrop-blur sm:flex">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan shadow-[0_0_8px_rgba(34,211,238,0.85)]" />
              Live preview
            </div>

            <div className="absolute -right-4 top-24 hidden w-[164px] -rotate-2 rounded-2xl border border-ink/12 bg-card/95 p-4 shadow-[0_24px_60px_-30px_rgba(0,0,0,0.85)] backdrop-blur md:block">
              <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.16em] text-ink/40">
                <Palette className="h-3.5 w-3.5" />
                Brand palette
              </div>
              <div className="mt-3 flex gap-1.5">
                {['#f4eee3', '#a98143', '#1d1811', '#8b5e34'].map((color) => (
                  <span
                    key={color}
                    className="h-7 flex-1 rounded-md border border-ink/10"
                    style={{ background: color }}
                  />
                ))}
              </div>
              <p className="mt-2.5 text-[10px] leading-snug text-ink/45">Copper on aged paper</p>
            </div>

            <div className="absolute -bottom-6 left-6 hidden rotate-1 items-center gap-3 rounded-2xl border border-ink/12 bg-card/95 px-4 py-3 shadow-[0_24px_60px_-30px_rgba(0,0,0,0.85)] backdrop-blur sm:flex">
              <span className="gradient-brand grid h-8 w-8 place-items-center rounded-full text-white">
                <span className="display text-[15px]">8</span>
              </span>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-ink/40">Template</p>
                <p className="text-[12px] font-semibold text-ink">Grand Maison · Luxury</p>
              </div>
            </div>

            <div className="pointer-events-none absolute -right-2 bottom-16 hidden rotate-90 text-[9px] font-bold uppercase tracking-[0.3em] text-ink/25 lg:block">
              Preview · Direction 01
            </div>
          </div>
        </div>

        <div className="mt-16 grid grid-cols-2 gap-y-8 border-t border-ink/12 pt-8 sm:grid-cols-4 lg:mt-20">
          {heroFacts.map((fact) => (
            <div key={fact.label} className="flex items-baseline gap-3">
              <span className="display text-[34px] leading-none text-ink">{fact.value}</span>
              <span className="text-[10.5px] font-semibold uppercase tracking-[0.16em] text-ink/40">
                {fact.label}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-10 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-ink/30">
          <ChevronDown className="h-3.5 w-3.5" />
          Explore the studio
        </div>
      </div>
    </section>
  )
}

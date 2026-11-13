import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowUpRight, LockKeyhole } from 'lucide-react'
import { Badge } from '../../components/ui/FormField'
import { ButtonLink } from '../../components/ui/Button'
import { getModule } from '../../features/modules/registry'
import { usePageTitle } from '../../hooks/usePageTitle'

export function ToolShellPage() {
  const { slug } = useParams()
  const module = getModule(slug)
  usePageTitle(`${module?.name ?? 'Module'} — BRIX Studio`)

  if (!module) {
    return (
      <div className="mx-auto max-w-xl py-16 text-center">
        <p className="eyebrow justify-center text-ink/35">Unknown module</p>
        <h1 className="display mt-4 text-[2.4rem] text-ink">This tool is not in the directory.</h1>
        <p className="mt-3 text-[13px] text-ink/50">Return to the module directory to see what is available.</p>
        <ButtonLink to="/app/tools" size="md" className="mt-7">
          <ArrowLeft className="h-4 w-4" />
          Back to tools
        </ButtonLink>
      </div>
    )
  }

  const launched = Boolean(module.href)

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <Link
        to="/app/tools"
        className="inline-flex items-center gap-2 text-[11.5px] font-semibold text-ink/40 transition-colors hover:text-ink"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        All modules
      </Link>

      <header className="surface relative overflow-hidden rounded-3xl p-7 sm:p-10">
        <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-violet/20 blur-3xl" />
        <div className="flex flex-wrap items-center gap-3">
          <span className="grid h-12 w-12 place-items-center rounded-2xl border border-clay/30 bg-clay/15 text-ink">
            <module.icon className="h-5 w-5" />
          </span>
          <Badge tone={module.status === 'live' ? 'live' : module.status === 'beta' ? 'beta' : 'planned'}>
            {module.status === 'planned' ? module.phase : module.status === 'beta' ? 'Beta' : 'Live'}
          </Badge>
          <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-ink/30">{module.group}</span>
        </div>

        <h1 className="display mt-6 text-[clamp(2.2rem,4vw,3.2rem)] text-ink">{module.name}</h1>
        <p className="mt-3 max-w-xl text-[13.5px] leading-relaxed text-ink/55">{module.summary}</p>

        <div className="mt-8 flex flex-wrap gap-3">
          {launched ? (
            <ButtonLink to={module.href!} size="md">
              Open module
              <ArrowUpRight className="h-4 w-4" />
            </ButtonLink>
          ) : (
            <ButtonLink to="/start" variant="secondary" size="md">
              Use the project builder instead
              <ArrowUpRight className="h-4 w-4" />
            </ButtonLink>
          )}
          <ButtonLink to="/app" variant="ghost" size="md">
            Back to overview
          </ButtonLink>
        </div>
      </header>

      <section className="grid gap-3 sm:grid-cols-2">
        <div className="surface rounded-2xl p-6">
          <p className="eyebrow text-ink/35">
            <span className="h-px w-6 bg-ink/20" aria-hidden="true" />
            Status
          </p>
          <p className="mt-4 text-[13px] leading-relaxed text-ink/55">
            {launched
              ? 'This module is available in the current foundation. Its existing behaviour is preserved and separate from the new platform modules.'
              : `This workspace is reserved for ${module.phase}. Opening it does not start a paid service or generate content yet.`}
          </p>
        </div>
        <div className="surface rounded-2xl p-6">
          <p className="eyebrow text-ink/35">
            <span className="h-px w-6 bg-ink/20" aria-hidden="true" />
            Safeguards
          </p>
          <ul className="mt-4 space-y-2.5 text-[12px] leading-relaxed text-ink/50">
            <li className="flex items-start gap-2">
              <LockKeyhole className="mt-0.5 h-3.5 w-3.5 shrink-0 text-cyan" />
              No payment processing is enabled.
            </li>
            <li className="flex items-start gap-2">
              <LockKeyhole className="mt-0.5 h-3.5 w-3.5 shrink-0 text-cyan" />
              No paid AI provider is activated automatically.
            </li>
            <li className="flex items-start gap-2">
              <LockKeyhole className="mt-0.5 h-3.5 w-3.5 shrink-0 text-cyan" />
              Your files stay inside your authenticated account.
            </li>
          </ul>
        </div>
      </section>
    </div>
  )
}

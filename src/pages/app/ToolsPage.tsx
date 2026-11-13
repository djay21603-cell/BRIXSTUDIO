import { Badge } from '../../components/ui/FormField'
import { ModuleCard } from '../../features/modules/ModuleCard'
import { moduleGroups, modules } from '../../features/modules/registry'
import { usePageTitle } from '../../hooks/usePageTitle'

export function ToolsPage() {
  usePageTitle('Tools — BRIX Studio')
  const live = modules.filter((module) => module.status === 'live').length
  const beta = modules.filter((module) => module.status === 'beta').length

  return (
    <div className="space-y-10">
      <header>
        <p className="eyebrow text-clay">
          <span className="h-px w-6 bg-clay" aria-hidden="true" />
          Module directory
        </p>
        <h1 className="display mt-4 text-[clamp(2.4rem,4vw,3.6rem)] text-ink">Every tool, one studio.</h1>
        <p className="mt-3 max-w-2xl text-[13px] leading-relaxed text-ink/50">
          Navigation shells are in place for the full platform. Live modules are usable today; the rest
          open a reserved workspace with their planned scope. Nothing here charges money or calls a paid
          AI provider.
        </p>
        <div className="mt-5 flex flex-wrap items-center gap-2">
          <Badge tone="live">{live} live</Badge>
          <Badge tone="beta">{beta} beta</Badge>
          <Badge tone="planned">{modules.length - live - beta} planned</Badge>
          <span className="text-[10.5px] text-ink/30">Phase 0 foundation</span>
        </div>
      </header>

      {moduleGroups.map((group) => {
        const items = modules.filter((module) => module.group === group)
        return (
          <section key={group}>
            <div className="flex items-baseline justify-between gap-4 border-b border-ink/10 pb-3">
              <h2 className="text-[15px] font-semibold tracking-tight text-ink">{group}</h2>
              <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-ink/30">
                {String(items.length).padStart(2, '0')} modules
              </span>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {items.map((module) => (
                <ModuleCard key={module.slug} module={module} />
              ))}
            </div>
          </section>
        )
      })}

      <p className="rounded-2xl border border-ink/10 bg-ink/[0.03] p-5 text-[11.5px] leading-relaxed text-ink/40">
        Roadmap phases follow the approved plan: Phase 1 creative and brand tools, Phase 2 content and
        video, Phase 3 marketing, Phase 4 commerce, Phase 5 insights. Payments and paid AI providers stay
        disabled until explicitly approved.
      </p>
    </div>
  )
}

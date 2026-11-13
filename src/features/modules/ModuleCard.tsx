import { Link } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'
import { Badge } from '../../components/ui/FormField'
import { cx } from '../../lib/cx'
import type { StudioModule } from './registry'

const statusTone = {
  live: 'live',
  beta: 'beta',
  planned: 'planned',
} as const

const statusLabel = {
  live: 'Live',
  beta: 'Beta',
  planned: 'Roadmap',
} as const

export function ModuleCard({ module, compact = false }: { module: StudioModule; compact?: boolean }) {
  const launched = Boolean(module.href)
  const to = module.href ?? `/app/tools/${module.slug}`

  return (
    <Link
      to={to}
      className={cx(
        'surface group flex h-full flex-col rounded-2xl p-5 transition-all duration-300',
        launched
          ? 'hover:-translate-y-0.5 hover:border-clay/45 hover:shadow-[0_24px_50px_-40px_rgba(56,107,255,0.9)]'
          : 'hover:border-ink/25',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <span
          className={cx(
            'grid h-10 w-10 place-items-center rounded-xl border',
            launched
              ? 'border-clay/30 bg-clay/15 text-ink'
              : 'border-ink/10 bg-ink/[0.03] text-ink/45',
          )}
        >
          <module.icon className="h-4 w-4" />
        </span>
        <Badge tone={statusTone[module.status]}>
          {module.status === 'planned' ? module.phase : statusLabel[module.status]}
        </Badge>
      </div>

      <h3 className="mt-4 text-[14px] font-semibold tracking-tight text-ink">{module.name}</h3>
      {!compact ? (
        <p className="mt-2 flex-1 text-[11.5px] leading-relaxed text-ink/45">{module.summary}</p>
      ) : null}

      <span className="mt-4 inline-flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-[0.14em] text-ink/35 transition-colors group-hover:text-cyan">
        {launched ? 'Open' : 'View shell'}
        <ArrowUpRight className="h-3 w-3" />
      </span>
    </Link>
  )
}

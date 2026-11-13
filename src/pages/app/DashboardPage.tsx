import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, ArrowUpRight, FolderOpen, HardDrive, ShieldCheck, Sparkles, Users } from 'lucide-react'
import { useAuth } from '../../features/auth/AuthContext'
import { ModuleCard } from '../../features/modules/ModuleCard'
import { modules, moduleGroups } from '../../features/modules/registry'
import { ButtonLink } from '../../components/ui/Button'
import { usePageTitle } from '../../hooks/usePageTitle'
import { api, formatBytes, formatDate, type UploadItem, type UploadUsage } from '../../lib/api'

const roleLabels: Record<string, string> = {
  user: 'Free account',
  client: 'Studio client',
  admin: 'Administrator',
}

function greeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

export function DashboardPage() {
  usePageTitle('Workspace — BRIX Studio')
  const { user } = useAuth()
  const [uploads, setUploads] = useState<UploadItem[]>([])
  const [usage, setUsage] = useState<UploadUsage | null>(null)
  const [loadError, setLoadError] = useState(false)

  useEffect(() => {
    let alive = true
    api
      .get<{ ok: true; items: UploadItem[]; usage: UploadUsage }>('/api/v1/uploads')
      .then((result) => {
        if (!alive) return
        setUploads(result.items)
        setUsage(result.usage)
      })
      .catch(() => {
        if (alive) setLoadError(true)
      })
    return () => {
      alive = false
    }
  }, [])

  if (!user) return null

  const firstName = user.name.split(/\s+/)[0] || user.name
  const liveModules = modules.filter((module) => module.status === 'live' || module.status === 'beta')
  const usedPercent = usage && usage.quotaBytes > 0 ? Math.min(100, (usage.bytes / usage.quotaBytes) * 100) : 0

  return (
    <div className="space-y-10">
      <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow text-clay">
            <span className="h-px w-6 bg-clay" aria-hidden="true" />
            Your workspace
          </p>
          <h1 className="display mt-4 text-[clamp(2.4rem,4vw,3.6rem)] text-ink">
            {greeting()}, {firstName}.
          </h1>
          <p className="mt-3 max-w-xl text-[13px] leading-relaxed text-ink/50">
            Account, storage and module navigation are live. New creative tools arrive in later phases —
            the existing project builder is fully available today.
          </p>
        </div>
        <ButtonLink to="/start" size="md">
          Open project builder
          <ArrowUpRight className="h-4 w-4" />
        </ButtonLink>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="surface rounded-2xl p-5">
          <span className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.15em] text-ink/35">
            <FolderOpen className="h-3.5 w-3.5" />
            Files
          </span>
          <p className="mt-3 text-[1.75rem] font-semibold tracking-tight text-ink">{usage?.count ?? 0}</p>
          <p className="mt-1 text-[10.5px] text-ink/35">Private uploads in your account</p>
        </div>
        <div className="surface rounded-2xl p-5">
          <span className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.15em] text-ink/35">
            <HardDrive className="h-3.5 w-3.5" />
            Storage
          </span>
          <p className="mt-3 text-[1.75rem] font-semibold tracking-tight text-ink">
            {formatBytes(usage?.bytes ?? 0)}
          </p>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-ink/10">
            <span className="gradient-brand block h-full rounded-full" style={{ width: `${usedPercent}%` }} />
          </div>
        </div>
        <div className="surface rounded-2xl p-5">
          <span className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.15em] text-ink/35">
            <Users className="h-3.5 w-3.5" />
            Workspaces
          </span>
          <p className="mt-3 text-[1.75rem] font-semibold tracking-tight text-ink">{user.workspaces.length}</p>
          <p className="mt-1 truncate text-[10.5px] text-ink/35">{user.workspaces[0]?.name ?? 'Personal workspace'}</p>
        </div>
        <div className="surface rounded-2xl p-5">
          <span className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.15em] text-ink/35">
            <ShieldCheck className="h-3.5 w-3.5" />
            Account
          </span>
          <p className="mt-3 text-[1.15rem] font-semibold tracking-tight text-ink">
            {roleLabels[user.role] ?? user.role}
          </p>
          <p className="mt-1 text-[10.5px] text-ink/35">No payment details collected</p>
        </div>
      </section>

      <section>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="eyebrow text-ink/35">
              <span className="h-px w-6 bg-ink/20" aria-hidden="true" />
              Available now
            </p>
            <h2 className="display mt-3 text-[1.9rem] text-ink">Start with what already works.</h2>
          </div>
          <Link
            to="/app/tools"
            className="inline-flex items-center gap-1.5 text-[11.5px] font-semibold text-ink/45 transition-colors hover:text-ink"
          >
            See all {modules.length} modules
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {liveModules.map((module) => (
            <ModuleCard key={module.slug} module={module} />
          ))}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="surface rounded-2xl p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-[14px] font-semibold text-ink">Recent files</h2>
            <Link to="/app/files" className="text-[11px] font-semibold text-ink/40 hover:text-ink">
              Manage files
            </Link>
          </div>
          {loadError ? (
            <p className="mt-4 text-[12px] text-danger">Storage could not be loaded. Refresh the page to retry.</p>
          ) : uploads.length === 0 ? (
            <div className="mt-6 rounded-xl border border-dashed border-ink/15 p-6 text-center">
              <p className="text-[12.5px] text-ink/45">No uploads yet.</p>
              <Link
                to="/app/files"
                className="mt-3 inline-flex items-center gap-1.5 text-[11.5px] font-semibold text-cyan hover:text-ink"
              >
                Upload your first image or PDF
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          ) : (
            <ul className="mt-4 divide-y divide-ink/8">
              {uploads.slice(0, 5).map((item) => (
                <li key={item.id} className="flex items-center justify-between gap-4 py-3">
                  <span className="min-w-0">
                    <span className="block truncate text-[12.5px] font-medium text-ink">{item.name}</span>
                    <span className="text-[10.5px] text-ink/35">{formatDate(item.createdAt)}</span>
                  </span>
                  <span className="shrink-0 text-[10.5px] text-ink/40">{formatBytes(item.size)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="surface relative overflow-hidden rounded-2xl p-6">
          <div className="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full bg-clay/20 blur-3xl" />
          <p className="eyebrow text-ink/35">
            <span className="h-px w-6 bg-ink/20" aria-hidden="true" />
            Module roadmap
          </p>
          <ul className="mt-5 space-y-3">
            {moduleGroups.map((group) => {
              const items = modules.filter((module) => module.group === group)
              const ready = items.filter((module) => module.status !== 'planned').length
              return (
                <li key={group} className="flex items-center justify-between gap-3 border-b border-ink/8 pb-3 last:border-0 last:pb-0">
                  <span className="text-[12.5px] font-medium text-ink/70">{group}</span>
                  <span className="text-[10.5px] text-ink/35">
                    {ready}/{items.length} ready
                  </span>
                </li>
              )
            })}
          </ul>
          <Link
            to="/app/tools"
            className="mt-5 inline-flex items-center gap-1.5 text-[11.5px] font-semibold text-cyan hover:text-ink"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Explore module shells
          </Link>
        </div>
      </section>
    </div>
  )
}

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Activity, FolderOpen, HardDrive, RefreshCw, Search, ShieldCheck, Users, type LucideIcon } from 'lucide-react'
import { Badge } from '../../components/ui/FormField'
import { usePageTitle } from '../../hooks/usePageTitle'
import {
  ApiError,
  api,
  formatBytes,
  formatDate,
  type AdminStats,
  type AdminUser,
  type AdminWorkspace,
  type AuditEvent,
} from '../../lib/api'

const roleLabels: Record<string, string> = {
  user: 'Free user',
  client: 'Studio client',
  admin: 'Admin',
}

export function AdminPage() {
  usePageTitle('Admin — BRIX Studio')
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [users, setUsers] = useState<AdminUser[]>([])
  const [workspaces, setWorkspaces] = useState<AdminWorkspace[]>([])
  const [events, setEvents] = useState<AuditEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [busyId, setBusyId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [statsResult, usersResult, workspacesResult, auditResult] = await Promise.all([
        api.get<{ ok: true; stats: AdminStats }>('/api/v1/admin/stats'),
        api.get<{ ok: true; users: AdminUser[] }>('/api/v1/admin/users'),
        api.get<{ ok: true; workspaces: AdminWorkspace[] }>('/api/v1/admin/workspaces'),
        api.get<{ ok: true; events: AuditEvent[] }>('/api/v1/admin/audit?limit=25'),
      ])
      setStats(statsResult.stats)
      setUsers(usersResult.users)
      setWorkspaces(workspacesResult.workspaces)
      setEvents(auditResult.events)
    } catch (problem) {
      setError(problem instanceof ApiError ? problem.message : 'Administration data could not be loaded.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return users
    return users.filter(
      (user) => user.email.toLowerCase().includes(needle) || user.name.toLowerCase().includes(needle),
    )
  }, [users, query])

  const updateUser = async (user: AdminUser, patch: { role?: string; status?: string }) => {
    setBusyId(user.id)
    setError(null)
    try {
      const result = await api.patch<{ ok: true; user: { role: AdminUser['role']; status: AdminUser['status'] } }>(
        `/api/v1/admin/users/${user.id}`,
        patch,
      )
      setUsers((current) =>
        current.map((item) =>
          item.id === user.id
            ? { ...item, role: result.user.role, status: result.user.status }
            : item,
        ),
      )
    } catch (problem) {
      setError(problem instanceof ApiError ? problem.message : 'That change could not be saved.')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow text-clay">
            <span className="h-px w-6 bg-clay" aria-hidden="true" />
            Administration
          </p>
          <h1 className="display mt-4 text-[clamp(2.4rem,4vw,3.4rem)] text-ink">Platform control.</h1>
          <p className="mt-3 max-w-xl text-[13px] leading-relaxed text-ink/50">
            Accounts, workspaces, storage usage and the security trail for the foundation phase.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          className="inline-flex h-10 items-center gap-2 self-start rounded-full border border-ink/15 px-4 text-[11.5px] font-semibold text-ink/60 transition-colors hover:border-ink/35 hover:text-ink"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </header>

      {error ? (
        <p className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-[12.5px] text-danger" role="alert">
          {error}
        </p>
      ) : null}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Users} label="Accounts" value={stats?.users ?? 0} detail={`${stats?.activeUsers ?? 0} active`} />
        <StatCard
          icon={ShieldCheck}
          label="Admins"
          value={stats?.admins ?? 0}
          detail={`${stats?.activeSessions ?? 0} ${(stats?.activeSessions ?? 0) === 1 ? 'session' : 'sessions'}`}
        />
        <StatCard icon={FolderOpen} label="Workspaces" value={stats?.workspaces ?? 0} detail="Personal & project" />
        <StatCard
          icon={HardDrive}
          label="Stored files"
          value={stats?.uploads ?? 0}
          detail={formatBytes(stats?.uploadBytes ?? 0)}
        />
      </section>

      <section className="surface overflow-hidden rounded-2xl">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink/10 px-6 py-4">
          <h2 className="text-[14px] font-semibold text-ink">Accounts</h2>
          <label className="flex h-9 items-center gap-2 rounded-full border border-ink/12 bg-ink/[0.03] px-3.5">
            <Search className="h-3.5 w-3.5 text-ink/35" />
            <input
              className="w-44 bg-transparent text-[11.5px] text-ink outline-none placeholder:text-ink/30"
              placeholder="Search name or email"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left">
            <thead>
              <tr className="border-b border-ink/8 text-[9.5px] uppercase tracking-[0.16em] text-ink/30">
                <th className="px-6 py-3 font-bold">Person</th>
                <th className="px-4 py-3 font-bold">Role</th>
                <th className="px-4 py-3 font-bold">Status</th>
                <th className="px-4 py-3 font-bold">Files</th>
                <th className="px-4 py-3 font-bold">Joined</th>
                <th className="px-6 py-3 text-right font-bold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/8">
              {filtered.map((user) => (
                <tr key={user.id} className="text-[12px]">
                  <td className="px-6 py-3.5">
                    <span className="block font-medium text-ink">{user.name}</span>
                    <span className="block text-[10.5px] text-ink/35">{user.email}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <select
                      className="rounded-lg border border-ink/12 bg-ink-soft px-2.5 py-1.5 text-[11px] text-ink outline-none focus:border-clay/60 disabled:opacity-40"
                      value={user.role}
                      disabled={busyId === user.id}
                      onChange={(event) => void updateUser(user, { role: event.target.value })}
                    >
                      {Object.entries(roleLabels).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3.5">
                    <Badge tone={user.status === 'active' ? 'live' : 'danger'}>{user.status}</Badge>
                  </td>
                  <td className="px-4 py-3.5 text-[11px] text-ink/50">
                    {user.files} · {formatBytes(user.storageBytes)}
                  </td>
                  <td className="px-4 py-3.5 text-[11px] text-ink/40">{formatDate(user.createdAt)}</td>
                  <td className="px-6 py-3.5 text-right">
                    <button
                      type="button"
                      disabled={busyId === user.id}
                      onClick={() =>
                        void updateUser(user, { status: user.status === 'active' ? 'suspended' : 'active' })
                      }
                      className="rounded-full border border-ink/15 px-3 py-1.5 text-[10.5px] font-semibold text-ink/55 transition-colors hover:border-ink/35 hover:text-ink disabled:opacity-40"
                    >
                      {user.status === 'active' ? 'Suspend' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-[12px] text-ink/35">
                    No accounts match that search.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
        <p className="border-t border-ink/8 px-6 py-3 text-[10px] text-ink/30">
          You cannot change your own role or suspend your own account. Suspending someone signs out their
          active sessions.
        </p>
      </section>

      <div className="grid gap-4 xl:grid-cols-2">
        <section className="surface rounded-2xl p-6">
          <h2 className="flex items-center gap-2 text-[14px] font-semibold text-ink">
            <FolderOpen className="h-4 w-4 text-cyan" />
            Workspaces
          </h2>
          <ul className="mt-4 divide-y divide-ink/8">
            {workspaces.slice(0, 8).map((workspace) => (
              <li key={workspace.id} className="flex items-center justify-between gap-3 py-3">
                <span className="min-w-0">
                  <span className="block truncate text-[12px] font-medium text-ink">{workspace.name}</span>
                  <span className="block truncate text-[10px] text-ink/35">
                    {workspace.ownerEmail} · {workspace.members} members
                  </span>
                </span>
                <Badge tone="neutral">{workspace.kind}</Badge>
              </li>
            ))}
          </ul>
        </section>

        <section className="surface rounded-2xl p-6">
          <h2 className="flex items-center gap-2 text-[14px] font-semibold text-ink">
            <Activity className="h-4 w-4 text-cyan" />
            Security activity
          </h2>
          <ul className="mt-4 divide-y divide-ink/8">
            {events.slice(0, 8).map((event) => (
              <li key={event.id} className="py-2.5">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[11.5px] font-medium text-ink/75">{event.action}</span>
                  <span className="text-[10px] text-ink/30">{formatDate(event.createdAt)}</span>
                </div>
                <span className="block truncate text-[10px] text-ink/35">
                  {event.actorEmail ?? 'system'} · {event.ip ?? 'unknown ip'}
                </span>
              </li>
            ))}
            {events.length === 0 ? <li className="py-4 text-[11.5px] text-ink/35">No events recorded yet.</li> : null}
          </ul>
        </section>
      </div>
    </div>
  )
}

function StatCard({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: LucideIcon
  label: string
  value: number
  detail: string
}) {
  return (
    <div className="surface rounded-2xl p-5">
      <span className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.15em] text-ink/35">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </span>
      <p className="mt-3 text-[1.75rem] font-semibold tracking-tight text-ink">{value}</p>
      <p className="mt-1 text-[10.5px] text-ink/35">{detail}</p>
    </div>
  )
}

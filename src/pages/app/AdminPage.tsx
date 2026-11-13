import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Activity,
  FolderOpen,
  HardDrive,
  Inbox,
  Mail,
  Paperclip,
  RefreshCw,
  Search,
  ShieldCheck,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { Badge } from '../../components/ui/FormField'
import { Modal } from '../../components/ui/Modal'
import { usePageTitle } from '../../hooks/usePageTitle'
import {
  ApiError,
  api,
  formatBytes,
  formatDate,
  formatDateTime,
  type AdminStats,
  type AdminUser,
  type AdminWorkspace,
  type AuditEvent,
  type EmailStatus,
  type InquiryCounts,
  type InquiryDetail,
  type InquiryStatus,
  type InquirySummary,
} from '../../lib/api'

const roleLabels: Record<string, string> = {
  user: 'Free user',
  client: 'Studio client',
  admin: 'Admin',
}

const inquiryStatusLabels: Record<InquiryStatus, string> = {
  new: 'New',
  reviewing: 'Reviewing',
  quotation_sent: 'Quotation sent',
  approved: 'Approved',
  completed: 'Completed',
}

const inquiryStatusOrder: InquiryStatus[] = ['new', 'reviewing', 'quotation_sent', 'approved', 'completed']

const emailTone: Record<EmailStatus, 'neutral' | 'live' | 'danger'> = {
  pending: 'neutral',
  sent: 'live',
  failed: 'danger',
  not_configured: 'neutral',
}

const emailLabels: Record<EmailStatus, string> = {
  pending: 'Pending',
  sent: 'Sent',
  failed: 'Failed',
  not_configured: 'Not configured',
}

export function AdminPage() {
  usePageTitle('Admin — BRIX Studio')
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [users, setUsers] = useState<AdminUser[]>([])
  const [workspaces, setWorkspaces] = useState<AdminWorkspace[]>([])
  const [events, setEvents] = useState<AuditEvent[]>([])
  const [inquiries, setInquiries] = useState<InquirySummary[]>([])
  const [inquiryCounts, setInquiryCounts] = useState<InquiryCounts | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [inquiryQuery, setInquiryQuery] = useState('')
  const [inquiryFilter, setInquiryFilter] = useState<'all' | InquiryStatus>('all')
  const [busyId, setBusyId] = useState<string | null>(null)
  const [inquiryBusy, setInquiryBusy] = useState<string | null>(null)
  const [detailLoading, setDetailLoading] = useState<string | null>(null)
  const [selectedInquiry, setSelectedInquiry] = useState<InquiryDetail | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [statsResult, usersResult, workspacesResult, auditResult, inquiriesResult] = await Promise.all([
        api.get<{ ok: true; stats: AdminStats }>('/api/v1/admin/stats'),
        api.get<{ ok: true; users: AdminUser[] }>('/api/v1/admin/users'),
        api.get<{ ok: true; workspaces: AdminWorkspace[] }>('/api/v1/admin/workspaces'),
        api.get<{ ok: true; events: AuditEvent[] }>('/api/v1/admin/audit?limit=25'),
        api.get<{ ok: true; inquiries: InquirySummary[]; counts: InquiryCounts }>('/api/v1/admin/inquiries'),
      ])
      setStats(statsResult.stats)
      setUsers(usersResult.users)
      setWorkspaces(workspacesResult.workspaces)
      setEvents(auditResult.events)
      setInquiries(inquiriesResult.inquiries)
      setInquiryCounts(inquiriesResult.counts)
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

  const filteredInquiries = useMemo(() => {
    const needle = inquiryQuery.trim().toLowerCase()
    return inquiries.filter((inquiry) => {
      if (inquiryFilter !== 'all' && inquiry.status !== inquiryFilter) return false
      if (!needle) return true
      return [inquiry.name, inquiry.email, inquiry.businessName, inquiry.submissionId, inquiry.message]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(needle))
    })
  }, [inquiries, inquiryFilter, inquiryQuery])

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

  const openInquiry = async (inquiry: InquirySummary) => {
    setDetailLoading(inquiry.id)
    setError(null)
    try {
      const result = await api.get<{ ok: true; inquiry: InquiryDetail }>(`/api/v1/admin/inquiries/${inquiry.id}`)
      setSelectedInquiry(result.inquiry)
    } catch (problem) {
      setError(problem instanceof ApiError ? problem.message : 'That inquiry could not be loaded.')
    } finally {
      setDetailLoading(null)
    }
  }

  const updateInquiry = async (inquiry: InquirySummary | InquiryDetail, status: InquiryStatus) => {
    if (inquiry.status === status) return
    const previous = inquiry.status
    setInquiryBusy(inquiry.id)
    setError(null)
    try {
      const result = await api.patch<{ ok: true; inquiry: InquiryDetail }>(
        `/api/v1/admin/inquiries/${inquiry.id}`,
        { status },
      )
      setInquiries((current) =>
        current.map((item) => (item.id === inquiry.id ? { ...item, status: result.inquiry.status } : item)),
      )
      setSelectedInquiry((current) =>
        current && current.id === inquiry.id ? { ...current, status: result.inquiry.status } : current,
      )
      setInquiryCounts((current) => {
        if (!current) return current
        const next = { ...current }
        next[previous] = Math.max(0, next[previous] - 1)
        next[status] += 1
        return next
      })
    } catch (problem) {
      setError(problem instanceof ApiError ? problem.message : 'The status could not be updated.')
    } finally {
      setInquiryBusy(null)
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
            Inquiries, accounts, workspaces, storage usage and the security trail for the foundation
            phase.
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

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
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
        <StatCard
          icon={Inbox}
          label="Inquiries"
          value={stats?.inquiries ?? 0}
          detail={`${stats?.newInquiries ?? 0} new`}
        />
      </section>

      <section className="surface overflow-hidden rounded-2xl">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink/10 px-6 py-4">
          <div>
            <h2 className="text-[14px] font-semibold text-ink">Customer inquiries</h2>
            <p className="mt-0.5 text-[10.5px] text-ink/35">
              Builder briefs and contact messages, newest first. Private — admins only.
            </p>
          </div>
          <label className="flex h-9 items-center gap-2 rounded-full border border-ink/12 bg-ink/[0.03] px-3.5">
            <Search className="h-3.5 w-3.5 text-ink/35" />
            <input
              className="w-44 bg-transparent text-[11.5px] text-ink outline-none placeholder:text-ink/30"
              placeholder="Search name, email, business"
              value={inquiryQuery}
              onChange={(event) => setInquiryQuery(event.target.value)}
            />
          </label>
        </div>

        <div className="flex flex-wrap gap-2 border-b border-ink/8 px-6 py-3">
          <FilterPill
            active={inquiryFilter === 'all'}
            onClick={() => setInquiryFilter('all')}
            label="All"
            count={inquiryCounts?.all ?? inquiries.length}
          />
          {inquiryStatusOrder.map((status) => (
            <FilterPill
              key={status}
              active={inquiryFilter === status}
              onClick={() => setInquiryFilter(status)}
              label={inquiryStatusLabels[status]}
              count={inquiryCounts?.[status] ?? 0}
            />
          ))}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left">
            <thead>
              <tr className="border-b border-ink/8 text-[9.5px] uppercase tracking-[0.16em] text-ink/30">
                <th className="px-6 py-3 font-bold">Person</th>
                <th className="px-4 py-3 font-bold">Contact</th>
                <th className="px-4 py-3 font-bold">Source</th>
                <th className="px-4 py-3 font-bold">Status</th>
                <th className="px-4 py-3 font-bold">Received</th>
                <th className="px-4 py-3 font-bold">Files</th>
                <th className="px-6 py-3 text-right font-bold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/8">
              {filteredInquiries.map((inquiry) => (
                <tr key={inquiry.id} className="text-[12px]">
                  <td className="px-6 py-3.5">
                    <span className="block font-medium text-ink">{inquiry.name}</span>
                    <span className="block text-[10.5px] text-ink/35">
                      {inquiry.businessName && inquiry.businessName !== 'Not provided'
                        ? inquiry.businessName
                        : inquiry.kind === 'contact'
                          ? 'Contact message'
                          : 'No business name'}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="block text-[11px] text-ink/60">{inquiry.email}</span>
                    <span className="block text-[10px] text-ink/35">{inquiry.phone || 'No phone'}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <Badge tone={inquiry.kind === 'brief' ? 'beta' : 'neutral'}>
                      {inquiry.kind === 'brief' ? 'Builder brief' : 'Contact'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3.5">
                    <select
                      className="rounded-lg border border-ink/12 bg-ink-soft px-2.5 py-1.5 text-[11px] text-ink outline-none focus:border-clay/60 disabled:opacity-40"
                      value={inquiry.status}
                      disabled={inquiryBusy === inquiry.id}
                      aria-label={`Status for ${inquiry.name}`}
                      onChange={(event) => void updateInquiry(inquiry, event.target.value as InquiryStatus)}
                    >
                      {inquiryStatusOrder.map((status) => (
                        <option key={status} value={status}>
                          {inquiryStatusLabels[status]}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3.5 text-[11px] text-ink/40">{formatDate(inquiry.createdAt)}</td>
                  <td className="px-4 py-3.5">
                    {inquiry.files ? (
                      <span className="inline-flex items-center gap-1 text-[10.5px] text-ink/50">
                        <Paperclip className="h-3 w-3" />
                        {inquiry.files}
                      </span>
                    ) : (
                      <span className="text-[10.5px] text-ink/25">—</span>
                    )}
                  </td>
                  <td className="px-6 py-3.5 text-right">
                    <button
                      type="button"
                      disabled={detailLoading === inquiry.id}
                      onClick={() => void openInquiry(inquiry)}
                      className="rounded-full border border-ink/15 px-3 py-1.5 text-[10.5px] font-semibold text-ink/55 transition-colors hover:border-ink/35 hover:text-ink disabled:opacity-40"
                    >
                      {detailLoading === inquiry.id ? 'Loading…' : 'Open'}
                    </button>
                  </td>
                </tr>
              ))}
              {filteredInquiries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-[12px] text-ink/35">
                    No inquiries match this filter yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
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

      <Modal
        open={Boolean(selectedInquiry)}
        onClose={() => setSelectedInquiry(null)}
        title={
          [selectedInquiry?.businessName, selectedInquiry?.name].find(
            (value) => value && value !== 'Not provided',
          ) ||
          (selectedInquiry?.kind === 'contact' ? 'Contact message' : 'Builder brief')
        }
        description={
          selectedInquiry
            ? `${selectedInquiry.kind === 'brief' ? 'Builder brief' : 'Contact message'} · ${formatDateTime(selectedInquiry.createdAt)}`
            : undefined
        }
        size="wide"
      >
        {selectedInquiry ? (
          <div className="space-y-6 p-6 sm:p-8">
            <div className="flex flex-wrap items-center gap-3">
              <select
                className="rounded-lg border border-ink/12 bg-ink-soft px-3 py-2 text-[12px] text-ink outline-none focus:border-clay/60 disabled:opacity-40"
                value={selectedInquiry.status}
                disabled={inquiryBusy === selectedInquiry.id}
                aria-label="Inquiry status"
                onChange={(event) => void updateInquiry(selectedInquiry, event.target.value as InquiryStatus)}
              >
                {inquiryStatusOrder.map((status) => (
                  <option key={status} value={status}>
                    {inquiryStatusLabels[status]}
                  </option>
                ))}
              </select>
              <Badge tone={emailTone[selectedInquiry.emails.studio]}>
                Studio email: {emailLabels[selectedInquiry.emails.studio]}
              </Badge>
              <Badge tone={emailTone[selectedInquiry.emails.customer]}>
                Customer copy: {emailLabels[selectedInquiry.emails.customer]}
              </Badge>
              <span className="font-mono text-[10px] text-ink/35">{selectedInquiry.submissionId}</span>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <DetailItem label="Contact">
                  <span className="block">{selectedInquiry.payload?.contact?.name || selectedInquiry.name}</span>
                  <a href={`mailto:${selectedInquiry.email}`} className="block text-clay underline underline-offset-2">
                    {selectedInquiry.email}
                  </a>
                  <span className="block">{selectedInquiry.phone || 'No phone provided'}</span>
                  <span className="block">{selectedInquiry.location || 'No location provided'}</span>
                </DetailItem>
                <DetailItem label="Business">
                  <span className="block">{selectedInquiry.businessName || 'Not provided'}</span>
                  <span className="block">
                    {selectedInquiry.category || selectedInquiry.payload?.business?.tagline || 'No category'}
                  </span>
                  <span className="block">
                    {selectedInquiry.payload?.business?.existingUrl || 'No existing website'}
                  </span>
                </DetailItem>
                <DetailItem label={selectedInquiry.kind === 'contact' ? 'Message' : 'About the business'}>
                  {selectedInquiry.payload?.business?.description || selectedInquiry.message || 'Not provided'}
                </DetailItem>
              </div>

              <div className="space-y-4">
                <DetailItem label="Design direction">
                  <span className="block">{selectedInquiry.template || selectedInquiry.payload?.design?.template || 'Not selected'}</span>
                  <span className="block">{selectedInquiry.payload?.design?.style || 'No style selected'}</span>
                  <span className="mt-1 flex items-center gap-2">
                    {(selectedInquiry.payload?.brand?.primary || '#386bff') && (
                      <span
                        className="inline-block h-3 w-3 rounded-sm border border-ink/20"
                        style={{ background: selectedInquiry.payload?.brand?.primary || '#386bff' }}
                      />
                    )}
                    {(selectedInquiry.payload?.brand?.accent || '#8157f5') && (
                      <span
                        className="inline-block h-3 w-3 rounded-sm border border-ink/20"
                        style={{ background: selectedInquiry.payload?.brand?.accent || '#8157f5' }}
                      />
                    )}
                    <span className="text-[10px] text-ink/40">
                      {selectedInquiry.payload?.brand?.typography || 'Typography not specified'}
                    </span>
                  </span>
                </DetailItem>
                <DetailItem label="Scope">
                  <span className="block">Pages: {selectedInquiry.payload?.pages?.join(', ') || 'None selected'}</span>
                  <span className="block">Features: {selectedInquiry.payload?.features?.join(', ') || 'None selected'}</span>
                  <span className="block">Channels: {selectedInquiry.payload?.channels?.join(', ') || 'None selected'}</span>
                  <span className="block">Motion: {selectedInquiry.payload?.motion || 'Not specified'}</span>
                </DetailItem>
                <DetailItem label="Attachments">
                  {selectedInquiry.files.length ? (
                    <ul className="space-y-2">
                      {selectedInquiry.files.map((file) => (
                        <li key={file.id} className="flex items-center justify-between gap-3">
                          <span className="flex min-w-0 items-center gap-2">
                            <Paperclip className="h-3.5 w-3.5 shrink-0 text-ink/35" />
                            <span className="truncate">{file.name}</span>
                            <span className="shrink-0 text-[10px] text-ink/35">{formatBytes(file.size)}</span>
                          </span>
                          <a
                            href={`/api/v1/admin/inquiry-uploads/${file.id}/content`}
                            target="_blank"
                            rel="noreferrer"
                            className="shrink-0 rounded-full border border-ink/15 px-2.5 py-1 text-[10px] font-semibold text-ink/55 transition-colors hover:border-ink/35 hover:text-ink"
                          >
                            Open
                          </a>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <span className="text-ink/35">No files attached</span>
                  )}
                  {selectedInquiry.payload?.assetLinks ? (
                    <span className="mt-2 block break-all text-[11px] text-ink/50">
                      Links: {selectedInquiry.payload.assetLinks}
                    </span>
                  ) : null}
                </DetailItem>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-ink/10 pt-4">
              <p className="text-[10.5px] text-ink/35">
                Customer details are private to studio admins. Do not share this view publicly.
              </p>
              <a
                href={`mailto:${selectedInquiry.email}?subject=${encodeURIComponent(
                  `Re: your BRIX Studio request (${selectedInquiry.submissionId.slice(0, 8)})`,
                )}`}
                className="inline-flex items-center gap-2 rounded-full border border-ink/15 px-4 py-2 text-[11px] font-semibold text-ink/60 transition-colors hover:border-ink/35 hover:text-ink"
              >
                <Mail className="h-3.5 w-3.5" />
                Reply by email
              </a>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  )
}

function FilterPill({
  active,
  onClick,
  label,
  count,
}: {
  active: boolean
  onClick: () => void
  label: string
  count: number
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[10.5px] font-semibold transition-colors ${
        active
          ? 'border-clay/50 bg-clay/15 text-ink'
          : 'border-ink/12 text-ink/45 hover:border-ink/30 hover:text-ink'
      }`}
    >
      {label}
      <span className="text-[9px] opacity-60">{count}</span>
    </button>
  )
}

function DetailItem({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[9.5px] font-bold uppercase tracking-[0.15em] text-ink/35">{label}</p>
      <div className="mt-1.5 space-y-0.5 text-[12px] leading-relaxed text-ink/65">{children}</div>
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

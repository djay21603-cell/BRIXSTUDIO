import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Download, KeyRound, LogOut, Plus, Trash2, UserPlus, Users } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Badge, FormError, FormField, fieldClass } from '../../components/ui/FormField'
import { Modal } from '../../components/ui/Modal'
import { useAuth } from '../../features/auth/AuthContext'
import { usePageTitle } from '../../hooks/usePageTitle'
import {
  ApiError,
  api,
  formatDate,
  type WorkspaceMember,
  type WorkspaceSummary,
} from '../../lib/api'

const roleLabels: Record<string, string> = {
  user: 'Free account',
  client: 'Studio client',
  admin: 'Administrator',
}

function errorText(problem: unknown, fallback: string) {
  return problem instanceof ApiError ? problem.message : fallback
}

export function AccountPage() {
  usePageTitle('Account — BRIX Studio')
  const { user, updateProfile, changePassword, exportAccount, deleteAccount, signOut } = useAuth()
  const navigate = useNavigate()

  const [name, setName] = useState(user?.name ?? '')
  const [profileState, setProfileState] = useState<{ tone: 'ok' | 'error'; message: string } | null>(null)
  const [profileSaving, setProfileSaving] = useState(false)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordState, setPasswordState] = useState<{ tone: 'ok' | 'error'; message: string } | null>(null)
  const [passwordSaving, setPasswordSaving] = useState(false)

  const [workspaces, setWorkspaces] = useState<WorkspaceSummary[]>(user?.workspaces ?? [])
  const [selectedId, setSelectedId] = useState<string | null>(user?.workspaces[0]?.id ?? null)
  const [members, setMembers] = useState<WorkspaceMember[]>([])
  const [membersLoading, setMembersLoading] = useState(false)
  const [workspaceName, setWorkspaceName] = useState('')
  const [workspaceState, setWorkspaceState] = useState<{ tone: 'ok' | 'error'; message: string } | null>(null)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'editor' | 'viewer'>('editor')
  const [inviteState, setInviteState] = useState<{ tone: 'ok' | 'error'; message: string } | null>(null)

  const [dataState, setDataState] = useState<{ tone: 'ok' | 'error'; message: string } | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deletePassword, setDeletePassword] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [deleteState, setDeleteState] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    setName(user?.name ?? '')
  }, [user?.name])

  useEffect(() => {
    setWorkspaces(user?.workspaces ?? [])
    if (!selectedId && user?.workspaces.length) setSelectedId(user.workspaces[0].id)
  }, [user?.workspaces, selectedId])

  useEffect(() => {
    if (!selectedId) {
      setMembers([])
      return
    }
    let alive = true
    setMembersLoading(true)
    api
      .get<{ ok: true; members: WorkspaceMember[] }>(`/api/v1/workspaces/${selectedId}/members`)
      .then((result) => {
        if (alive) setMembers(result.members)
      })
      .catch(() => {
        if (alive) setMembers([])
      })
      .finally(() => {
        if (alive) setMembersLoading(false)
      })
    return () => {
      alive = false
    }
  }, [selectedId])

  if (!user) return null

  const selectedWorkspace = workspaces.find((workspace) => workspace.id === selectedId) ?? null
  const canManage = selectedWorkspace?.role === 'owner' || user.role === 'admin'

  const saveProfile = async (event: FormEvent) => {
    event.preventDefault()
    setProfileState(null)
    setProfileSaving(true)
    try {
      await updateProfile(name)
      setProfileState({ tone: 'ok', message: 'Profile updated.' })
    } catch (problem) {
      setProfileState({ tone: 'error', message: errorText(problem, 'Your profile could not be saved.') })
    } finally {
      setProfileSaving(false)
    }
  }

  const savePassword = async (event: FormEvent) => {
    event.preventDefault()
    setPasswordState(null)
    if (newPassword.length < 10) {
      setPasswordState({ tone: 'error', message: 'Use at least 10 characters for the new password.' })
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordState({ tone: 'error', message: 'The new passwords do not match.' })
      return
    }
    setPasswordSaving(true)
    try {
      await changePassword(currentPassword, newPassword)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setPasswordState({ tone: 'ok', message: 'Password changed. Other sessions were signed out.' })
    } catch (problem) {
      setPasswordState({ tone: 'error', message: errorText(problem, 'The password could not be changed.') })
    } finally {
      setPasswordSaving(false)
    }
  }

  const createWorkspace = async (event: FormEvent) => {
    event.preventDefault()
    setWorkspaceState(null)
    try {
      const result = await api.post<{ ok: true; workspace: WorkspaceSummary }>('/api/v1/workspaces', {
        name: workspaceName,
      })
      setWorkspaces((current) => [...current, result.workspace])
      setSelectedId(result.workspace.id)
      setWorkspaceName('')
      setWorkspaceState({ tone: 'ok', message: `Workspace "${result.workspace.name}" created.` })
    } catch (problem) {
      setWorkspaceState({ tone: 'error', message: errorText(problem, 'The workspace could not be created.') })
    }
  }

  const inviteMember = async (event: FormEvent) => {
    event.preventDefault()
    if (!selectedWorkspace) return
    setInviteState(null)
    try {
      const result = await api.post<{ ok: true; member: WorkspaceMember }>(
        `/api/v1/workspaces/${selectedWorkspace.id}/members`,
        { email: inviteEmail, role: inviteRole },
      )
      setMembers((current) => [...current, result.member])
      setInviteEmail('')
      setInviteState({ tone: 'ok', message: `${result.member.name} added as ${result.member.role}.` })
    } catch (problem) {
      setInviteState({ tone: 'error', message: errorText(problem, 'That person could not be added.') })
    }
  }

  const exportData = async () => {
    setDataState(null)
    try {
      await exportAccount()
      setDataState({ tone: 'ok', message: 'Account export downloaded.' })
    } catch (problem) {
      setDataState({ tone: 'error', message: errorText(problem, 'The export could not be created.') })
    }
  }

  const removeAccount = async () => {
    setDeleteState(null)
    if (deleteConfirm !== 'DELETE') {
      setDeleteState('Type DELETE to confirm.')
      return
    }
    setDeleting(true)
    try {
      await deleteAccount(deletePassword)
      navigate('/', { replace: true })
    } catch (problem) {
      setDeleteState(errorText(problem, 'The account could not be deleted.'))
    } finally {
      setDeleting(false)
    }
  }

  const leave = async () => {
    await signOut()
    navigate('/', { replace: true })
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow text-clay">
            <span className="h-px w-6 bg-clay" aria-hidden="true" />
            Account &amp; privacy
          </p>
          <h1 className="display mt-4 text-[clamp(2.4rem,4vw,3.4rem)] text-ink">Your account.</h1>
          <p className="mt-3 max-w-xl text-[13px] leading-relaxed text-ink/50">
            Manage your profile, password, workspaces and the data stored against your account.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge tone="beta">{roleLabels[user.role] ?? user.role}</Badge>
          <Badge tone="neutral">Joined {formatDate(user.createdAt)}</Badge>
        </div>
      </header>

      <div className="grid gap-4 xl:grid-cols-2">
        <section className="surface rounded-2xl p-6">
          <h2 className="text-[14px] font-semibold text-ink">Profile</h2>
          <form className="mt-5 space-y-4" onSubmit={saveProfile}>
            <FormField label="Name" required>
              <input className={fieldClass} value={name} onChange={(event) => setName(event.target.value)} />
            </FormField>
            <FormField label="Email" hint="Locked in this phase">
              <input className={fieldClass} value={user.email} readOnly disabled />
            </FormField>
            <StatusLine state={profileState} />
            <Button type="submit" size="md" disabled={profileSaving}>
              {profileSaving ? 'Saving…' : 'Save profile'}
            </Button>
          </form>
        </section>

        <section className="surface rounded-2xl p-6">
          <h2 className="flex items-center gap-2 text-[14px] font-semibold text-ink">
            <KeyRound className="h-4 w-4 text-cyan" />
            Password
          </h2>
          <form className="mt-5 space-y-4" onSubmit={savePassword}>
            <FormField label="Current password" required>
              <input
                type="password"
                autoComplete="current-password"
                className={fieldClass}
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
              />
            </FormField>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="New password" hint="10+ characters" required>
                <input
                  type="password"
                  autoComplete="new-password"
                  className={fieldClass}
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                />
              </FormField>
              <FormField label="Confirm new" required>
                <input
                  type="password"
                  autoComplete="new-password"
                  className={fieldClass}
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                />
              </FormField>
            </div>
            <StatusLine state={passwordState} />
            <Button type="submit" size="md" disabled={passwordSaving}>
              {passwordSaving ? 'Updating…' : 'Change password'}
            </Button>
          </form>
        </section>
      </div>

      <section id="workspaces" className="surface rounded-2xl p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 text-[14px] font-semibold text-ink">
            <Users className="h-4 w-4 text-cyan" />
            Workspaces
          </h2>
          <span className="text-[10.5px] text-ink/35">Owner, editor and viewer roles</span>
        </div>

        <div className="mt-5 grid gap-6 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
          <div className="space-y-3">
            <ul className="space-y-2">
              {workspaces.map((workspace) => (
                <li key={workspace.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(workspace.id)}
                    className={`flex w-full items-center justify-between gap-3 rounded-xl border px-3.5 py-3 text-left transition-colors ${
                      workspace.id === selectedId
                        ? 'border-clay/40 bg-clay/10'
                        : 'border-ink/10 bg-ink/[0.02] hover:border-ink/25'
                    }`}
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-[12.5px] font-medium text-ink">{workspace.name}</span>
                      <span className="text-[10px] uppercase tracking-[0.14em] text-ink/35">{workspace.kind}</span>
                    </span>
                    <Badge tone="neutral">{workspace.role}</Badge>
                  </button>
                </li>
              ))}
            </ul>

            <form className="flex gap-2" onSubmit={createWorkspace}>
              <input
                className={fieldClass}
                placeholder="New project workspace"
                value={workspaceName}
                onChange={(event) => setWorkspaceName(event.target.value)}
              />
              <Button type="submit" variant="secondary" size="md" aria-label="Create workspace">
                <Plus className="h-4 w-4" />
              </Button>
            </form>
            <StatusLine state={workspaceState} />
          </div>

          <div className="rounded-xl border border-ink/10 bg-ink/[0.02] p-4">
            {selectedWorkspace ? (
              <>
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[12.5px] font-semibold text-ink">{selectedWorkspace.name}</p>
                  <span className="text-[10px] uppercase tracking-[0.14em] text-ink/35">Members</span>
                </div>
                {membersLoading ? (
                  <p className="mt-4 text-[11.5px] text-ink/35">Loading members…</p>
                ) : (
                  <ul className="mt-3 divide-y divide-ink/8">
                    {members.map((member) => (
                      <li key={member.id} className="flex items-center justify-between gap-3 py-2.5">
                        <span className="min-w-0">
                          <span className="block truncate text-[12px] text-ink/80">{member.name}</span>
                          <span className="block truncate text-[10px] text-ink/35">{member.email}</span>
                        </span>
                        <Badge tone="neutral">{member.role}</Badge>
                      </li>
                    ))}
                  </ul>
                )}

                {canManage ? (
                  <form className="mt-4 space-y-2 border-t border-ink/10 pt-4" onSubmit={inviteMember}>
                    <div className="flex gap-2">
                      <input
                        type="email"
                        className={fieldClass}
                        placeholder="teammate@email.com"
                        value={inviteEmail}
                        onChange={(event) => setInviteEmail(event.target.value)}
                      />
                      <select
                        className={`${fieldClass} max-w-[110px]`}
                        value={inviteRole}
                        onChange={(event) => setInviteRole(event.target.value as 'editor' | 'viewer')}
                      >
                        <option value="editor">Editor</option>
                        <option value="viewer">Viewer</option>
                      </select>
                    </div>
                    <Button type="submit" variant="secondary" size="sm">
                      <UserPlus className="h-3.5 w-3.5" />
                      Add member
                    </Button>
                    <StatusLine state={inviteState} />
                  </form>
                ) : (
                  <p className="mt-4 border-t border-ink/10 pt-4 text-[10.5px] text-ink/35">
                    Only the workspace owner can invite or remove people.
                  </p>
                )}
              </>
            ) : (
              <p className="text-[11.5px] text-ink/35">Select a workspace to see its members.</p>
            )}
          </div>
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-2">
        <section className="surface rounded-2xl p-6">
          <h2 className="text-[14px] font-semibold text-ink">Your data</h2>
          <p className="mt-3 text-[12px] leading-relaxed text-ink/50">
            Download a JSON copy of your account, workspaces, upload metadata and recent security
            activity. Uploaded file contents stay available from the Files page.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button type="button" variant="secondary" size="md" onClick={exportData}>
              <Download className="h-4 w-4" />
              Export account data
            </Button>
            <Button type="button" variant="ghost" size="md" onClick={leave}>
              <LogOut className="h-4 w-4" />
              Sign out
            </Button>
          </div>
          <StatusLine state={dataState} />
        </section>

        <section className="rounded-2xl border border-danger/25 bg-danger/[0.04] p-6">
          <h2 className="text-[14px] font-semibold text-danger">Delete account</h2>
          <p className="mt-3 text-[12px] leading-relaxed text-ink/50">
            Permanently remove your login, sessions, workspace memberships and uploaded files. Export
            anything you need first. This action cannot be undone.
          </p>
          <Button
            type="button"
            variant="secondary"
            size="md"
            className="mt-4 border-danger/40 bg-danger/10 text-danger hover:border-danger/60 hover:bg-danger/15"
            onClick={() => {
              setDeleteOpen(true)
              setDeleteState(null)
            }}
          >
            <Trash2 className="h-4 w-4" />
            Delete my account
          </Button>
        </section>
      </div>

      <Modal
        open={deleteOpen}
        onClose={() => {
          if (!deleting) setDeleteOpen(false)
        }}
        title="Delete your account"
        description="This removes your login, sessions, memberships and all uploaded files."
      >
        <div className="space-y-4 p-6 sm:p-8">
          <FormField label="Password" required>
            <input
              type="password"
              autoComplete="current-password"
              className={fieldClass}
              value={deletePassword}
              onChange={(event) => setDeletePassword(event.target.value)}
            />
          </FormField>
          <FormField label="Type DELETE to confirm" required>
            <input
              className={fieldClass}
              value={deleteConfirm}
              onChange={(event) => setDeleteConfirm(event.target.value)}
            />
          </FormField>
          <FormError message={deleteState} />
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="secondary"
              size="md"
              className="border-danger/40 bg-danger/10 text-danger hover:border-danger/60 hover:bg-danger/15"
              onClick={removeAccount}
              disabled={deleting}
            >
              {deleting ? 'Deleting…' : 'Permanently delete'}
            </Button>
            <Button type="button" variant="ghost" size="md" onClick={() => setDeleteOpen(false)} disabled={deleting}>
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

function StatusLine({ state }: { state: { tone: 'ok' | 'error'; message: string } | null }) {
  if (!state) return null
  return (
    <p
      className={`text-[11.5px] ${state.tone === 'ok' ? 'text-cyan' : 'text-danger'}`}
      role={state.tone === 'error' ? 'alert' : 'status'}
    >
      {state.message}
    </p>
  )
}

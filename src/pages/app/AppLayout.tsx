import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  ArrowUpRight,
  FolderOpen,
  LayoutDashboard,
  LogOut,
  ShieldCheck,
  Sparkles,
  UserRound,
} from 'lucide-react'
import { Logo } from '../../components/layout/Logo'
import { useAuth } from '../../features/auth/AuthContext'
import { cx } from '../../lib/cx'

const roleLabels: Record<string, string> = {
  user: 'Free account',
  client: 'Studio client',
  admin: 'Administrator',
}

export function AppLayout() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  if (!user) return null

  const initials =
    user.name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('') || 'B'

  const nav = [
    { to: '/app', label: 'Overview', icon: LayoutDashboard, end: true },
    { to: '/app/tools', label: 'Tools', icon: Sparkles, end: false },
    { to: '/app/files', label: 'Files', icon: FolderOpen, end: false },
    { to: '/app/account', label: 'Account', icon: UserRound, end: false },
    ...(user.role === 'admin'
      ? [{ to: '/app/admin', label: 'Admin', icon: ShieldCheck, end: false }]
      : []),
  ]

  const leave = async () => {
    await signOut()
    navigate('/', { replace: true })
  }

  return (
    <div className="page-canvas flex min-h-screen">
      <aside className="sticky top-0 hidden h-screen w-[272px] shrink-0 flex-col border-r border-ink/10 bg-ink-soft/45 px-5 py-6 backdrop-blur-xl lg:flex">
        <Logo />

        <div className="mt-8 flex items-center gap-3 rounded-2xl border border-ink/10 bg-ink/[0.03] p-3.5">
          <span className="gradient-brand grid h-10 w-10 shrink-0 place-items-center rounded-full text-[12px] font-bold text-white">
            {initials}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-[13px] font-semibold text-ink">{user.name}</span>
            <span className="mt-0.5 block truncate text-[10.5px] text-ink/40">
              {roleLabels[user.role] ?? user.role}
            </span>
          </span>
        </div>

        <nav className="mt-7 flex flex-col gap-1" aria-label="Workspace navigation">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cx(
                  'flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-[12.5px] font-semibold transition-colors',
                  isActive
                    ? 'border border-clay/30 bg-clay/15 text-ink'
                    : 'border border-transparent text-ink/50 hover:bg-ink/5 hover:text-ink',
                )
              }
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto space-y-3 pt-6">
          <NavLink
            to="/start"
            className="flex items-center justify-between rounded-xl border border-ink/12 px-3.5 py-3 text-[12px] font-semibold text-ink/60 transition-colors hover:border-clay/50 hover:text-ink"
          >
            Project builder
            <ArrowUpRight className="h-3.5 w-3.5" />
          </NavLink>
          <button
            type="button"
            onClick={leave}
            className="flex w-full items-center gap-2 rounded-xl px-3.5 py-2.5 text-left text-[12px] font-semibold text-ink/40 transition-colors hover:bg-ink/5 hover:text-ink"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sign out
          </button>
          <p className="px-1 text-[9.5px] uppercase tracking-[0.16em] text-ink/25">
            Phase 0 · Foundation
          </p>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 border-b border-ink/10 bg-bone/85 backdrop-blur-xl lg:hidden">
          <div className="flex h-16 items-center justify-between gap-4 px-5">
            <Logo />
            <div className="flex items-center gap-2">
              <span className="grid h-9 w-9 place-items-center rounded-full border border-ink/15 text-[10px] font-bold text-ink/70">
                {initials}
              </span>
              <button
                type="button"
                onClick={leave}
                className="grid h-9 w-9 place-items-center rounded-full border border-ink/15 text-ink/60"
                aria-label="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
          <nav className="flex gap-2 overflow-x-auto px-4 pb-3" aria-label="Workspace navigation">
            {nav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cx(
                    'inline-flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-2 text-[11.5px] font-semibold transition-colors',
                    isActive
                      ? 'border-clay/35 bg-clay/15 text-ink'
                      : 'border-ink/12 text-ink/50',
                  )
                }
              >
                <item.icon className="h-3.5 w-3.5" />
                {item.label}
              </NavLink>
            ))}
          </nav>
        </header>

        <main className="flex-1">
          <div className="shell-wide py-8 lg:py-10">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}

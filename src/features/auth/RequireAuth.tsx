import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { Logo } from '../../components/layout/Logo'
import { useAuth } from './AuthContext'

export function AuthLoadingScreen() {
  return (
    <div className="page-canvas flex min-h-screen flex-col items-center justify-center gap-6">
      <Logo />
      <span
        className="h-5 w-5 animate-spin rounded-full border-2 border-ink/20 border-t-clay"
        aria-label="Loading"
      />
    </div>
  )
}

export function RequireAuth() {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) return <AuthLoadingScreen />
  if (!user) {
    const next = encodeURIComponent(`${location.pathname}${location.search}`)
    return <Navigate to={`/sign-in?next=${next}`} replace />
  }
  return <Outlet />
}

export function RequireAdmin() {
  const { user, loading } = useAuth()

  if (loading) return <AuthLoadingScreen />
  if (!user) return <Navigate to="/sign-in" replace />
  if (user.role !== 'admin') return <Navigate to="/app" replace />
  return <Outlet />
}

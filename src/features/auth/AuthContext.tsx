import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { ApiError, api, downloadFile, type SessionUser } from '../../lib/api'

interface AuthContextValue {
  user: SessionUser | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<SessionUser>
  signUp: (input: { name: string; email: string; password: string }) => Promise<SessionUser>
  signOut: () => Promise<void>
  refresh: () => Promise<SessionUser | null>
  updateProfile: (name: string) => Promise<SessionUser>
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>
  deleteAccount: (password: string) => Promise<void>
  exportAccount: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      const result = await api.get<{ ok: true; user: SessionUser }>('/api/v1/auth/me')
      setUser(result.user)
      return result.user
    } catch (error) {
      if (!(error instanceof ApiError) || error.status !== 401) {
        console.warn('[auth] session check failed:', error)
      }
      setUser(null)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const signIn = useCallback(async (email: string, password: string) => {
    const result = await api.post<{ ok: true; user: SessionUser }>('/api/v1/auth/login', { email, password })
    setUser(result.user)
    return result.user
  }, [])

  const signUp = useCallback(async (input: { name: string; email: string; password: string }) => {
    const result = await api.post<{ ok: true; user: SessionUser }>('/api/v1/auth/register', {
      ...input,
      acceptTerms: true,
    })
    setUser(result.user)
    return result.user
  }, [])

  const signOut = useCallback(async () => {
    try {
      await api.post('/api/v1/auth/logout')
    } finally {
      setUser(null)
    }
  }, [])

  const updateProfile = useCallback(async (name: string) => {
    const result = await api.patch<{ ok: true; user: SessionUser }>('/api/v1/account', { name })
    setUser(result.user)
    return result.user
  }, [])

  const changePassword = useCallback(async (currentPassword: string, newPassword: string) => {
    await api.post('/api/v1/account/password', { currentPassword, newPassword })
  }, [])

  const deleteAccount = useCallback(async (password: string) => {
    await api.del('/api/v1/account', { password, confirm: 'DELETE' })
    setUser(null)
  }, [])

  const exportAccount = useCallback(async () => {
    await downloadFile('/api/v1/account/export', 'brix-account-export.json')
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      signIn,
      signUp,
      signOut,
      refresh,
      updateProfile,
      changePassword,
      deleteAccount,
      exportAccount,
    }),
    [user, loading, signIn, signUp, signOut, refresh, updateProfile, changePassword, deleteAccount, exportAccount],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider')
  return context
}

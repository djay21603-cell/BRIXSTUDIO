import { useEffect, useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { AuthShell, safeNext } from './AuthShell'
import { useAuth } from '../../features/auth/AuthContext'
import { FormError, FormField, fieldClass } from '../../components/ui/FormField'
import { Button } from '../../components/ui/Button'
import { usePageTitle } from '../../hooks/usePageTitle'
import { ApiError } from '../../lib/api'

export function SignInPage() {
  usePageTitle('Sign in — BRIX Studio')
  const { user, loading, signIn } = useAuth()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const next = safeNext(params.get('next'))
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!loading && user) navigate(next, { replace: true })
  }, [loading, user, navigate, next])

  if (!loading && user) return <Navigate to={next} replace />

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await signIn(email, password)
      navigate(next, { replace: true })
    } catch (problem) {
      setError(problem instanceof ApiError ? problem.message : 'Sign in failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthShell
      eyebrow="Welcome back"
      title="Sign in to your studio workspace."
      description="Pick up your projects, uploads and client workspaces exactly where you left them."
      footer={
        <>
          New to BRIX Studio?{' '}
          <Link to="/sign-up" className="font-semibold text-ink underline underline-offset-4">
            Create an account
          </Link>
        </>
      }
    >
      <form className="space-y-4" onSubmit={submit} noValidate>
        <FormField label="Email" required>
          <input
            type="email"
            autoComplete="email"
            required
            className={fieldClass}
            placeholder="you@business.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </FormField>
        <FormField label="Password" required>
          <input
            type="password"
            autoComplete="current-password"
            required
            className={fieldClass}
            placeholder="Your password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </FormField>

        <FormError message={error} />

        <Button type="submit" size="lg" className="w-full" disabled={submitting}>
          {submitting ? 'Signing in…' : 'Sign in'}
          {!submitting ? <ArrowRight className="h-4 w-4" /> : null}
        </Button>

        <p className="text-center text-[10.5px] leading-relaxed text-ink/35">
          Protected by a server-side session and same-origin request checks. By signing in you agree to
          the{' '}
          <Link to="/terms" className="underline underline-offset-4 hover:text-ink">
            terms
          </Link>{' '}
          and{' '}
          <Link to="/privacy" className="underline underline-offset-4 hover:text-ink">
            privacy policy
          </Link>
          .
        </p>
      </form>
    </AuthShell>
  )
}

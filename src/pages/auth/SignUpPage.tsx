import { useEffect, useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { AuthShell, safeNext } from './AuthShell'
import { useAuth } from '../../features/auth/AuthContext'
import { FormError, FormField, fieldClass } from '../../components/ui/FormField'
import { Button } from '../../components/ui/Button'
import { usePageTitle } from '../../hooks/usePageTitle'
import { ApiError } from '../../lib/api'

export function SignUpPage() {
  usePageTitle('Create account — BRIX Studio')
  const { user, loading, signUp } = useAuth()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const next = safeNext(params.get('next'))
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [accept, setAccept] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!loading && user) navigate(next, { replace: true })
  }, [loading, user, navigate, next])

  if (!loading && user) return <Navigate to={next} replace />

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)

    if (password.length < 10) {
      setError('Use at least 10 characters for your password.')
      return
    }
    if (password !== confirm) {
      setError('Those passwords do not match yet.')
      return
    }
    if (!accept) {
      setError('Please accept the terms of service and privacy policy.')
      return
    }

    setSubmitting(true)
    try {
      await signUp({ name, email, password })
      navigate(next, { replace: true })
    } catch (problem) {
      setError(problem instanceof ApiError ? problem.message : 'Your account could not be created.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthShell
      eyebrow="New account"
      title="Create your BRIX Studio account."
      description="One sign-in for tools, project workspaces and private file storage. Free while the platform is in its foundation phase."
      footer={
        <>
          Already have an account?{' '}
          <Link to="/sign-in" className="font-semibold text-ink underline underline-offset-4">
            Sign in
          </Link>
        </>
      }
    >
      <form className="space-y-4" onSubmit={submit} noValidate>
        <FormField label="Your name" required>
          <input
            autoComplete="name"
            required
            className={fieldClass}
            placeholder="Ada Mendoza"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </FormField>
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
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Password" hint="10+ characters" required>
            <input
              type="password"
              autoComplete="new-password"
              required
              className={fieldClass}
              placeholder="Choose a password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </FormField>
          <FormField label="Confirm" required>
            <input
              type="password"
              autoComplete="new-password"
              required
              className={fieldClass}
              placeholder="Repeat password"
              value={confirm}
              onChange={(event) => setConfirm(event.target.value)}
            />
          </FormField>
        </div>

        <label className="flex items-start gap-3 rounded-xl border border-ink/10 bg-ink/[0.03] p-3.5 text-[11.5px] leading-relaxed text-ink/55">
          <input
            type="checkbox"
            className="mt-0.5 h-4 w-4 shrink-0 accent-clay"
            checked={accept}
            onChange={(event) => setAccept(event.target.checked)}
          />
          <span>
            I agree to the{' '}
            <Link to="/terms" className="font-semibold text-ink underline underline-offset-4">
              terms of service
            </Link>{' '}
            and{' '}
            <Link to="/privacy" className="font-semibold text-ink underline underline-offset-4">
              privacy policy
            </Link>
            , including how my account data and uploads are stored.
          </span>
        </label>

        <FormError message={error} />

        <Button type="submit" size="lg" className="w-full" disabled={submitting}>
          {submitting ? 'Creating account…' : 'Create account'}
          {!submitting ? <ArrowRight className="h-4 w-4" /> : null}
        </Button>

        <p className="text-center text-[10.5px] leading-relaxed text-ink/35">
          No payment details are collected. Paid tools and credits are not enabled in this phase.
        </p>
      </form>
    </AuthShell>
  )
}

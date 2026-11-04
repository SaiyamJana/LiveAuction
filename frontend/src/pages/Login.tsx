import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { ApiRequestError } from '../api/client.ts'
import FormField from '../components/FormField.tsx'
import { useAuth } from '../context/auth-context.ts'
import { toFieldErrors, toFormMessage } from '../utils/fieldErrors.ts'
import type { FieldErrors } from '../utils/fieldErrors.ts'

interface LoginLocationState {
  registered?: boolean
  passwordReset?: boolean
  from?: string
}

function Login() {
  const { user, loading, login } = useAuth()
  const location = useLocation()
  const state = (location.state ?? {}) as LoginLocationState

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState('')
  const [locked, setLocked] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Already logged in (including right after a successful login): owner -> /owner, user -> /dashboard.
  if (!loading && user) {
    const target = user.role === 'owner' ? '/owner' : state.from && state.from !== '/login' ? state.from : '/dashboard'
    return <Navigate to={target} replace />
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setFormError('')
    setFieldErrors({})
    setLocked(false)
    setSubmitting(true)
    try {
      await login(email, password)
      // The redirect happens above once the user is stored in AuthContext.
    } catch (error) {
      if (error instanceof ApiRequestError && error.status === 423) {
        setLocked(true)
        setFormError(error.message)
      } else {
        const errors = toFieldErrors(error)
        setFieldErrors(errors)
        if (Object.keys(errors).length === 0) setFormError(toFormMessage(error))
      }
      setSubmitting(false)
    }
  }

  return (
    <section className="mx-auto max-w-md">
      <h1 className="text-2xl font-bold">Log in</h1>
      <p className="mt-2 text-sm text-muted">
        New here?{' '}
        <Link to="/register" className="text-primary underline">
          Create an account
        </Link>
      </p>

      {state.registered && (
        <p role="status" className="mt-4 rounded-lg border border-success/40 bg-success-soft px-3 py-2 text-sm text-success">
          Account created. Please log in.
        </p>
      )}
      {state.passwordReset && (
        <p role="status" className="mt-4 rounded-lg border border-success/40 bg-success-soft px-3 py-2 text-sm text-success">
          Password updated. Please log in with your new password.
        </p>
      )}

      <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-4">
        {formError && (
          <p role="alert"
            className={`rounded-lg border px-3 py-2 text-sm ${
              locked
                ? 'border-warning/40 bg-warning-soft text-warning'
                : 'border-danger/40 bg-danger-soft text-danger'
            }`}>
            {formError}
            {locked && (
              <>
                {' '}
                <Link to="/reset-password" className="underline">
                  Reset password
                </Link>
              </>
            )}
          </p>
        )}

        <FormField label="Email" name="email" type="email" autoComplete="email" value={email}
          onChange={(e) => setEmail(e.target.value)} error={fieldErrors.email} />
        <FormField label="Password" name="password" type="password" autoComplete="current-password"
          value={password} onChange={(e) => setPassword(e.target.value)} error={fieldErrors.password} />

        <button type="submit" disabled={submitting}
          className="w-full rounded bg-primary px-4 py-2 font-medium text-primary-fg hover:bg-primary-hover disabled:opacity-60">
          {submitting ? 'Logging in...' : 'Log in'}
        </button>
      </form>

      <p className="mt-4 text-sm">
        <Link to="/reset-password" className="text-muted underline hover:text-primary">
          Forgot your password?
        </Link>
      </p>
    </section>
  )
}

export default Login
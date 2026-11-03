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
      <p className="mt-2 text-sm text-slate-400">
        New here?{' '}
        <Link to="/register" className="text-white underline">
          Create an account
        </Link>
      </p>

      {state.registered && (
        <p role="status" className="mt-4 rounded border border-green-500/50 bg-green-500/10 px-3 py-2 text-sm text-green-300">
          Account created. Please log in.
        </p>
      )}
      {state.passwordReset && (
        <p role="status" className="mt-4 rounded border border-green-500/50 bg-green-500/10 px-3 py-2 text-sm text-green-300">
          Password updated. Please log in with your new password.
        </p>
      )}

      <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-4">
        {formError && (
          <p role="alert"
            className={`rounded border px-3 py-2 text-sm ${
              locked
                ? 'border-amber-500/50 bg-amber-500/10 text-amber-300'
                : 'border-red-500/50 bg-red-500/10 text-red-300'
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
          className="w-full rounded bg-slate-100 px-4 py-2 font-medium text-slate-900 hover:bg-white disabled:opacity-60">
          {submitting ? 'Logging in...' : 'Log in'}
        </button>
      </form>

      <p className="mt-4 text-sm">
        <Link to="/reset-password" className="text-slate-400 underline hover:text-white">
          Forgot your password?
        </Link>
      </p>
    </section>
  )
}

export default Login
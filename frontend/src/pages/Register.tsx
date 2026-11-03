import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { authApi } from '../api/auth.ts'
import FormField from '../components/FormField.tsx'
import { useAuth } from '../context/auth-context.ts'
import { toFieldErrors, toFormMessage } from '../utils/fieldErrors.ts'
import type { FieldErrors } from '../utils/fieldErrors.ts'

function Register() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()

  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [secureCode, setSecureCode] = useState('')
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (!loading && user) {
    return <Navigate to={user.role === 'owner' ? '/owner' : '/dashboard'} replace />
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setFormError('')

    // Quick checks for a faster response; the server validates everything again.
    const errors: FieldErrors = {}
    if (password !== confirmPassword) errors.confirmPassword = 'Passwords do not match'
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }
    setFieldErrors({})

    setSubmitting(true)
    try {
      await authApi.register({ username, email, password, confirmPassword, secureCode })
      navigate('/login', { replace: true, state: { registered: true } })
    } catch (error) {
      const errors = toFieldErrors(error)
      setFieldErrors(errors)
      if (Object.keys(errors).length === 0) setFormError(toFormMessage(error))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="mx-auto max-w-md">
      <h1 className="text-2xl font-bold">Create an account</h1>
      <p className="mt-2 text-sm text-slate-400">
        Already registered?{' '}
        <Link to="/login" className="text-white underline">
          Log in
        </Link>
      </p>

      <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-4">
        {formError && (
          <p role="alert" className="rounded border border-red-500/50 bg-red-500/10 px-3 py-2 text-sm text-red-300">
            {formError}
          </p>
        )}

        <FormField label="Username" name="username" autoComplete="username" value={username}
          onChange={(e) => setUsername(e.target.value)} error={fieldErrors.username} />
        <FormField label="Email" name="email" type="email" autoComplete="email" value={email}
          onChange={(e) => setEmail(e.target.value)} error={fieldErrors.email} />
        <FormField label="Password" name="password" type="password" autoComplete="new-password"
          value={password} onChange={(e) => setPassword(e.target.value)}
          hint="At least 8 characters." error={fieldErrors.password} />
        <FormField label="Confirm password" name="confirmPassword" type="password"
          autoComplete="new-password" value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)} error={fieldErrors.confirmPassword} />
        <FormField label="Secure code" name="secureCode" type="password" autoComplete="off"
          value={secureCode} onChange={(e) => setSecureCode(e.target.value)}
          hint="At least 6 characters, different from your password. You need it to reset your password or delete your account."
          error={fieldErrors.secureCode} />

        <button type="submit" disabled={submitting}
          className="w-full rounded bg-slate-100 px-4 py-2 font-medium text-slate-900 hover:bg-white disabled:opacity-60">
          {submitting ? 'Creating account...' : 'Register'}
        </button>
      </form>
    </section>
  )
}

export default Register
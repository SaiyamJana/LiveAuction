import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authApi } from '../api/auth.ts'
import FormField from '../components/FormField.tsx'
import { useAuth } from '../context/auth-context.ts'
import { toFieldErrors, toFormMessage } from '../utils/fieldErrors.ts'
import type { FieldErrors } from '../utils/fieldErrors.ts'

function ResetPassword() {
  const navigate = useNavigate()
  const { clearUser } = useAuth()

  const [email, setEmail] = useState('')
  const [secureCode, setSecureCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setFormError('')

    if (newPassword !== confirmPassword) {
      setFieldErrors({ confirmPassword: 'Passwords do not match' })
      return
    }
    setFieldErrors({})

    setSubmitting(true)
    try {
      await authApi.resetPassword({ email, secureCode, newPassword })
      clearUser() // the server ended every session, including this browser's
      navigate('/login', { replace: true, state: { passwordReset: true } })
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
      <h1 className="text-2xl font-bold">Reset your password</h1>
      <p className="mt-2 text-sm text-muted">
        Enter your email, the secure code you chose at registration, and a new password.{' '}
        <Link to="/login" className="text-primary underline">
          Back to login
        </Link>
      </p>

      <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-4">
        {formError && (
          <p role="alert" className="rounded-lg border border-danger/40 bg-danger-soft px-3 py-2 text-sm text-danger">
            {formError}
          </p>
        )}

        <FormField label="Email" name="email" type="email" autoComplete="email" value={email}
          onChange={(e) => setEmail(e.target.value)} error={fieldErrors.email} />
        <FormField label="Secure code" name="secureCode" type="password" autoComplete="off"
          value={secureCode} onChange={(e) => setSecureCode(e.target.value)} error={fieldErrors.secureCode} />
        <FormField label="New password" name="newPassword" type="password" autoComplete="new-password"
          value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
          hint="At least 8 characters." error={fieldErrors.newPassword} />
        <FormField label="Confirm new password" name="confirmPassword" type="password"
          autoComplete="new-password" value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)} error={fieldErrors.confirmPassword} />

        <button type="submit" disabled={submitting}
          className="w-full rounded bg-primary px-4 py-2 font-medium text-primary-fg hover:bg-primary-hover disabled:opacity-60">
          {submitting ? 'Resetting...' : 'Reset password'}
        </button>
      </form>
    </section>
  )
}

export default ResetPassword
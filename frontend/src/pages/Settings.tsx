import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { authApi } from '../api/auth.ts'
import { ApiRequestError } from '../api/client.ts'
import FormField from '../components/FormField.tsx'
import { useAuth } from '../context/auth-context.ts'
import { toFieldErrors, toFormMessage } from '../utils/fieldErrors.ts'
import type { FieldErrors } from '../utils/fieldErrors.ts'

function ChangePasswordForm() {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState('')
  const [success, setSuccess] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setFormError('')
    setSuccess('')

    if (newPassword !== confirmPassword) {
      setFieldErrors({ confirmPassword: 'Passwords do not match' })
      return
    }
    setFieldErrors({})

    setSubmitting(true)
    try {
      const data = await authApi.changePassword({ currentPassword, newPassword })
      setSuccess(data.message)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (error) {
      const errors = toFieldErrors(error)
      setFieldErrors(errors)
      if (Object.keys(errors).length === 0) setFormError(toFormMessage(error))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="mt-4 space-y-4">
      {formError && (
        <p role="alert" className="rounded border border-red-500/50 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {formError}
        </p>
      )}
      {success && (
        <p role="status" className="rounded border border-green-500/50 bg-green-500/10 px-3 py-2 text-sm text-green-300">
          {success}
        </p>
      )}
      <FormField label="Current password" name="currentPassword" type="password" autoComplete="current-password"
        value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)}
        error={fieldErrors.currentPassword} />
      <FormField label="New password" name="newPassword" type="password" autoComplete="new-password"
        value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
        hint="At least 8 characters." error={fieldErrors.newPassword} />
      <FormField label="Confirm new password" name="confirmPassword" type="password" autoComplete="new-password"
        value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
        error={fieldErrors.confirmPassword} />
      <button type="submit" disabled={submitting}
        className="rounded bg-slate-100 px-4 py-2 font-medium text-slate-900 hover:bg-white disabled:opacity-60">
        {submitting ? 'Saving...' : 'Change password'}
      </button>
    </form>
  )
}

function DeleteAccountModal({ onClose }: { onClose: () => void }) {
  const { clearUser } = useAuth()
  const navigate = useNavigate()

  const [confirmation, setConfirmation] = useState('')
  const [secureCode, setSecureCode] = useState('')
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState('')
  const [blockers, setBlockers] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)

  const confirmed = confirmation === 'DELETE'

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!confirmed) return
    setFormError('')
    setBlockers([])
    setFieldErrors({})
    setSubmitting(true)
    try {
      await authApi.deleteAccount({ secureCode, confirmation })
      clearUser() // the server already cleared the cookie
      navigate('/', { replace: true })
    } catch (error) {
      if (error instanceof ApiRequestError && error.status === 409) {
        setFormError(error.message)
        setBlockers((error.errors ?? []).map((item) => item.message))
      } else {
        const errors = toFieldErrors(error)
        setFieldErrors(errors)
        if (Object.keys(errors).length === 0) setFormError(toFormMessage(error))
      }
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
      role="dialog" aria-modal="true" aria-labelledby="delete-title">
      <div className="w-full max-w-md rounded-lg border border-slate-700 bg-slate-900 p-6">
        <h3 id="delete-title" className="text-lg font-semibold text-red-400">Delete your account?</h3>
        <p className="mt-2 text-sm text-slate-300">
          This permanently deletes your account and cannot be undone. You will be logged out immediately.
        </p>

        <form onSubmit={handleSubmit} noValidate className="mt-4 space-y-4">
          {formError && (
            <div role="alert" className="rounded border border-red-500/50 bg-red-500/10 px-3 py-2 text-sm text-red-300">
              <p>{formError}</p>
              {blockers.length > 0 && (
                <ul className="mt-2 list-disc pl-5">
                  {blockers.map((message) => (
                    <li key={message}>{message}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <FormField label='Type "DELETE" to confirm' name="confirmation" autoComplete="off"
            value={confirmation} onChange={(e) => setConfirmation(e.target.value)}
            error={fieldErrors.confirmation} />
          <FormField label="Secure code" name="secureCode" type="password" autoComplete="off"
            value={secureCode} onChange={(e) => setSecureCode(e.target.value)} error={fieldErrors.secureCode} />

          <div className="flex justify-end gap-3">
            <button type="button" onClick={onClose} disabled={submitting}
              className="rounded border border-slate-600 px-4 py-2 text-sm hover:bg-slate-800 disabled:opacity-60">
              Cancel
            </button>
            <button type="submit" disabled={!confirmed || secureCode.length === 0 || submitting}
              className="rounded bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500 disabled:opacity-50">
              {submitting ? 'Deleting...' : 'Delete my account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function Settings() {
  const { user } = useAuth()
  const [showDelete, setShowDelete] = useState(false)
  const isOwner = user?.role === 'owner'

  return (
    <section className="mx-auto max-w-xl space-y-10">
      <div>
        <h1 className="text-2xl font-bold">Account settings</h1>
        <p className="mt-1 text-sm text-slate-400">
          {user?.username} &middot; {user?.email}
        </p>
      </div>

      <div>
        <h2 className="text-lg font-semibold">Change password</h2>
        <ChangePasswordForm />
      </div>

      <div className="rounded-lg border border-red-500/40 p-5">
        <h2 className="text-lg font-semibold text-red-400">Delete account</h2>
        {isOwner ? (
          <p className="mt-2 text-sm text-slate-400">The owner account cannot be deleted.</p>
        ) : (
          <>
            <p className="mt-2 text-sm text-slate-400">
              Permanently delete your account. You need your secure code. Deletion is blocked while you
              organize, captain or play in an active tournament.
            </p>
            <button type="button" onClick={() => setShowDelete(true)}
              className="mt-4 rounded border border-red-500 px-4 py-2 text-sm text-red-400 hover:bg-red-500/10">
              Delete my account
            </button>
          </>
        )}
      </div>

      {showDelete && <DeleteAccountModal onClose={() => setShowDelete(false)} />}
    </section>
  )
}

export default Settings
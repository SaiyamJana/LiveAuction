import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { tournamentRequestsApi } from '../api/tournamentRequests.ts'
import { ApiRequestError } from '../api/client.ts'
import FormField from '../components/FormField.tsx'
import TextAreaField from '../components/TextAreaField.tsx'
import Alert from '../components/ui/Alert.tsx'
import Button from '../components/ui/Button.tsx'
import { CheckIcon } from '../components/ui/icons.tsx'
import { toFieldErrors, toFormMessage } from '../utils/fieldErrors.ts'
import type { FieldErrors } from '../utils/fieldErrors.ts'

const NAME_MIN = 3
const NAME_MAX = 100
const DESCRIPTION_MIN = 10
const DESCRIPTION_MAX = 2000

// Same rules as the server; the server validates again.
function validate(name: string, description: string): FieldErrors {
  const errors: FieldErrors = {}
  const n = name.trim()
  const d = description.trim()
  if (n.length === 0) errors.name = 'Tournament name is required'
  else if (n.length < NAME_MIN) errors.name = `Name must be at least ${NAME_MIN} characters`
  else if (n.length > NAME_MAX) errors.name = `Name must be at most ${NAME_MAX} characters`

  if (d.length === 0) errors.description = 'Description is required'
  else if (d.length < DESCRIPTION_MIN) errors.description = `Description must be at least ${DESCRIPTION_MIN} characters`
  else if (d.length > DESCRIPTION_MAX) errors.description = `Description must be at most ${DESCRIPTION_MAX} characters`
  return errors
}

function RequestTournament() {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState('')
  const [hasPendingConflict, setHasPendingConflict] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submittedName, setSubmittedName] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setFormError('')
    setHasPendingConflict(false)

    const errors = validate(name, description)
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) return

    setSubmitting(true)
    try {
      const data = await tournamentRequestsApi.create({ name: name.trim(), description: description.trim() })
      setSubmittedName(data.request.name)
    } catch (error) {
      const serverErrors = toFieldErrors(error)
      setFieldErrors(serverErrors)
      if (Object.keys(serverErrors).length === 0) setFormError(toFormMessage(error))
      if (error instanceof ApiRequestError && error.status === 409) setHasPendingConflict(true)
    } finally {
      setSubmitting(false)
    }
  }

  function startAnother() {
    setName('')
    setDescription('')
    setFieldErrors({})
    setSubmittedName(null)
  }

  if (submittedName !== null) {
    return (
      <section className="mx-auto max-w-xl rounded-xl border border-line bg-surface p-6 text-center shadow-sm sm:p-8">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-success-soft text-success">
          <CheckIcon width={24} height={24} />
        </span>
        <h1 className="mt-4 text-2xl font-bold">Request sent</h1>
        <p className="mt-2 text-muted">
          Your request for <span className="font-semibold text-fg">{submittedName}</span> was sent to the owner. You will get a
          notification when it is reviewed.
        </p>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            to="/my-requests"
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-fg hover:bg-primary-hover"
          >
            View my requests
          </Link>
          <Button variant="secondary" onClick={startAnother}>
            Submit another
          </Button>
        </div>
      </section>
    )
  }

  return (
    <section className="mx-auto max-w-xl">
      <h1 className="text-2xl font-bold">Request a tournament</h1>
      <p className="mt-2 text-sm text-muted">
        Tell the owner about the tournament you would like to organize. If it is accepted, a draft tournament is created for
        you. You can have one pending request at a time.
      </p>

      <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-4 rounded-xl border border-line bg-surface p-5 shadow-sm sm:p-6">
        {formError && (
          <Alert tone={hasPendingConflict ? 'warning' : 'error'}>
            {formError}
            {hasPendingConflict && (
              <>
                {' '}
                <Link to="/my-requests" className="font-medium underline">
                  View my requests
                </Link>
              </>
            )}
          </Alert>
        )}

        <FormField
          label="Tournament name"
          name="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={fieldErrors.name}
          autoComplete="off"
          placeholder="e.g. Summer Hand Cricket Cup"
          hint={`${name.trim().length} / ${NAME_MAX}`}
        />
        <TextAreaField
          label="Description"
          name="description"
          rows={6}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          error={fieldErrors.description}
          counter={`${description.trim().length} / ${DESCRIPTION_MAX}`}
          placeholder="What is the tournament about, how many teams, when would it happen?"
        />

        <Button type="submit" loading={submitting} className="w-full">
          {submitting ? 'Sending...' : 'Send request'}
        </Button>
      </form>
    </section>
  )
}

export default RequestTournament

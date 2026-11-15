import { useState } from 'react'
import { Link } from 'react-router-dom'
import { registrationsApi } from '../../api/registrations.ts'
import type { OrganizerRegistrationDto } from '../../api/registrations.ts'
import TextAreaField from '../../components/TextAreaField.tsx'
import { AccountTypeChip, VerifiedBadge } from '../../components/ui/AccountBadges.tsx'
import Alert from '../../components/ui/Alert.tsx'
import Button from '../../components/ui/Button.tsx'
import ConfirmDialog from '../../components/ui/ConfirmDialog.tsx'
import Drawer from '../../components/ui/Drawer.tsx'
import StatusBadge from '../../components/ui/StatusBadge.tsx'
import Switch from '../../components/ui/Switch.tsx'
import { useToast } from '../../context/toast-context.ts'
import { countryName } from '../../data/countries.ts'
import { toFormMessage } from '../../utils/fieldErrors.ts'
import { formatDateTime } from '../../utils/format.ts'

interface Props {
  tournamentId: string
  registration: OrganizerRegistrationDto
  canDecide: boolean // false once the auction phase has started
  playersPath: string
  onClose: () => void
  onDecided: (registration: OrganizerRegistrationDto) => void
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[8.5rem_1fr] gap-3 py-2.5 text-sm">
      <dt className="text-subtle">{label}</dt>
      <dd className="min-w-0 font-medium wrap-break-word">{children}</dd>
    </div>
  )
}

function RegistrationReviewDrawer({ tournamentId, registration: r, canDecide, playersPath, onClose, onDecided }: Props) {
  const { toast } = useToast()
  const [message, setMessage] = useState('')
  const [verified, setVerified] = useState(r.isVerified)
  const [reasonError, setReasonError] = useState('')
  const [confirm, setConfirm] = useState<'accept' | 'reject' | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const trimmed = message.trim()

  function ask(decision: 'accept' | 'reject') {
    if (decision === 'reject' && trimmed.length < 3) {
      setReasonError('Tell the player why it was rejected (at least 3 characters).')
      document.getElementById('decision-message')?.focus()
      return
    }
    setReasonError('')
    setError('')
    setConfirm(decision)
  }

  async function submit() {
    if (!confirm || busy) return
    setBusy(true)
    setError('')
    try {
      const data = await registrationsApi.decide(tournamentId, r.id, {
        decision: confirm,
        ...(trimmed ? { response: trimmed } : {}),
        ...(confirm === 'accept' ? { isVerified: verified } : {}),
      })
      toast(confirm === 'accept' ? `${r.displayName} was accepted and added to Players` : `${r.displayName} was rejected`, 'success')
      setConfirm(null)
      onDecided(data.registration)
    } catch (err) {
      setError(toFormMessage(err))
    } finally {
      setBusy(false)
    }
  }

  const pending = r.status === 'pending'

  return (
    <>
      <Drawer
        title={r.displayName}
        subtitle={
          <span className="flex flex-wrap items-center gap-2">
            <StatusBadge status={r.status} /> <span className="text-xs text-subtle">Submitted {formatDateTime(r.submittedAt)}</span>
          </span>
        }
        onClose={onClose}
        busy={busy}
        footer={
          pending && canDecide ? (
            <div className="flex flex-wrap justify-end gap-3">
              <Button variant="danger" onClick={() => ask('reject')} disabled={busy}>
                Reject…
              </Button>
              <Button onClick={() => ask('accept')} disabled={busy}>
                Accept…
              </Button>
            </div>
          ) : undefined
        }
      >
        <dl className="divide-y divide-line">
          <Row label="Actual name">{r.actualName}</Row>
          <Row label="Display name">{r.displayName}</Row>
          <Row label="Username">{r.username ?? <span className="text-subtle">Deleted account</span>}</Row>
          <Row label="Account type">
            <AccountTypeChip type={r.accountType} />
          </Row>
          <Row label="Verification">
            <VerifiedBadge verified={r.isVerified} />
          </Row>
          <Row label="Contact">
            <a href={`tel:${r.contactNumber}`} className="text-primary tabular-nums hover:underline">
              {r.contactNumber}
            </a>
            <span className="font-normal text-subtle"> · {countryName(r.contactCountry)}</span>
          </Row>
          <Row label="Wants captain">{r.wantsCaptain ? 'Yes' : 'No'}</Row>
          {r.updatedAt !== r.submittedAt && <Row label="Last updated">{formatDateTime(r.updatedAt)}</Row>}
        </dl>

        {r.response && (
          <div className={`mt-5 rounded-xl border px-4 py-3 ${r.status === 'rejected' ? 'border-danger/30 bg-danger-soft' : 'border-line bg-surface-2'}`}>
            <p className="text-xs font-semibold tracking-wide text-subtle uppercase">Your response</p>
            <p className="mt-1 text-sm whitespace-pre-wrap wrap-break-word">{r.response}</p>
          </div>
        )}

        {r.status === 'accepted' && (
          <Alert tone="success" className="mt-5 animate-fade-up">
            Accepted. A player record was created and cannot be reversed from here.{' '}
            <Link to={playersPath} className="font-semibold underline">
              View players
            </Link>
          </Alert>
        )}
        {r.status === 'rejected' && (
          <Alert tone="info" className="mt-5 animate-fade-up">
            Rejected. The player can correct the details and resubmit while registration is open; it will then return to Pending.
          </Alert>
        )}

        {pending && !canDecide && <Alert tone="warning" className="mt-5">Registrations can only be reviewed before the auction starts.</Alert>}

        {pending && canDecide && (
          <div className="mt-6 space-y-5 rounded-2xl border border-line bg-surface-2/60 p-4">
            <p className="text-sm font-bold">Review</p>
            <Switch
              id="decision-verified"
              label="Mark account as verified"
              description="Tick this once you have checked the player's in-game account. Applied when you accept."
              checked={verified}
              onChange={setVerified}
              disabled={busy}
            />
            <TextAreaField
              label="Message to the player"
              name="decision-message"
              rows={3}
              value={message}
              disabled={busy}
              onChange={(e) => {
                setMessage(e.target.value)
                setReasonError('')
              }}
              hint="Optional when accepting. Required when rejecting."
              counter={`${message.length} / 1000`}
              maxLength={1000}
              error={reasonError || undefined}
            />
          </div>
        )}
      </Drawer>

      {confirm && (
        <ConfirmDialog
          title={confirm === 'accept' ? `Accept ${r.displayName}?` : `Reject ${r.displayName}?`}
          description={
            confirm === 'accept'
              ? `${r.displayName} will be added to the player pool${verified ? ' as a verified player' : ''} and notified. An accepted registration cannot be rejected afterwards.`
              : `${r.displayName} will be notified with your reason and can resubmit a corrected registration.`
          }
          confirmLabel={confirm === 'accept' ? 'Accept player' : 'Reject registration'}
          tone={confirm === 'accept' ? 'primary' : 'danger'}
          busy={busy}
          error={error}
          onConfirm={() => void submit()}
          onCancel={() => setConfirm(null)}
        >
          {trimmed && <p className="mt-3 rounded-lg bg-surface-2 px-3 py-2 text-sm whitespace-pre-wrap wrap-break-word">“{trimmed}”</p>}
        </ConfirmDialog>
      )}
    </>
  )
}

export default RegistrationReviewDrawer

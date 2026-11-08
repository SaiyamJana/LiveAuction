import { useState } from 'react'
import { Link } from 'react-router-dom'
import { tournamentsApi } from '../../api/tournaments.ts'
import type { NextAction, TournamentDetail, TournamentStatus } from '../../api/tournaments.ts'
import Alert from '../../components/ui/Alert.tsx'
import Button from '../../components/ui/Button.tsx'
import { AlertIcon, ArrowRightIcon } from '../../components/ui/icons.tsx'
import Modal from '../../components/ui/Modal.tsx'
import { useToast } from '../../context/toast-context.ts'
import { toFormMessage } from '../../utils/fieldErrors.ts'
import { ApiRequestError } from '../../api/client.ts'

interface ActionCopy {
  button: string
  title: string
  effect: string
}

// What each transition is called and what it will do. Backend rules are the source of truth;
// this is only wording.
const COPY: Record<TournamentStatus, ActionCopy> = {
  draft: { button: '', title: '', effect: '' },
  registration_open: {
    button: 'Open registration',
    title: 'Open registration?',
    effect: 'Players will be able to register for this tournament. Make sure your settings are ready: they can still be edited later.',
  },
  registration_closed: {
    button: 'Close registration',
    title: 'Close registration?',
    effect: 'No new players will be able to register. You can then move on to the auction.',
  },
  auction: {
    button: 'Start auction phase',
    title: 'Move to the auction phase?',
    effect: 'Team and points settings become locked and cannot be changed afterwards. This step cannot be undone.',
  },
  tournament_in_progress: {
    button: 'Start tournament',
    title: 'Start the tournament?',
    effect: 'The auction phase ends and the tournament is marked as in progress. This step cannot be undone.',
  },
  completed: {
    button: 'Mark as completed',
    title: 'Mark the tournament as completed?',
    effect: 'The tournament is finished. A completed tournament cannot be reopened or cancelled.',
  },
  cancelled: {
    button: 'Cancel tournament',
    title: 'Cancel this tournament?',
    effect: 'Players with a registration and team captains will be notified. A cancelled tournament cannot be reopened.',
  },
}

interface Props {
  tournament: TournamentDetail
  onChange: (tournament: TournamentDetail) => void
}

function LifecycleControls({ tournament, onChange }: Props) {
  const { toast } = useToast()
  const [target, setTarget] = useState<NextAction | null>(null)
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  // Only forward steps count as "next"; cancelling is a separate, quieter action.
  const next = tournament.nextActions.find((a) => a.to !== 'cancelled')
  const cancel = tournament.nextActions.find((a) => a.to === 'cancelled')
  const blockedNext = next && !next.allowed ? next : null
  const settingsPath = `/dashboard/organizer/tournaments/${tournament.id}/settings`

  function open(action: NextAction) {
    setTarget(action)
    setReason('')
    setError('')
  }

  function close() {
    if (busy) return
    setTarget(null)
    setError('')
  }

  async function confirm() {
    if (!target) return
    setBusy(true)
    setError('')
    try {
      const data = await tournamentsApi.changeStatus(tournament.id, target.to, target.to === 'cancelled' ? reason.trim() || undefined : undefined)
      onChange(data.tournament)
      toast(data.message, 'success')
      setTarget(null)
    } catch (err) {
      setError(
        err instanceof ApiRequestError && err.errors?.length
          ? `${err.message}: ${err.errors.map((e) => e.message).join(' ')}`
          : toFormMessage(err),
      )
    } finally {
      setBusy(false)
    }
  }

  if (!next && !cancel) {
    return <p className="text-sm text-subtle">This tournament's lifecycle is finished. No further status changes are possible.</p>
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        {next && (
          <Button onClick={() => open(next)} disabled={!next.allowed} className="shadow-card">
            {COPY[next.to].button}
            <ArrowRightIcon width={16} height={16} />
          </Button>
        )}
        {cancel && (
          <Button variant="secondary" onClick={() => open(cancel)} className="text-danger hover:bg-danger-soft">
            {COPY.cancelled.button}
          </Button>
        )}
      </div>

      {blockedNext && (
        <Alert tone="warning" className="mt-4 animate-fade-in">
          <p className="flex items-center gap-2 font-semibold">
            <AlertIcon width={16} height={16} /> {COPY[blockedNext.to].button} is blocked
          </p>
          <ul className="mt-1.5 list-disc space-y-0.5 pl-5">
            {blockedNext.blockers.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
          <Link to={settingsPath} className="mt-2 inline-block font-semibold underline underline-offset-2">
            Go to settings
          </Link>
        </Alert>
      )}

      {target && (
        <Modal title={COPY[target.to].title} onClose={close} busy={busy}>
          <p className="mt-2 text-sm text-muted">{COPY[target.to].effect}</p>

          {target.to === 'cancelled' && (
            <div className="mt-4">
              <label htmlFor="cancel-reason" className="block text-sm font-medium">
                Reason <span className="font-normal text-subtle">(optional, included in the notification)</span>
              </label>
              <textarea
                id="cancel-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                maxLength={300}
                rows={3}
                className="mt-1 w-full rounded-lg border border-line-strong bg-surface px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
          )}

          {error && <Alert tone="error" className="mt-4">{error}</Alert>}

          <div className="mt-6 flex justify-end gap-3">
            <Button variant="secondary" onClick={close} disabled={busy}>
              Not now
            </Button>
            <Button variant={target.to === 'cancelled' ? 'danger' : 'primary'} onClick={() => void confirm()} loading={busy}>
              {busy ? 'Working...' : COPY[target.to].button}
            </Button>
          </div>
        </Modal>
      )}
    </div>
  )
}

export default LifecycleControls

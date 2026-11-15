import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ApiRequestError } from '../api/client.ts'
import { publicTournamentsApi } from '../api/publicTournaments.ts'
import type { PublicTournamentDetail } from '../api/publicTournaments.ts'
import { registrationsApi } from '../api/registrations.ts'
import type { MyRegistrationResponse, RegistrationInput } from '../api/registrations.ts'
import MyRegistrationCard from '../components/MyRegistrationCard.tsx'
import RegistrationForm from '../components/RegistrationForm.tsx'
import RegistrationJourney from '../components/RegistrationJourney.tsx'
import Alert from '../components/ui/Alert.tsx'
import Button from '../components/ui/Button.tsx'
import { ArrowLeftIcon, ClockIcon, SearchIcon } from '../components/ui/icons.tsx'
import Skeleton from '../components/ui/Skeleton.tsx'
import TournamentStatusBadge from '../components/ui/TournamentStatusBadge.tsx'
import { useToast } from '../context/toast-context.ts'
import { toFormMessage } from '../utils/fieldErrors.ts'
import { formatDateTime } from '../utils/format.ts'

type State =
  | { kind: 'loading' }
  | { kind: 'notFound' }
  | { kind: 'error'; message: string }
  | { kind: 'ready'; tournament: PublicTournamentDetail; mine: MyRegistrationResponse }

type Banner = 'submitted' | 'resubmitted' | null

// /t/:slug/register  (logged-in users only: the router sends visitors to /login and brings
// them back here afterwards). One page handles every state of the player's journey:
// not registered -> form, pending/accepted -> status card, rejected -> status card + edit form.
function RegisterAsPlayer() {
  const { slug = '' } = useParams()
  const { toast } = useToast()
  const [state, setState] = useState<State>({ kind: 'loading' })
  const [attempt, setAttempt] = useState(0)
  const [editing, setEditing] = useState(false)
  const [banner, setBanner] = useState<Banner>(null)

  useEffect(() => {
    const controller = new AbortController()
    setState({ kind: 'loading' })
    publicTournamentsApi
      .get(slug, controller.signal)
      .then(async ({ tournament }) => {
        const mine = await registrationsApi.mine(tournament.id, controller.signal)
        if (!controller.signal.aborted) setState({ kind: 'ready', tournament, mine })
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted || (err instanceof DOMException && err.name === 'AbortError')) return
        if (err instanceof ApiRequestError && err.status === 404) setState({ kind: 'notFound' })
        else setState({ kind: 'error', message: toFormMessage(err) })
      })
    return () => controller.abort()
  }, [slug, attempt])

  const refreshMine = useCallback(async (tournament: PublicTournamentDetail): Promise<MyRegistrationResponse> => {
    const mine = await registrationsApi.mine(tournament.id)
    setState({ kind: 'ready', tournament, mine })
    return mine
  }, [])

  const back = (
    <Link to={`/t/${slug}`} className="inline-flex items-center gap-2 text-sm font-medium text-muted transition-colors hover:text-fg">
      <ArrowLeftIcon width={16} height={16} /> Back to tournament
    </Link>
  )

  if (state.kind === 'loading') {
    return (
      <section className="mx-auto max-w-3xl" aria-busy="true" aria-label="Loading registration">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="mt-6 h-9 w-72 max-w-full" />
        <Skeleton className="mt-6 h-16 w-full rounded-2xl" />
        <Skeleton className="mt-6 h-72 w-full rounded-2xl" />
      </section>
    )
  }

  if (state.kind === 'notFound') {
    return (
      <section className="mx-auto max-w-md py-16 text-center animate-fade-up">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-2 text-subtle">
          <SearchIcon width={26} height={26} />
        </span>
        <h1 className="mt-5 text-2xl font-bold">Tournament not found</h1>
        <p className="mt-2 text-muted">This tournament doesn't exist or isn't public.</p>
        <Link to="/tournaments" className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-fg hover:bg-primary-hover">
          Browse tournaments
        </Link>
      </section>
    )
  }

  if (state.kind === 'error') {
    return (
      <section className="mx-auto max-w-md space-y-3 py-16 text-center">
        <Alert tone="error">{state.message}</Alert>
        <Button variant="secondary" onClick={() => setAttempt((n) => n + 1)}>
          Try again
        </Button>
      </section>
    )
  }

  const { tournament: t, mine } = state
  const registration = mine.registration

  async function handleCreate(input: RegistrationInput) {
    try {
      const data = await registrationsApi.create(t.id, input)
      setState({ kind: 'ready', tournament: t, mine: { ...mine, registration: data.registration } })
      setBanner('submitted')
      toast('Registration submitted', 'success')
    } catch (err) {
      // Duplicate (another tab) or registration just closed: show the real current state instead.
      if (err instanceof ApiRequestError && err.status === 409) {
        const fresh = await refreshMine(t).catch(() => null)
        if (fresh && (fresh.registration || !fresh.registrationOpen)) {
          toast(err.message, 'info')
          return
        }
      }
      throw err
    }
  }

  async function handleResubmit(input: RegistrationInput) {
    try {
      const data = await registrationsApi.resubmit(t.id, input)
      setState({ kind: 'ready', tournament: t, mine: { ...mine, registration: data.registration } })
      setEditing(false)
      setBanner('resubmitted')
      toast('Registration resubmitted for review', 'success')
    } catch (err) {
      if (err instanceof ApiRequestError && err.status === 409) {
        const fresh = await refreshMine(t).catch(() => null)
        if (fresh) {
          setEditing(false)
          toast(err.message, 'info')
          return
        }
      }
      throw err
    }
  }

  let content
  if (mine.isOrganizer) {
    content = (
      <Alert tone="info">
        You organize this tournament, so you can't register as a player in it.{' '}
        <Link to={`/dashboard/organizer/tournaments/${t.id}`} className="font-semibold underline">
          Manage tournament
        </Link>
      </Alert>
    )
  } else if (!registration && !mine.registrationOpen) {
    content = (
      <div className="rounded-2xl border border-dashed border-line-strong bg-surface p-8 text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-2 text-subtle">
          <ClockIcon width={24} height={24} />
        </span>
        <h2 className="mt-4 text-lg font-bold">Registration isn't open</h2>
        <p className="mt-1 text-sm text-muted">{mine.closedReason ?? 'Registration is closed for this tournament.'}</p>
        {t.tournament_timeline.registrationStart && t.status === 'registration_open' && (
          <p className="mt-1 text-xs text-subtle">Window: {formatDateTime(t.tournament_timeline.registrationStart)}</p>
        )}
      </div>
    )
  } else if (!registration) {
    content = (
      <div className="space-y-4">
        {t.tournament_timeline.registrationClose && (
          <p className="text-sm text-muted">
            Registration closes <span className="font-semibold text-fg">{formatDateTime(t.tournament_timeline.registrationClose)}</span>.
          </p>
        )}
        <RegistrationForm mode="create" onSubmit={handleCreate} />
      </div>
    )
  } else if (editing && registration.status === 'rejected') {
    content = (
      <div className="space-y-4">
        {registration.response && (
          <Alert tone="warning">
            <span className="font-semibold">Organizer's reason:</span> {registration.response}
          </Alert>
        )}
        <RegistrationForm mode="resubmit" initial={registration} onSubmit={handleResubmit} onCancel={() => setEditing(false)} />
      </div>
    )
  } else {
    content = (
      <div className="space-y-4">
        {banner && (
          <Alert tone="success" className="animate-fade-up">
            {banner === 'submitted'
              ? "Registration submitted! The organizer will review it, and you'll get a notification (see the bell in the top bar) as soon as they decide."
              : 'Resubmitted! Your registration is back in the review queue with a clean slate.'}
          </Alert>
        )}
        <MyRegistrationCard
          registration={registration}
          tournamentName={t.name}
          registrationOpen={mine.registrationOpen}
          closedReason={mine.closedReason}
          onEdit={() => {
            setBanner(null)
            setEditing(true)
          }}
        />
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <Link to={`/t/${slug}`} className="font-semibold text-primary hover:underline">
            View tournament page
          </Link>
          <Link to="/tournaments" className="text-muted hover:text-fg">
            Browse other tournaments
          </Link>
        </div>
      </div>
    )
  }

  const contentKey = mine.isOrganizer ? 'org' : editing ? 'edit' : registration ? `card-${registration.status}` : mine.registrationOpen ? 'form' : 'closed'

  return (
    <section className="mx-auto max-w-3xl">
      {back}
      <header className="mt-5 animate-fade-up">
        <TournamentStatusBadge status={t.status} />
        <h1 className="mt-3 text-3xl font-extrabold wrap-break-word">{editing ? 'Edit your registration' : registration ? 'Your registration' : 'Register as a player'}</h1>
        <p className="mt-1 text-muted">
          for <span className="font-semibold text-fg">{t.name}</span>
        </p>
      </header>

      {!mine.isOrganizer && (
        <div className="mt-6 rounded-2xl border border-line bg-surface p-5 shadow-card animate-fade-up" style={{ animationDelay: '60ms' }}>
          <RegistrationJourney status={registration?.status ?? null} />
        </div>
      )}

      <div key={contentKey} className="mt-6 animate-fade-up">
        {content}
      </div>
    </section>
  )
}

export default RegisterAsPlayer

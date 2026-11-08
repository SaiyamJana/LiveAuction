import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ApiRequestError } from '../../api/client.ts'
import { publicTournamentsApi } from '../../api/publicTournaments.ts'
import type { PublicTournamentDetail } from '../../api/publicTournaments.ts'
import Alert from '../../components/ui/Alert.tsx'
import Button from '../../components/ui/Button.tsx'
import { ArrowLeftIcon, CalendarIcon, PhoneIcon, SearchIcon, TrophyIcon, UsersIcon } from '../../components/ui/icons.tsx'
import Skeleton from '../../components/ui/Skeleton.tsx'
import TournamentStatusBadge, { TOURNAMENT_STATUS } from '../../components/ui/TournamentStatusBadge.tsx'
import { toFormMessage } from '../../utils/fieldErrors.ts'
import { formatDateTime } from '../../utils/format.ts'

type State = { kind: 'loading' } | { kind: 'ready'; tournament: PublicTournamentDetail } | { kind: 'notFound' } | { kind: 'error'; message: string }

const TIMELINE = [
  { key: 'registrationStart', label: 'Registration opens' },
  { key: 'registrationClose', label: 'Registration closes' },
  { key: 'auctionStart', label: 'Auction' },
  { key: 'tournamentStart', label: 'Tournament starts' },
] as const

function BackLink() {
  return (
    <Link to="/tournaments" className="inline-flex items-center gap-2 text-sm font-medium text-muted transition-colors hover:text-fg">
      <ArrowLeftIcon width={16} height={16} /> All tournaments
    </Link>
  )
}

function Panel({ title, icon, children }: { title: string; icon: ReactNode; children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-6 shadow-card">
      <h2 className="flex items-center gap-2 text-sm font-bold">
        <span className="text-primary">{icon}</span>
        {title}
      </h2>
      <div className="mt-5">{children}</div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: number | null }) {
  return (
    <div className="rounded-xl bg-surface-2 px-4 py-3">
      <dt className="text-xs text-subtle">{label}</dt>
      <dd className="mt-0.5 text-2xl font-extrabold tabular-nums">{value ?? <span className="text-base font-medium text-subtle">TBA</span>}</dd>
    </div>
  )
}

function TournamentPublic() {
  const { slug = '' } = useParams()
  const [state, setState] = useState<State>({ kind: 'loading' })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    setState({ kind: 'loading' })
    publicTournamentsApi
      .get(slug, controller.signal)
      .then((data) => setState({ kind: 'ready', tournament: data.tournament }))
      .catch((err: unknown) => {
        if (controller.signal.aborted || (err instanceof DOMException && err.name === 'AbortError')) return
        if (err instanceof ApiRequestError && err.status === 404) setState({ kind: 'notFound' })
        else setState({ kind: 'error', message: toFormMessage(err) })
      })
    return () => controller.abort()
  }, [slug, attempt])

  if (state.kind === 'loading') {
    return (
      <section aria-busy="true" aria-label="Loading tournament">
        <Skeleton className="h-4 w-36" />
        <Skeleton className="mt-6 h-6 w-28 rounded-full" />
        <Skeleton className="mt-4 h-10 w-2/3" />
        <Skeleton className="mt-4 h-4 w-full max-w-xl" />
        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-64 rounded-2xl" />
          <Skeleton className="h-64 rounded-2xl" />
        </div>
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
          <ArrowLeftIcon width={16} height={16} /> Browse tournaments
        </Link>
      </section>
    )
  }

  if (state.kind === 'error') {
    return (
      <section className="mx-auto max-w-md space-y-3 py-16 text-center">
        <Alert tone="error">{state.message}</Alert>
        <div className="flex justify-center gap-3">
          <Button variant="secondary" onClick={() => setAttempt((n) => n + 1)}>
            Try again
          </Button>
          <Link to="/tournaments" className="rounded-lg px-4 py-2 text-sm font-medium text-primary hover:bg-primary-soft">
            Back to tournaments
          </Link>
        </div>
      </section>
    )
  }

  const t = state.tournament
  return (
    <section>
      <BackLink />

      <header className="relative mt-5 animate-fade-up overflow-hidden rounded-3xl border border-line bg-surface px-6 py-10 shadow-card sm:px-10">
        <div aria-hidden="true" className="pointer-events-none absolute -top-20 -right-20 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
        <div className="relative">
          <TournamentStatusBadge status={t.status} size="lg" />
          <h1 className="mt-4 max-w-3xl text-4xl font-extrabold break-words">{t.name}</h1>
          <p className="mt-2 text-sm text-subtle">{TOURNAMENT_STATUS[t.status].description}</p>
          <p className="mt-6 max-w-3xl text-base whitespace-pre-wrap break-words text-muted">{t.description || 'The organizer has not added a description yet.'}</p>
          {t.contactName && (
            <p className="mt-6 inline-flex items-center gap-2 rounded-full bg-surface-2 px-4 py-1.5 text-sm">
              <PhoneIcon width={14} height={14} className="text-primary" />
              <span className="text-subtle">Organizer contact</span>
              <span className="font-semibold">{t.contactName}</span>
            </p>
          )}
        </div>
      </header>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="animate-fade-up" style={{ animationDelay: '80ms' }}>
          <Panel title="Timeline" icon={<CalendarIcon width={18} height={18} />}>
            <ol className="relative space-y-5 border-l border-line pl-6">
              {TIMELINE.map(({ key, label }) => {
                const value = t.tournament_timeline[key]
                return (
                  <li key={key} className="relative">
                    <span className={`absolute top-1.5 -left-[31px] h-3 w-3 rounded-full ring-4 ring-surface ${value ? 'bg-primary' : 'bg-line-strong'}`} />
                    <p className="text-sm font-semibold">{label}</p>
                    <p className="text-sm text-muted">{value ? formatDateTime(value) : 'To be announced'}</p>
                  </li>
                )
              })}
            </ol>
          </Panel>
        </div>

        <div className="space-y-6">
          <div className="animate-fade-up" style={{ animationDelay: '140ms' }}>
            <Panel title="Teams" icon={<UsersIcon width={18} height={18} />}>
              <dl className="grid grid-cols-3 gap-3">
                <Stat label="Teams" value={t.teamConfig.totalTeams} />
                <Stat label="Min squad" value={t.teamConfig.minPlayers} />
                <Stat label="Max squad" value={t.teamConfig.maxPlayers} />
              </dl>
            </Panel>
          </div>
          <div className="animate-fade-up" style={{ animationDelay: '200ms' }}>
            <Panel title="Points system" icon={<TrophyIcon width={18} height={18} />}>
              <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Stat label="Win" value={t.pointsConfig.win} />
                <Stat label="Loss" value={t.pointsConfig.loss} />
                <Stat label="Tie" value={t.pointsConfig.tie} />
                <Stat label="No result" value={t.pointsConfig.noresult} />
              </dl>
            </Panel>
          </div>
        </div>
      </div>
    </section>
  )
}

export default TournamentPublic

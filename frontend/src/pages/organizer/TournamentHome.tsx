import { useCallback, useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useParams } from 'react-router-dom'
import { ApiRequestError } from '../../api/client.ts'
import { tournamentsApi } from '../../api/tournaments.ts'
import type { TournamentDetail } from '../../api/tournaments.ts'
import Alert from '../../components/ui/Alert.tsx'
import Button from '../../components/ui/Button.tsx'
import { ChevronRightIcon, GlobeIcon, EyeOffIcon } from '../../components/ui/icons.tsx'
import Skeleton from '../../components/ui/Skeleton.tsx'
import TournamentStatusBadge from '../../components/ui/TournamentStatusBadge.tsx'
import { toFormMessage } from '../../utils/fieldErrors.ts'
import { formatDate } from '../../utils/format.ts'
import Forbidden from '../Forbidden.tsx'
import NotFound from '../NotFound.tsx'
import LifecycleControls from './LifecycleControls.tsx'
import type { TournamentOutletContext } from './tournamentContext.ts'

interface TabDef {
  label: string
  // Relative to the tournament root. "" = the index route. Omit `path` for sections of future phases.
  path?: string
  end?: boolean
}

// To add a section in a later phase: add its <Route> under TournamentHome in App.tsx and give
// the tab a `path` here. Tabs without a path are shown as disabled "soon" placeholders.
const TABS: TabDef[] = [
  { label: 'Overview', path: '', end: true },
  { label: 'Players' },
  { label: 'Teams' },
  { label: 'Auction' },
  { label: 'Matches' },
  { label: 'Standings' },
  { label: 'Settings', path: 'settings' },
]

type State = { kind: 'loading' } | { kind: 'ready'; tournament: TournamentDetail } | { kind: 'error'; status: number; message: string }

function TournamentHome() {
  const { id = '' } = useParams()
  const [state, setState] = useState<State>({ kind: 'loading' })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    setState({ kind: 'loading' })
    tournamentsApi
      .get(id, controller.signal)
      .then((data) => setState({ kind: 'ready', tournament: data.tournament }))
      .catch((err: unknown) => {
        if (controller.signal.aborted || (err instanceof DOMException && err.name === 'AbortError')) return
        setState({ kind: 'error', status: err instanceof ApiRequestError ? err.status : 0, message: toFormMessage(err) })
      })
    return () => controller.abort()
  }, [id, attempt])

  const onTournamentChange = useCallback((tournament: TournamentDetail) => setState({ kind: 'ready', tournament }), [])

  if (state.kind === 'loading') {
    return (
      <section aria-busy="true" aria-label="Loading tournament">
        <Skeleton className="h-4 w-56" />
        <Skeleton className="mt-6 h-9 w-80 max-w-full" />
        <Skeleton className="mt-3 h-4 w-64" />
        <Skeleton className="mt-8 h-10 w-full" />
        <Skeleton className="mt-6 h-64 w-full rounded-2xl" />
      </section>
    )
  }

  if (state.kind === 'error') {
    if (state.status === 404) return <NotFound />
    if (state.status === 403) return <Forbidden />
    return (
      <div className="mx-auto max-w-md space-y-3 py-10 text-center">
        <Alert tone="error">{state.message}</Alert>
        <Button variant="secondary" onClick={() => setAttempt((n) => n + 1)}>
          Try again
        </Button>
      </div>
    )
  }

  const { tournament } = state
  const base = `/dashboard/organizer/tournaments/${tournament.id}`
  const context: TournamentOutletContext = { tournament, onTournamentChange }

  return (
    <section>
      <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-sm text-subtle">
        <Link to="/dashboard/organizer" className="transition-colors hover:text-fg">
          My tournaments
        </Link>
        <ChevronRightIcon width={14} height={14} />
        <span className="max-w-[16rem] truncate font-medium text-fg">{tournament.name}</span>
      </nav>

      <header className="mt-5 animate-fade-up">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-3xl font-extrabold break-words">{tournament.name}</h1>
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-subtle">
              <TournamentStatusBadge status={tournament.status} size="lg" />
              <span className="inline-flex items-center gap-1.5">
                {tournament.visibility === 'public' ? <GlobeIcon width={15} height={15} /> : <EyeOffIcon width={15} height={15} />}
                {tournament.visibility === 'public' ? 'Public' : 'Private'}
              </span>
              <span>Created {formatDate(tournament.createdAt)}</span>
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-line bg-surface p-5 shadow-card">
          <p className="mb-3 text-xs font-semibold tracking-widest text-subtle uppercase">Lifecycle</p>
          <LifecycleControls tournament={tournament} onChange={onTournamentChange} />
        </div>
      </header>

      <div className="mt-8 border-b border-line">
        <div className="-mb-px flex gap-1 overflow-x-auto" role="tablist" aria-label="Tournament sections">
          {TABS.map((tab) =>
            tab.path === undefined ? (
              <span
                key={tab.label}
                role="tab"
                aria-disabled="true"
                title="Available in a later phase"
                className="inline-flex cursor-not-allowed items-center gap-2 border-b-2 border-transparent px-4 py-3 text-sm font-medium whitespace-nowrap text-subtle/70 select-none"
              >
                {tab.label}
                <span className="rounded-full bg-surface-2 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide uppercase">Soon</span>
              </span>
            ) : (
              <NavLink
                key={tab.label}
                to={tab.path ? `${base}/${tab.path}` : base}
                end={tab.end}
                role="tab"
                className={({ isActive }) =>
                  `border-b-2 px-4 py-3 text-sm font-semibold whitespace-nowrap transition-colors ${
                    isActive ? 'border-primary text-primary' : 'border-transparent text-muted hover:border-line-strong hover:text-fg'
                  }`
                }
              >
                {tab.label}
              </NavLink>
            ),
          )}
        </div>
      </div>

      <div className="mt-8 animate-fade-up">
        <Outlet context={context} />
      </div>
    </section>
  )
}

export default TournamentHome

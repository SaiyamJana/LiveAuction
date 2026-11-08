import { useCallback } from 'react'
import { Link } from 'react-router-dom'
import { tournamentsApi } from '../../api/tournaments.ts'
import type { TournamentSummary } from '../../api/tournaments.ts'
import Alert from '../../components/ui/Alert.tsx'
import Button from '../../components/ui/Button.tsx'
import { ArrowRightIcon, CalendarIcon, GlobeIcon, EyeOffIcon, TrophyIcon } from '../../components/ui/icons.tsx'
import Skeleton from '../../components/ui/Skeleton.tsx'
import TournamentStatusBadge from '../../components/ui/TournamentStatusBadge.tsx'
import { usePaginatedList } from '../../hooks/usePaginatedList.ts'
import { formatDate, timeAgo } from '../../utils/format.ts'

const PAGE_SIZE = 12

function nextDate(t: TournamentSummary): { label: string; value: string } | null {
  const tl = t.tournament_timeline
  const candidates: [string, string | null][] = [
    ['Registration opens', tl.registrationStart],
    ['Registration closes', tl.registrationClose],
    ['Auction', tl.auctionStart],
    ['Tournament starts', tl.tournamentStart],
  ]
  const now = Date.now()
  const upcoming = candidates.find(([, v]) => v && new Date(v).getTime() >= now)
  const pick = upcoming ?? [...candidates].reverse().find(([, v]) => v)
  return pick && pick[1] ? { label: pick[0], value: formatDate(pick[1]) } : null
}

function CardSkeleton() {
  return (
    <div className="rounded-2xl border border-line bg-surface p-5 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-5 w-20 rounded-full" />
      </div>
      <Skeleton className="mt-4 h-3 w-full" />
      <Skeleton className="mt-2 h-3 w-2/3" />
      <Skeleton className="mt-6 h-8 w-32" />
    </div>
  )
}

function MyTournaments() {
  const fetchPage = useCallback(async (page: number, signal: AbortSignal) => {
    const data = await tournamentsApi.mine(page, PAGE_SIZE, signal)
    return { items: data.tournaments, hasMore: data.hasMore }
  }, [])
  const { items, status, error, hasMore, loadingMore, loadMore, retry } = usePaginatedList<TournamentSummary>(fetchPage)

  return (
    <section>
      <div className="animate-fade-up">
        <p className="text-xs font-semibold tracking-widest text-primary uppercase">Organizer</p>
        <h1 className="mt-1 text-3xl font-extrabold">My tournaments</h1>
        <p className="mt-2 max-w-2xl text-muted">Tournaments you organize. Open one to configure it, move it through its lifecycle and share it with players.</p>
      </div>

      <div className="mt-8">
        {status === 'loading' && (
          <div className="grid gap-5 sm:grid-cols-2" aria-busy="true" aria-label="Loading tournaments">
            {[0, 1, 2, 3].map((n) => (
              <CardSkeleton key={n} />
            ))}
          </div>
        )}

        {status === 'error' && (
          <div className="mx-auto max-w-md space-y-3 py-10 text-center animate-fade-up">
            <Alert tone="error">{error}</Alert>
            <Button variant="secondary" onClick={() => void retry()}>
              Try again
            </Button>
          </div>
        )}

        {status === 'ready' && error && <Alert tone="error" className="mb-4">{error}</Alert>}

        {status === 'ready' && items.length === 0 && (
          <div className="animate-fade-up rounded-2xl border border-dashed border-line-strong bg-surface px-6 py-16 text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-soft text-primary">
              <TrophyIcon width={26} height={26} />
            </span>
            <h2 className="mt-5 text-lg font-semibold">You don't organize any tournaments yet</h2>
            <p className="mx-auto mt-1 max-w-sm text-sm text-muted">When the owner approves a tournament request, your draft tournament appears here.</p>
            <Link
              to="/request-tournament"
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-fg transition-colors hover:bg-primary-hover"
            >
              Request a tournament
            </Link>
          </div>
        )}

        {status === 'ready' && items.length > 0 && (
          <ul className="grid gap-5 sm:grid-cols-2">
            {items.map((t, index) => {
              const date = nextDate(t)
              return (
                <li key={t.id} className="animate-fade-up" style={{ animationDelay: `${Math.min(index, 8) * 50}ms` }}>
                  <Link
                    to={`/dashboard/organizer/tournaments/${t.id}`}
                    className="group flex h-full flex-col rounded-2xl border border-line bg-surface p-5 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lift focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <h2 className="min-w-0 text-lg leading-snug font-bold break-words">{t.name}</h2>
                      <TournamentStatusBadge status={t.status} />
                    </div>

                    <p className="mt-2 line-clamp-2 text-sm text-muted">{t.description || 'No description yet.'}</p>

                    <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-subtle">
                      <span className="inline-flex items-center gap-1.5">
                        {t.visibility === 'public' ? <GlobeIcon width={14} height={14} /> : <EyeOffIcon width={14} height={14} />}
                        {t.visibility === 'public' ? 'Public' : 'Private'}
                      </span>
                      {date && (
                        <span className="inline-flex items-center gap-1.5">
                          <CalendarIcon width={14} height={14} />
                          {date.label}: {date.value}
                        </span>
                      )}
                    </div>

                    <div className="mt-5 flex items-center justify-between border-t border-line pt-4">
                      <span className="text-xs text-subtle">
                        Created {formatDate(t.createdAt)} · Updated {timeAgo(t.updatedAt)}
                      </span>
                      <span className="inline-flex items-center gap-1 text-sm font-semibold text-primary">
                        Manage
                        <ArrowRightIcon width={16} height={16} className="transition-transform group-hover:translate-x-1" />
                      </span>
                    </div>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}

        {status === 'ready' && hasMore && (
          <div className="mt-8 text-center">
            <Button variant="secondary" onClick={() => void loadMore()} loading={loadingMore}>
              Load more
            </Button>
          </div>
        )}
      </div>
    </section>
  )
}

export default MyTournaments

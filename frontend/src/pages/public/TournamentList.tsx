import { useCallback, useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { publicTournamentsApi } from '../../api/publicTournaments.ts'
import type { PublicTournamentItem } from '../../api/publicTournaments.ts'
import Alert from '../../components/ui/Alert.tsx'
import Button from '../../components/ui/Button.tsx'
import { ArrowRightIcon, CalendarIcon, SearchIcon, TrophyIcon, XIcon } from '../../components/ui/icons.tsx'
import Skeleton from '../../components/ui/Skeleton.tsx'
import TournamentStatusBadge, { TOURNAMENT_STATUS } from '../../components/ui/TournamentStatusBadge.tsx'
import { usePaginatedList } from '../../hooks/usePaginatedList.ts'
import { formatDate } from '../../utils/format.ts'

const PAGE_SIZE = 12

const FILTERS = ['registration_open', 'registration_closed', 'auction', 'tournament_in_progress', 'completed', 'cancelled'] as const

type Item = PublicTournamentItem & { id: string } // usePaginatedList needs an `id`; the slug is the public identifier

function highlightDate(t: PublicTournamentItem): string | null {
  const tl = t.tournament_timeline
  const pairs: [string, string | null][] = [
    ['Registration closes', tl.registrationClose],
    ['Auction', tl.auctionStart],
    ['Starts', tl.tournamentStart],
  ]
  const hit = pairs.find(([, v]) => v)
  return hit && hit[1] ? `${hit[0]} ${formatDate(hit[1])}` : null
}

function TournamentList() {
  const [params, setParams] = useSearchParams()
  const urlSearch = params.get('q') ?? ''
  const rawStatus = params.get('status') ?? ''
  const status = (FILTERS as readonly string[]).includes(rawStatus) ? rawStatus : ''

  // The input updates immediately; the request waits until typing pauses.
  const [input, setInput] = useState(urlSearch)
  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (input.trim() === urlSearch) return
      setParams((prev) => {
        const next = new URLSearchParams(prev)
        if (input.trim()) next.set('q', input.trim())
        else next.delete('q')
        return next
      }, { replace: true })
    }, 350)
    return () => window.clearTimeout(timer)
  }, [input, urlSearch, setParams])

  function setStatus(value: string) {
    setParams((prev) => {
      const next = new URLSearchParams(prev)
      if (value) next.set('status', value)
      else next.delete('status')
      return next
    }, { replace: true })
  }

  const fetchPage = useCallback(
    async (page: number, signal: AbortSignal) => {
      const data = await publicTournamentsApi.list({ search: urlSearch, status, page, limit: PAGE_SIZE }, signal)
      return { items: data.tournaments.map((t): Item => ({ ...t, id: t.slug })), hasMore: data.hasMore, meta: { total: data.total } }
    },
    [urlSearch, status],
  )
  const { items, meta, status: loadState, error, hasMore, loadingMore, loadMore, retry } = usePaginatedList<Item, { total: number }>(fetchPage)
  const filtering = Boolean(urlSearch || status)

  return (
    <section>
      <div className="relative overflow-hidden rounded-3xl border border-line bg-surface px-6 py-12 shadow-card sm:px-12 sm:py-16">
        <div aria-hidden="true" className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-28 left-1/3 h-64 w-64 rounded-full bg-accent/10 blur-3xl" />
        <div className="relative animate-fade-up">
          <p className="text-xs font-semibold tracking-widest text-primary uppercase">Discover</p>
          <h1 className="mt-2 max-w-2xl text-4xl font-extrabold sm:text-5xl">Find a tournament to follow</h1>
          <p className="mt-4 max-w-xl text-lg text-muted">Browse open registrations, live auctions and tournaments in progress. No account needed.</p>

          <div className="relative mt-8 max-w-xl">
            <SearchIcon className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-subtle" />
            <input
              type="search"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Search tournaments by name"
              aria-label="Search tournaments"
              maxLength={100}
              className="w-full rounded-xl border border-line-strong bg-surface py-3 pr-4 pl-12 text-base shadow-card outline-none transition-shadow placeholder:text-subtle focus:border-primary focus:ring-4 focus:ring-primary/15"
            />
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-2" role="group" aria-label="Filter by status">
        {[{ value: '', label: 'All' }, ...FILTERS.map((f) => ({ value: f as string, label: TOURNAMENT_STATUS[f].label }))].map((f) => {
          const active = status === f.value
          return (
            <button
              key={f.value || 'all'}
              type="button"
              onClick={() => setStatus(f.value)}
              aria-pressed={active}
              className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition-all active:scale-95 ${
                active ? 'border-primary bg-primary text-primary-fg shadow-card' : 'border-line-strong bg-surface text-muted hover:border-primary/50 hover:text-fg'
              }`}
            >
              {f.label}
            </button>
          )
        })}
      </div>

      <div className="mt-8">
        {loadState === 'loading' && (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true" aria-label="Loading tournaments">
            {[0, 1, 2, 3, 4, 5].map((n) => (
              <div key={n} className="rounded-2xl border border-line bg-surface p-5 shadow-card">
                <Skeleton className="h-5 w-20 rounded-full" />
                <Skeleton className="mt-4 h-6 w-3/4" />
                <Skeleton className="mt-3 h-3 w-full" />
                <Skeleton className="mt-2 h-3 w-2/3" />
                <Skeleton className="mt-6 h-3 w-1/2" />
              </div>
            ))}
          </div>
        )}

        {loadState === 'error' && (
          <div className="mx-auto max-w-md space-y-3 py-10 text-center">
            <Alert tone="error">{error}</Alert>
            <Button variant="secondary" onClick={() => void retry()}>
              Try again
            </Button>
          </div>
        )}

        {loadState === 'ready' && error && <Alert tone="error" className="mb-4">{error}</Alert>}

        {loadState === 'ready' && items.length === 0 && (
          <div className="animate-fade-up rounded-2xl border border-dashed border-line-strong bg-surface px-6 py-16 text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-soft text-primary">
              {filtering ? <SearchIcon width={26} height={26} /> : <TrophyIcon width={26} height={26} />}
            </span>
            <h2 className="mt-5 text-lg font-semibold">{filtering ? 'No tournaments match your search' : 'No public tournaments yet'}</h2>
            <p className="mx-auto mt-1 max-w-sm text-sm text-muted">
              {filtering ? 'Try a different name or clear the filters.' : 'Check back soon: tournaments appear here as soon as organizers publish them.'}
            </p>
            {filtering && (
              <Button
                variant="secondary"
                className="mt-6"
                onClick={() => {
                  setInput('')
                  setParams({}, { replace: true })
                }}
              >
                <XIcon width={16} height={16} /> Clear filters
              </Button>
            )}
          </div>
        )}

        {loadState === 'ready' && items.length > 0 && (
          <>
            <p className="mb-4 text-sm text-subtle" aria-live="polite">
              {meta?.total ?? items.length} {(meta?.total ?? items.length) === 1 ? 'tournament' : 'tournaments'}
            </p>
            <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((t, index) => (
                <li key={t.id} className="animate-fade-up" style={{ animationDelay: `${Math.min(index, 9) * 45}ms` }}>
                  <Link
                    to={`/t/${t.slug}`}
                    className="group flex h-full flex-col rounded-2xl border border-line bg-surface p-5 shadow-card transition-all duration-200 hover:-translate-y-1 hover:border-primary/40 hover:shadow-lift focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                  >
                    <TournamentStatusBadge status={t.status} />
                    <h2 className="mt-4 text-lg leading-snug font-bold break-words">{t.name}</h2>
                    <p className="mt-2 line-clamp-3 flex-1 text-sm text-muted">{t.description || 'No description provided.'}</p>
                    <div className="mt-5 flex items-center justify-between gap-3 border-t border-line pt-4 text-xs text-subtle">
                      <span className="inline-flex min-w-0 items-center gap-1.5">
                        <CalendarIcon width={14} height={14} className="shrink-0" />
                        <span className="truncate">{highlightDate(t) ?? 'Dates to be announced'}</span>
                      </span>
                      <ArrowRightIcon width={16} height={16} className="shrink-0 text-primary transition-transform group-hover:translate-x-1" />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}

        {loadState === 'ready' && hasMore && (
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

export default TournamentList

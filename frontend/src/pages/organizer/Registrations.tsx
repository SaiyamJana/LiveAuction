import { useCallback, useState } from 'react'
import { Link } from 'react-router-dom'
import { registrationsApi } from '../../api/registrations.ts'
import type { OrganizerRegistrationDto, RegistrationCounts, RegistrationStatus } from '../../api/registrations.ts'
import ExportButton from '../../components/ExportButton.tsx'
import { AccountTypeChip, VerifiedBadge } from '../../components/ui/AccountBadges.tsx'
import Alert from '../../components/ui/Alert.tsx'
import Button from '../../components/ui/Button.tsx'
import FilterTabs from '../../components/ui/FilterTabs.tsx'
import { InboxIcon, SearchIcon } from '../../components/ui/icons.tsx'
import SearchInput from '../../components/ui/SearchInput.tsx'
import Skeleton from '../../components/ui/Skeleton.tsx'
import StatusBadge from '../../components/ui/StatusBadge.tsx'
import { countryName } from '../../data/countries.ts'
import { useDebouncedValue } from '../../hooks/useDebouncedValue.ts'
import { usePaginatedList } from '../../hooks/usePaginatedList.ts'
import { formatDate } from '../../utils/format.ts'
import RegistrationReviewDrawer from './RegistrationReviewDrawer.tsx'
import { useTournament } from './tournamentContext.ts'

const PAGE_SIZE = 25
type Tab = RegistrationStatus | 'all'

function Registrations() {
  const { tournament: t } = useTournament()
  const [tab, setTab] = useState<Tab>('pending')
  const [searchInput, setSearchInput] = useState('')
  const search = useDebouncedValue(searchInput.trim(), 300)
  const [selected, setSelected] = useState<OrganizerRegistrationDto | null>(null)

  // A new function per filter makes the list reload from page 1.
  const fetchPage = useCallback(
    async (page: number, signal: AbortSignal) => {
      const data = await registrationsApi.list(t.id, { status: tab === 'all' ? undefined : tab, search, page, limit: PAGE_SIZE }, signal)
      return { items: data.registrations, hasMore: data.hasMore, meta: data.counts }
    },
    [t.id, tab, search],
  )
  const { items, meta: counts, status, error, hasMore, loadingMore, loadMore, reload, retry } = usePaginatedList<OrganizerRegistrationDto, RegistrationCounts>(fetchPage)

  const canDecide = t.status === 'registration_open' || t.status === 'registration_closed'
  const base = `/dashboard/organizer/tournaments/${t.id}`
  const hasSearch = search.length > 0

  const tabs: { value: Tab; label: string; count?: number }[] = [
    { value: 'pending', label: 'Pending', count: counts?.pending },
    { value: 'accepted', label: 'Accepted', count: counts?.accepted },
    { value: 'rejected', label: 'Rejected', count: counts?.rejected },
    { value: 'all', label: 'All', count: counts?.total },
  ]

  function onDecided(updated: OrganizerRegistrationDto) {
    setSelected(updated) // the drawer animates to the new state
    void reload() // refresh rows + counts in the background
  }

  function emptyState() {
    if (hasSearch) {
      return { icon: <SearchIcon width={24} height={24} />, title: `No matches for “${search}”`, text: 'Check the spelling or try another name.', action: <Button variant="secondary" onClick={() => setSearchInput('')}>Clear search</Button> }
    }
    if (counts && counts.total === 0) {
      return {
        icon: <InboxIcon width={24} height={24} />,
        title: 'No registrations yet',
        text: t.status === 'registration_open' ? `Share /t/${t.slug} so players can register.` : t.status === 'draft' ? 'Open registration from the Overview tab to start collecting players.' : 'Nobody registered for this tournament.',
        action: null,
      }
    }
    return {
      icon: <InboxIcon width={24} height={24} />,
      title: tab === 'pending' ? "You're all caught up" : `No ${tab} registrations`,
      text: tab === 'pending' ? 'There is nothing waiting for review.' : 'Try another filter.',
      action: tab !== 'all' ? <Button variant="secondary" onClick={() => setTab('all')}>Show all</Button> : null,
    }
  }

  return (
    <section>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Player registrations</h2>
          <p className="mt-1 text-sm text-muted">Review applications. Accepted players move straight into the <Link to={`${base}/players`} className="font-semibold text-primary hover:underline">Players</Link> list.</p>
        </div>
        <ExportButton filename={`${t.slug}-registrations.csv`} fetchFile={() => registrationsApi.exportCsv(t.id)} />
      </div>

      {!canDecide && t.status !== 'draft' && <Alert tone="warning" className="mt-5">Decisions are locked because this tournament is {t.status.replace(/_/g, ' ')}.</Alert>}

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <FilterTabs label="Registration status" tabs={tabs} value={tab} onChange={setTab} />
        <SearchInput value={searchInput} onChange={setSearchInput} placeholder="Search by name…" label="Search registrations by actual or display name" />
      </div>

      {error && status !== 'error' && <Alert tone="error" className="mt-4">{error}</Alert>}

      <div className="mt-5 overflow-hidden rounded-2xl border border-line bg-surface shadow-card">
        {status === 'error' && (
          <div className="space-y-3 p-8 text-center">
            <Alert tone="error">{error}</Alert>
            <Button variant="secondary" onClick={() => void retry()}>Try again</Button>
          </div>
        )}

        {status === 'loading' && (
          <div aria-busy="true" aria-label="Loading registrations" className="divide-y divide-line">
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-4">
                <Skeleton className="h-9 w-9 rounded-full" />
                <div className="flex-1 space-y-2"><Skeleton className="h-4 w-40" /><Skeleton className="h-3 w-56 max-w-full" /></div>
                <Skeleton className="hidden h-6 w-20 rounded-full sm:block" />
              </div>
            ))}
          </div>
        )}

        {status === 'ready' && items.length === 0 && (() => {
          const e = emptyState()
          return (
            <div className="animate-fade-up p-12 text-center">
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-2 text-subtle">{e.icon}</span>
              <p className="mt-4 font-semibold">{e.title}</p>
              <p className="mt-1 text-sm text-muted">{e.text}</p>
              {e.action && <div className="mt-4">{e.action}</div>}
            </div>
          )
        })()}

        {status === 'ready' && items.length > 0 && (
          <>
            <table className="hidden w-full text-left text-sm md:table">
              <thead className="border-b border-line bg-surface-2/70 text-xs tracking-wide text-subtle uppercase">
                <tr>
                  <th className="px-5 py-3 font-semibold">Player</th>
                  <th className="px-3 py-3 font-semibold">Account</th>
                  <th className="px-3 py-3 font-semibold">Verified</th>
                  <th className="px-3 py-3 font-semibold">Captain</th>
                  <th className="px-3 py-3 font-semibold">Contact</th>
                  <th className="px-3 py-3 font-semibold">Submitted</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {items.map((r, index) => (
                  <tr
                    key={r.id}
                    tabIndex={0}
                    aria-label={`Review registration of ${r.displayName}`}
                    onClick={() => setSelected(r)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        setSelected(r)
                      }
                    }}
                    style={{ animationDelay: `${Math.min(index, 8) * 25}ms` }}
                    className="animate-fade-up cursor-pointer transition-colors hover:bg-primary-soft/50 focus-visible:bg-primary-soft/60 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary"
                  >
                    <td className="max-w-56 px-5 py-3.5">
                      <p className="truncate font-semibold">{r.displayName}</p>
                      <p className="truncate text-xs text-subtle">{r.actualName}</p>
                    </td>
                    <td className="px-3 py-3.5"><AccountTypeChip type={r.accountType} /></td>
                    <td className="px-3 py-3.5"><VerifiedBadge verified={r.isVerified} /></td>
                    <td className="px-3 py-3.5">{r.wantsCaptain ? <span className="font-medium text-primary">Yes</span> : <span className="text-subtle">No</span>}</td>
                    <td className="px-3 py-3.5">
                      <p className="tabular-nums">{r.contactNumber}</p>
                      <p className="text-xs text-subtle">{countryName(r.contactCountry)}</p>
                    </td>
                    <td className="px-3 py-3.5 whitespace-nowrap text-muted">{formatDate(r.submittedAt)}</td>
                    <td className="px-5 py-3.5"><StatusBadge key={r.status} status={r.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>

            <ul className="divide-y divide-line md:hidden">
              {items.map((r) => (
                <li key={r.id}>
                  <button type="button" onClick={() => setSelected(r)} className="w-full space-y-2 px-4 py-4 text-left transition-colors hover:bg-primary-soft/50 focus-visible:bg-primary-soft/60 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-semibold">{r.displayName}</p>
                        <p className="truncate text-xs text-subtle">{r.actualName}</p>
                      </div>
                      <StatusBadge status={r.status} />
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
                      <AccountTypeChip type={r.accountType} />
                      <VerifiedBadge verified={r.isVerified} />
                      <span>{formatDate(r.submittedAt)}</span>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      {status === 'ready' && hasMore && (
        <div className="mt-5 text-center">
          <Button variant="secondary" onClick={() => void loadMore()} loading={loadingMore}>Load more</Button>
        </div>
      )}

      {selected && (
        <RegistrationReviewDrawer
          key={selected.id}
          tournamentId={t.id}
          registration={selected}
          canDecide={canDecide}
          playersPath={`${base}/players`}
          onClose={() => setSelected(null)}
          onDecided={onDecided}
        />
      )}
    </section>
  )
}

export default Registrations

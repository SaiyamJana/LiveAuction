import { useCallback, useState } from 'react'
import { Link } from 'react-router-dom'
import { playersApi } from '../../api/registrations.ts'
import type { PlayerCounts, PlayerDto, PlayerStatus } from '../../api/registrations.ts'
import ExportButton from '../../components/ExportButton.tsx'
import { AccountTypeChip, VerifiedBadge } from '../../components/ui/AccountBadges.tsx'
import Alert from '../../components/ui/Alert.tsx'
import Button from '../../components/ui/Button.tsx'
import ConfirmDialog from '../../components/ui/ConfirmDialog.tsx'
import FilterTabs from '../../components/ui/FilterTabs.tsx'
import { SearchIcon, UsersIcon } from '../../components/ui/icons.tsx'
import PlayerStatusBadge from '../../components/ui/PlayerStatusBadge.tsx'
import SearchInput from '../../components/ui/SearchInput.tsx'
import Skeleton from '../../components/ui/Skeleton.tsx'
import { useToast } from '../../context/toast-context.ts'
import { useDebouncedValue } from '../../hooks/useDebouncedValue.ts'
import { usePaginatedList } from '../../hooks/usePaginatedList.ts'
import { toFormMessage } from '../../utils/fieldErrors.ts'
import { useTournament } from './tournamentContext.ts'

const PAGE_SIZE = 25
type Tab = PlayerStatus | 'all'

const price = (value: number | null) => (value === null ? <span className="text-subtle">-</span> : <span className="font-semibold tabular-nums">{value.toLocaleString()}</span>)

function Players() {
  const { tournament: t } = useTournament()
  const { toast } = useToast()
  const [tab, setTab] = useState<Tab>('all')
  const [searchInput, setSearchInput] = useState('')
  const search = useDebouncedValue(searchInput.trim(), 300)
  const [target, setTarget] = useState<PlayerDto | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const fetchPage = useCallback(
    async (page: number, signal: AbortSignal) => {
      const data = await playersApi.list(t.id, { status: tab === 'all' ? undefined : tab, search, page, limit: PAGE_SIZE }, signal)
      return { items: data.players, hasMore: data.hasMore, meta: data.counts }
    },
    [t.id, tab, search],
  )
  const { items, meta: counts, status, error: listError, hasMore, loadingMore, loadMore, reload, retry } = usePaginatedList<PlayerDto, PlayerCounts>(fetchPage)

  const base = `/dashboard/organizer/tournaments/${t.id}`
  const locked = t.status === 'completed' || t.status === 'cancelled'

  const tabs: { value: Tab; label: string; count?: number }[] = [
    { value: 'all', label: 'All', count: counts?.total },
    { value: 'pending', label: 'Pending', count: counts?.pending },
    { value: 'sold', label: 'Sold', count: counts?.sold },
    { value: 'unsold', label: 'Unsold', count: counts?.unsold },
    { value: 'withdrawn', label: 'Withdrawn', count: counts?.withdrawn },
  ]

  async function withdraw() {
    if (!target || busy) return
    setBusy(true)
    setError('')
    try {
      await playersApi.withdraw(t.id, target.id)
      toast(`${target.displayName} was withdrawn`, 'success')
      setTarget(null)
      await reload()
    } catch (err) {
      setError(toFormMessage(err))
      await reload() // show the real current state (for example: already sold)
    } finally {
      setBusy(false)
    }
  }

  const action = (p: PlayerDto) => {
    if (p.status === 'withdrawn') return <span className="text-xs text-subtle">Withdrawn</span>
    const blocked = p.status === 'sold' || locked
    return (
      <Button
        size="sm"
        variant="secondary"
        disabled={blocked}
        title={p.status === 'sold' ? 'Sold players cannot be withdrawn' : locked ? 'This tournament is finished' : 'Withdraw this player from the auction'}
        onClick={() => {
          setError('')
          setTarget(p)
        }}
      >
        Withdraw
      </Button>
    )
  }

  return (
    <section>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Players</h2>
          <p className="mt-1 text-sm text-muted">Everyone accepted into the player pool. They are called up one by one during the auction.</p>
        </div>
        <ExportButton filename={`${t.slug}-players.csv`} fetchFile={() => playersApi.exportCsv(t.id)} />
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <FilterTabs label="Player status" tabs={tabs} value={tab} onChange={setTab} />
        <SearchInput value={searchInput} onChange={setSearchInput} placeholder="Search players…" label="Search players by display name" />
      </div>

      {listError && status !== 'error' && <Alert tone="error" className="mt-4">{listError}</Alert>}

      <div className="mt-5 overflow-hidden rounded-2xl border border-line bg-surface shadow-card">
        {status === 'error' && (
          <div className="space-y-3 p-8 text-center">
            <Alert tone="error">{listError}</Alert>
            <Button variant="secondary" onClick={() => void retry()}>Try again</Button>
          </div>
        )}

        {status === 'loading' && (
          <div aria-busy="true" aria-label="Loading players" className="divide-y divide-line">
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-4">
                <div className="flex-1 space-y-2"><Skeleton className="h-4 w-40" /><Skeleton className="h-3 w-24" /></div>
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
            ))}
          </div>
        )}

        {status === 'ready' && items.length === 0 && (
          <div className="animate-fade-up p-12 text-center">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-2 text-subtle">
              {search ? <SearchIcon width={24} height={24} /> : <UsersIcon width={24} height={24} />}
            </span>
            <p className="mt-4 font-semibold">{search ? `No players match “${search}”` : counts && counts.total === 0 ? 'No players yet' : `No ${tab} players`}</p>
            <p className="mt-1 text-sm text-muted">
              {counts && counts.total === 0 ? (
                <>Players appear here when you accept their registration. <Link to={`${base}/registrations`} className="font-semibold text-primary hover:underline">Review registrations</Link></>
              ) : (
                'Try another filter or search.'
              )}
            </p>
          </div>
        )}

        {status === 'ready' && items.length > 0 && (
          <>
            <table className="hidden w-full text-left text-sm md:table">
              <thead className="border-b border-line bg-surface-2/70 text-xs tracking-wide text-subtle uppercase">
                <tr>
                  <th className="px-5 py-3 font-semibold">Player</th>
                  <th className="px-3 py-3 font-semibold">Account</th>
                  <th className="px-3 py-3 font-semibold">Verification</th>
                  <th className="px-3 py-3 font-semibold">Status</th>
                  <th className="px-3 py-3 font-semibold">Team</th>
                  <th className="px-3 py-3 text-right font-semibold">Sold price</th>
                  <th className="px-5 py-3 text-right font-semibold"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {items.map((p, index) => (
                  <tr key={p.id} style={{ animationDelay: `${Math.min(index, 8) * 25}ms` }} className="animate-fade-up transition-colors hover:bg-surface-2/60">
                    <td className="max-w-56 truncate px-5 py-3.5 font-semibold">{p.displayName}</td>
                    <td className="px-3 py-3.5"><AccountTypeChip type={p.accountType} /></td>
                    <td className="px-3 py-3.5"><VerifiedBadge verified={p.isVerified} /></td>
                    <td className="px-3 py-3.5"><PlayerStatusBadge status={p.status} /></td>
                    <td className="px-3 py-3.5">{p.team ? <span title={p.team.name}><span className="font-semibold">{p.team.shortCode}</span> <span className="text-subtle">{p.team.name}</span></span> : <span className="text-subtle">Unassigned</span>}</td>
                    <td className="px-3 py-3.5 text-right">{price(p.soldPrice)}</td>
                    <td className="px-5 py-3.5 text-right">{action(p)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <ul className="divide-y divide-line md:hidden">
              {items.map((p) => (
                <li key={p.id} className="space-y-3 px-4 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <p className="min-w-0 truncate font-semibold">{p.displayName}</p>
                    <PlayerStatusBadge status={p.status} />
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
                    <AccountTypeChip type={p.accountType} />
                    <VerifiedBadge verified={p.isVerified} />
                    <span>{p.team ? p.team.name : 'Unassigned'}</span>
                    {p.soldPrice !== null && <span>Sold for {p.soldPrice.toLocaleString()}</span>}
                  </div>
                  <div>{action(p)}</div>
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

      {target && (
        <ConfirmDialog
          title={`Withdraw ${target.displayName}?`}
          description="The player is removed from the auction pool. Sold players cannot be withdrawn, and this cannot be undone from this page."
          confirmLabel="Withdraw player"
          tone="danger"
          busy={busy}
          error={error}
          onConfirm={() => void withdraw()}
          onCancel={() => setTarget(null)}
        />
      )}
    </section>
  )
}

export default Players

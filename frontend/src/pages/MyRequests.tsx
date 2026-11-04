import { useCallback, useState } from 'react'
import { Link } from 'react-router-dom'
import { tournamentRequestsApi } from '../api/tournamentRequests.ts'
import type { TournamentRequestDto } from '../api/tournamentRequests.ts'
import Alert from '../components/ui/Alert.tsx'
import Button from '../components/ui/Button.tsx'
import Modal from '../components/ui/Modal.tsx'
import StatusBadge, { STATUS_DESCRIPTIONS } from '../components/ui/StatusBadge.tsx'
import { usePaginatedList } from '../hooks/usePaginatedList.ts'
import { formatDateTime } from '../utils/format.ts'
import { toFormMessage } from '../utils/fieldErrors.ts'

const PAGE_SIZE = 10

function MyRequests() {
  const fetchPage = useCallback(async (page: number, signal: AbortSignal) => {
    const data = await tournamentRequestsApi.mine(page, PAGE_SIZE, signal)
    return { items: data.requests, hasMore: data.hasMore }
  }, [])
  const { items, status, error, hasMore, loadingMore, loadMore, reload, retry } = usePaginatedList<TournamentRequestDto>(fetchPage)

  const [withdrawTarget, setWithdrawTarget] = useState<TournamentRequestDto | null>(null)
  const [withdrawing, setWithdrawing] = useState(false)
  const [withdrawError, setWithdrawError] = useState('')
  const [notice, setNotice] = useState('')

  function closeModal() {
    setWithdrawTarget(null)
    setWithdrawError('')
  }

  async function confirmWithdraw() {
    if (!withdrawTarget) return
    setWithdrawing(true)
    setWithdrawError('')
    try {
      const data = await tournamentRequestsApi.withdraw(withdrawTarget.id)
      setNotice(`"${data.request.name}" was withdrawn.`)
      setWithdrawTarget(null)
      await reload()
    } catch (err) {
      setWithdrawError(toFormMessage(err))
      await reload() // e.g. the owner decided in the meantime: show the real status
    } finally {
      setWithdrawing(false)
    }
  }

  return (
    <section>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">My tournament requests</h1>
        <Link to="/request-tournament" className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-fg hover:bg-primary-hover">
          New request
        </Link>
      </div>

      {notice && (
        <Alert tone="success" className="mt-4">
          {notice}
        </Alert>
      )}

      <div className="mt-6">
        {status === 'loading' && <p className="py-10 text-center text-muted">Loading your requests...</p>}

        {status === 'error' && (
          <div className="space-y-3 py-6 text-center">
            <Alert tone="error">{error}</Alert>
            <Button variant="secondary" onClick={() => void retry()}>
              Try again
            </Button>
          </div>
        )}

        {status === 'ready' && error && <Alert tone="error" className="mb-4">{error}</Alert>}

        {status === 'ready' && items.length === 0 && (
          <div className="rounded-xl border border-dashed border-line-strong bg-surface p-10 text-center">
            <p className="font-medium">You have not requested a tournament yet.</p>
            <p className="mt-1 text-sm text-muted">Send a request and the owner will review it.</p>
            <Link
              to="/request-tournament"
              className="mt-4 inline-block rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-fg hover:bg-primary-hover"
            >
              Request a tournament
            </Link>
          </div>
        )}

        {status === 'ready' && items.length > 0 && (
          <ul className="space-y-4">
            {items.map((request) => (
              <li key={request.id} className="rounded-xl border border-line bg-surface p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="break-words text-lg font-semibold">{request.name}</h2>
                    <p className="text-xs text-subtle">Submitted {formatDateTime(request.submittedAt)}</p>
                  </div>
                  <StatusBadge status={request.status} />
                </div>

                <p className="mt-3 whitespace-pre-wrap break-words text-sm text-muted">{request.description}</p>
                <p className="mt-3 text-xs text-subtle">{STATUS_DESCRIPTIONS[request.status]}</p>

                {request.response && (
                  <div className="mt-3 rounded-lg border border-line bg-surface-2 px-3 py-2 text-sm">
                    <p className="text-xs font-semibold uppercase tracking-wide text-subtle">
                      Owner's response{request.reviewedAt ? ` · ${formatDateTime(request.reviewedAt)}` : ''}
                    </p>
                    <p className="mt-1 whitespace-pre-wrap break-words text-fg">{request.response}</p>
                  </div>
                )}

                {request.status === 'pending' && (
                  <div className="mt-4">
                    <Button variant="secondary" size="sm" onClick={() => setWithdrawTarget(request)}>
                      Withdraw request
                    </Button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}

        {status === 'ready' && hasMore && (
          <div className="mt-6 text-center">
            <Button variant="secondary" onClick={() => void loadMore()} loading={loadingMore}>
              Load more
            </Button>
          </div>
        )}
      </div>

      {withdrawTarget && (
        <Modal title="Withdraw this request?" onClose={closeModal} busy={withdrawing}>
          <p className="mt-2 text-sm text-muted">
            "{withdrawTarget.name}" will no longer be reviewed by the owner. You can submit a new request afterwards.
          </p>
          {withdrawError && <Alert tone="error" className="mt-4">{withdrawError}</Alert>}
          <div className="mt-6 flex justify-end gap-3">
            <Button variant="secondary" onClick={closeModal} disabled={withdrawing}>
              Keep request
            </Button>
            <Button variant="danger" onClick={() => void confirmWithdraw()} loading={withdrawing}>
              {withdrawing ? 'Withdrawing...' : 'Withdraw'}
            </Button>
          </div>
        </Modal>
      )}
    </section>
  )
}

export default MyRequests

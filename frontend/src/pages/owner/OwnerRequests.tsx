import { useCallback, useState } from 'react'
import { ownerRequestsApi } from '../../api/tournamentRequests.ts'
import type { OwnerRequestDto } from '../../api/tournamentRequests.ts'
import TextAreaField from '../../components/TextAreaField.tsx'
import Alert from '../../components/ui/Alert.tsx'
import Button from '../../components/ui/Button.tsx'
import Modal from '../../components/ui/Modal.tsx'
import StatusBadge from '../../components/ui/StatusBadge.tsx'
import { usePaginatedList } from '../../hooks/usePaginatedList.ts'
import { formatDateTime } from '../../utils/format.ts'
import { toFormMessage } from '../../utils/fieldErrors.ts'

const PAGE_SIZE = 10
type Tab = 'pending' | 'all'
type Decision = 'accept' | 'reject'

interface PendingDecision {
  request: OwnerRequestDto
  decision: Decision
}

function OwnerRequests() {
  const [tab, setTab] = useState<Tab>('pending')

  // A new function per tab makes the list reload from page 1.
  const fetchPage = useCallback(
    async (page: number, signal: AbortSignal) => {
      const data = await ownerRequestsApi.list(tab === 'pending' ? 'pending' : undefined, page, PAGE_SIZE, signal)
      return { items: data.requests, hasMore: data.hasMore, meta: { pendingCount: data.pendingCount } }
    },
    [tab],
  )
  const { items, meta, status, error, hasMore, loadingMore, loadMore, reload, retry } = usePaginatedList<OwnerRequestDto, { pendingCount: number }>(fetchPage)

  const [target, setTarget] = useState<PendingDecision | null>(null)
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [modalError, setModalError] = useState('')
  const [notice, setNotice] = useState<{ tone: 'success' | 'error'; text: string } | null>(null)

  function openDecision(request: OwnerRequestDto, decision: Decision) {
    setTarget({ request, decision })
    setMessage('')
    setModalError('')
  }

  function closeModal() {
    setTarget(null)
    setModalError('')
  }

  async function confirmDecision() {
    if (!target) return
    setSubmitting(true)
    setModalError('')
    try {
      const trimmed = message.trim()
      const data = await ownerRequestsApi.decide(target.request.id, {
        decision: target.decision,
        ...(trimmed ? { response: trimmed } : {}),
      })
      setNotice({
        tone: 'success',
        text: data.tournament
          ? `Accepted "${data.request.name}". Draft tournament created (${data.tournament.slug}).`
          : `Rejected "${data.request.name}".`,
      })
      setTarget(null)
      await reload()
    } catch (err) {
      setModalError(toFormMessage(err))
      await reload() // already decided elsewhere: show the current state
    } finally {
      setSubmitting(false)
    }
  }

  const pendingCount = meta?.pendingCount
  const accepting = target?.decision === 'accept'

  return (
    <section>
      <h1 className="text-2xl font-bold">Tournament requests</h1>
      <p className="mt-1 text-sm text-muted">Review requests from users who want to organize a tournament.</p>

      <div role="tablist" aria-label="Request filter" className="mt-6 inline-flex rounded-lg border border-line bg-surface p-1">
        {(['pending', 'all'] as const).map((value) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={tab === value}
            onClick={() => {
              setNotice(null)
              setTab(value)
            }}
            className={`rounded-md px-4 py-1.5 text-sm font-medium ${
              tab === value ? 'bg-primary text-primary-fg' : 'text-muted hover:bg-surface-2'
            }`}
          >
            {value === 'pending' ? `Pending${pendingCount !== undefined ? ` (${pendingCount})` : ''}` : 'All'}
          </button>
        ))}
      </div>

      {notice && (
        <Alert tone={notice.tone} className="mt-4">
          {notice.text}
        </Alert>
      )}

      <div className="mt-6">
        {status === 'loading' && <p className="py-10 text-center text-muted">Loading requests...</p>}

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
            <p className="font-medium">{tab === 'pending' ? 'No pending requests.' : 'No requests yet.'}</p>
            <p className="mt-1 text-sm text-muted">New requests will show up here.</p>
          </div>
        )}

        {status === 'ready' && items.length > 0 && (
          <ul className="space-y-4">
            {items.map((request) => (
              <li key={request.id} className="rounded-xl border border-line bg-surface p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="break-words text-lg font-semibold">{request.name}</h2>
                    <p className="text-sm text-muted">
                      {request.requester ? (
                        <>
                          Requested by <span className="font-medium text-fg">{request.requester.username}</span> ({request.requester.email})
                        </>
                      ) : (
                        'Requested by a deleted account'
                      )}
                    </p>
                    <p className="text-xs text-subtle">Submitted {formatDateTime(request.submittedAt)}</p>
                  </div>
                  <StatusBadge status={request.status} />
                </div>

                <p className="mt-3 whitespace-pre-wrap break-words text-sm text-muted">{request.description}</p>

                {request.response && (
                  <div className="mt-3 rounded-lg border border-line bg-surface-2 px-3 py-2 text-sm">
                    <p className="text-xs font-semibold uppercase tracking-wide text-subtle">
                      Your response{request.reviewedAt ? ` · ${formatDateTime(request.reviewedAt)}` : ''}
                    </p>
                    <p className="mt-1 whitespace-pre-wrap break-words text-fg">{request.response}</p>
                  </div>
                )}
                {!request.response && request.reviewedAt && (
                  <p className="mt-3 text-xs text-subtle">Reviewed {formatDateTime(request.reviewedAt)}</p>
                )}

                {request.status === 'pending' && (
                  <div className="mt-4 flex flex-wrap gap-3">
                    <Button onClick={() => openDecision(request, 'accept')}>Accept</Button>
                    <Button variant="danger" onClick={() => openDecision(request, 'reject')}>
                      Reject
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

      {target && (
        <Modal title={accepting ? 'Accept this request?' : 'Reject this request?'} onClose={closeModal} busy={submitting}>
          <p className="mt-2 text-sm text-muted">
            {accepting
              ? `A draft tournament "${target.request.name}" will be created and ${target.request.requester?.username ?? 'the requester'} will be notified.`
              : `${target.request.requester?.username ?? 'The requester'} will be notified that "${target.request.name}" was rejected. No tournament is created.`}
          </p>
          <div className="mt-4">
            <TextAreaField
              label="Message to the requester (optional)"
              name="decision-response"
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              counter={`${message.trim().length} / 1000`}
              error={message.trim().length > 1000 ? 'Message must be at most 1000 characters' : undefined}
            />
          </div>
          {modalError && <Alert tone="error" className="mt-4">{modalError}</Alert>}
          <div className="mt-6 flex justify-end gap-3">
            <Button variant="secondary" onClick={closeModal} disabled={submitting}>
              Cancel
            </Button>
            <Button
              variant={accepting ? 'primary' : 'danger'}
              onClick={() => void confirmDecision()}
              loading={submitting}
              disabled={message.trim().length > 1000}
            >
              {accepting ? 'Accept request' : 'Reject request'}
            </Button>
          </div>
        </Modal>
      )}
    </section>
  )
}

export default OwnerRequests

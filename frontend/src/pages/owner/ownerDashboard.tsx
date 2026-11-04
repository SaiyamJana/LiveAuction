import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ownerRequestsApi } from '../../api/tournamentRequests.ts'
import { ApiRequestError } from '../../api/client.ts'

function OwnerDashboard() {
  const [pending, setPending] = useState<number | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    ownerRequestsApi
      .list('pending', 1, 1, controller.signal)
      .then((data) => setPending(data.pendingCount))
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === 'AbortError') return
        setError(err instanceof ApiRequestError ? err.message : 'Could not load request count.')
      })
    return () => controller.abort()
  }, [])

  return (
    <section>
      <h1 className="text-3xl font-bold">Owner Dashboard</h1>
      <p className="mt-2 text-muted">Manage the platform from here.</p>

      <Link
        to="/owner/requests"
        className="mt-6 block max-w-md rounded-xl border border-line bg-surface p-5 shadow-sm hover:border-primary"
      >
        <p className="text-sm font-medium text-muted">Tournament requests</p>
        <p className="mt-1 text-3xl font-bold text-primary">{pending === null ? '...' : pending}</p>
        <p className="mt-1 text-sm text-muted">{error ? error : pending === 1 ? 'request waiting for review' : 'requests waiting for review'}</p>
      </Link>
    </section>
  )
}

export default OwnerDashboard

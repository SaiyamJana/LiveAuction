import { useCallback, useEffect, useState } from 'react'
import { api, ApiRequestError } from '../api/client.ts'

interface HealthResponse {
  status: string
}

type HealthState =
  | { kind: 'loading' }
  | { kind: 'online' }
  | { kind: 'error'; message: string }

function Home() {
  const [health, setHealth] = useState<HealthState>({ kind: 'loading' })
  // Changing this number runs the check again (used by the retry button).
  const [attempt, setAttempt] = useState(0)

  const retry = useCallback(() => {
    setHealth({ kind: 'loading' })
    setAttempt((n) => n + 1)
  }, [])

  useEffect(() => {
    const controller = new AbortController()

    api
      .get<HealthResponse>('/api/health', controller.signal)
      .then((data) => {
        if (data.status === 'ok') {
          setHealth({ kind: 'online' })
        } else {
          setHealth({ kind: 'error', message: 'Unexpected response from the server.' })
        }
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') return
        const message =
          error instanceof ApiRequestError ? error.message : 'Something went wrong.'
        setHealth({ kind: 'error', message })
      })

    // Cancel the request if the page closes before it finishes.
    return () => controller.abort()
  }, [attempt])

  return (
    <section>
      <h1 className="text-4xl font-bold">Tournament Auction</h1>
      <p className="mt-4 max-w-2xl text-muted">
        Organize tournaments, register players, run live team auctions and follow fixtures,
        standings and statistics, all in one place.
      </p>

      <div className="mt-8 inline-flex items-center gap-3 rounded-lg border border-line bg-surface px-4 py-3 shadow-sm">
        <span className="text-sm text-muted">Backend status:</span>

        {health.kind === 'loading' && (
          <span className="flex items-center gap-2 text-warning">
            <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-warning" />
            Checking...
          </span>
        )}

        {health.kind === 'online' && (
          <span className="flex items-center gap-2 text-success">
            <span className="h-2.5 w-2.5 rounded-full bg-success" />
            Online
          </span>
        )}

        {health.kind === 'error' && (
          <span className="flex items-center gap-3 text-danger">
            <span className="h-2.5 w-2.5 rounded-full bg-danger" />
            {health.message}
            <button
              type="button"
              onClick={retry}
              className="rounded-lg border border-danger px-2 py-0.5 text-xs hover:bg-danger-soft"
            >
              Retry
            </button>
          </span>
        )}
      </div>
    </section>
  )
}

export default Home

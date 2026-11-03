import { useEffect, useState } from 'react'
import { ownerApi } from '../../api/auth.ts'
import { ApiRequestError } from '../../api/client.ts'

// Empty shell (Step 7). The ping call is a temporary check that the owner-only API accepts this session.
function OwnerDashboard() {
  const [apiStatus, setApiStatus] = useState<string>('Checking owner API...')

  useEffect(() => {
    ownerApi
      .ping()
      .then((data) => setApiStatus(`Owner API reachable (${data.message})`))
      .catch((error: unknown) =>
        setApiStatus(error instanceof ApiRequestError ? `Owner API error: ${error.message}` : 'Owner API error'),
      )
  }, [])

  return (
    <section>
      <h1 className="text-3xl font-bold">Owner Dashboard</h1>
      <p className="mt-4 text-slate-300">Owner tools (tournament requests, overview) will appear here.</p>
      <p className="mt-4 text-sm text-slate-500">{apiStatus}</p>
    </section>
  )
}

export default OwnerDashboard
import { Link } from 'react-router-dom'
import { useAuth } from '../context/auth-context.ts'

function Dashboard() {
  const { user } = useAuth()

  return (
    <section>
      <h1 className="text-3xl font-bold">Dashboard</h1>
      <p className="mt-4 text-muted">
        Welcome, <span className="font-semibold text-fg">{user?.username}</span>.
      </p>
      <p className="mt-2 text-sm text-subtle">Signed in as {user?.email} ({user?.role}).</p>

      {user?.role === 'user' && (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Link to="/request-tournament" className="rounded-xl border border-line bg-surface p-5 shadow-sm hover:border-primary">
            <p className="font-semibold">Request a tournament</p>
            <p className="mt-1 text-sm text-muted">Ask the owner for permission to organize one.</p>
          </Link>
          <Link to="/my-requests" className="rounded-xl border border-line bg-surface p-5 shadow-sm hover:border-primary">
            <p className="font-semibold">My requests</p>
            <p className="mt-1 text-sm text-muted">Track decisions or withdraw a pending request.</p>
          </Link>
        </div>
      )}
    </section>
  )
}

export default Dashboard

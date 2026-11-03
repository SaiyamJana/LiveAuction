import { useAuth } from '../context/auth-context.ts'

// Placeholder page that only exists to prove route protection works.
function Dashboard() {
  const { user } = useAuth()

  return (
    <section>
      <h1 className="text-3xl font-bold">Dashboard</h1>
      <p className="mt-4 text-slate-300">
        Welcome, <span className="font-semibold text-white">{user?.username}</span>.
      </p>
      <p className="mt-2 text-sm text-slate-500">
        Signed in as {user?.email} ({user?.role}). Tournament features will appear here in later phases.
      </p>
    </section>
  )
}

export default Dashboard
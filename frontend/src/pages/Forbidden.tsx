import { Link } from 'react-router-dom'

function Forbidden() {
  return (
    <section className="text-center">
      <p className="text-6xl font-bold text-slate-600">403</p>
      <h1 className="mt-4 text-2xl font-semibold">Access denied</h1>
      <p className="mt-2 text-slate-400">You do not have permission to view this page.</p>
      <Link
        to="/"
        className="mt-6 inline-block rounded bg-slate-100 px-4 py-2 font-medium text-slate-900 hover:bg-white"
      >
        Back to Home
      </Link>
    </section>
  )
}

export default Forbidden
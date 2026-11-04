import { Link } from 'react-router-dom'

function Forbidden() {
  return (
    <section className="text-center">
      <p className="text-6xl font-bold text-subtle">403</p>
      <h1 className="mt-4 text-2xl font-semibold">Access denied</h1>
      <p className="mt-2 text-muted">You do not have permission to view this page.</p>
      <Link
        to="/"
        className="mt-6 inline-block rounded bg-primary px-4 py-2 font-medium text-primary-fg hover:bg-primary-hover"
      >
        Back to Home
      </Link>
    </section>
  )
}

export default Forbidden
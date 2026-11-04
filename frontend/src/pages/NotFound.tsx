import { Link } from 'react-router-dom'

function NotFound() {
  return (
    <section className="text-center">
      <p className="text-6xl font-bold text-subtle">404</p>
      <h1 className="mt-4 text-2xl font-semibold">Page not found</h1>
      <p className="mt-2 text-muted">The page you are looking for does not exist.</p>
      <Link
        to="/"
        className="mt-6 inline-block rounded bg-primary px-4 py-2 font-medium text-primary-fg hover:bg-primary-hover"
      >
        Back to Home
      </Link>
    </section>
  )
}

export default NotFound

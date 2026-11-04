import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/auth-context.ts'
import NotificationBell from './NotificationBell.tsx'

function navClass({ isActive }: { isActive: boolean }) {
  return isActive ? 'font-semibold text-primary' : 'text-muted hover:text-fg'
}

function Layout() {
  const { user, loading, logout } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await logout()
    navigate('/', { replace: true })
  }

  return (
    <div className="min-h-screen bg-bg text-fg">
      <header className="border-b border-line bg-surface shadow-sm">
        <nav className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-3">
          <Link to="/" className="text-lg font-bold text-primary">
            Tournament Auction
          </Link>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
            <NavLink to="/" end className={navClass}>
              Home
            </NavLink>

            {/* While the first /me check runs, show nothing to avoid a flash of the wrong links. */}
            {!loading && user && (
              <>
                {user.role === 'owner' ? (
                  <>
                    <NavLink to="/owner" end className={navClass}>
                      Owner
                    </NavLink>
                    <NavLink to="/owner/requests" className={navClass}>
                      Requests
                    </NavLink>
                  </>
                ) : (
                  <>
                    <NavLink to="/dashboard" className={navClass}>
                      Dashboard
                    </NavLink>
                    <NavLink to="/request-tournament" className={navClass}>
                      Request a Tournament
                    </NavLink>
                    <NavLink to="/my-requests" className={navClass}>
                      My Requests
                    </NavLink>
                  </>
                )}
                <NavLink to="/settings" className={navClass}>
                  Settings
                </NavLink>
                <NotificationBell />
                <span className="text-subtle">{user.username}</span>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="rounded-lg border border-line-strong px-3 py-1 text-fg hover:bg-surface-2"
                >
                  Logout
                </button>
              </>
            )}

            {!loading && !user && (
              <>
                <NavLink to="/login" className={navClass}>
                  Login
                </NavLink>
                <NavLink to="/register" className={navClass}>
                  Register
                </NavLink>
              </>
            )}
          </div>
        </nav>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8 sm:py-10">
        {/* The current page is drawn here */}
        <Outlet />
      </main>
    </div>
  )
}

export default Layout

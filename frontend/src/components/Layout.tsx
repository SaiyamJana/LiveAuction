import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/auth-context.ts'

function navClass({ isActive }: { isActive: boolean }) {
  return isActive ? 'font-semibold text-white' : 'text-slate-400 hover:text-white'
}

function Layout() {
  const { user, loading, logout } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await logout()
    navigate('/', { replace: true })
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800">
        <nav className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <Link to="/" className="text-lg font-bold">
            Tournament Auction
          </Link>
          <div className="flex items-center gap-4 text-sm">
            <NavLink to="/" end className={navClass}>
              Home
            </NavLink>

            {/* While the first /me check runs, show nothing to avoid a flash of the wrong links. */}
            {!loading && user && (
              <>
                {user.role === 'owner' ? (
                  <NavLink to="/owner" className={navClass}>
                    Owner
                  </NavLink>
                ) : (
                  <NavLink to="/dashboard" className={navClass}>
                    Dashboard
                  </NavLink>
                )}
                <NavLink to="/settings" className={navClass}>
                  Settings
                </NavLink>
                <span className="text-slate-500">{user.username}</span>
                <button type="button" onClick={handleLogout}
                  className="rounded border border-slate-600 px-3 py-1 text-slate-200 hover:bg-slate-800">
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

      <main className="mx-auto max-w-5xl px-4 py-10">
        {/* The current page is drawn here */}
        <Outlet />
      </main>
    </div>
  )
}

export default Layout
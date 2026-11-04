import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/auth-context.ts'

// Wrap routes that need a logged-in user:
//   <Route element={<ProtectedRoute />}> ...child routes... </Route>
function ProtectedRoute() {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return <p className="text-center text-muted">Loading...</p>
  }

  if (!user) {
    // Remember where the visitor wanted to go, so login can send them back.
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return <Outlet />
}

export default ProtectedRoute
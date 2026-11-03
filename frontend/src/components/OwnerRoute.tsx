import { Outlet } from 'react-router-dom'
import { useAuth } from '../context/auth-context.ts'
import Forbidden from '../pages/Forbidden.tsx'

// Use INSIDE <ProtectedRoute />. This only hides the page for convenience;
// the real protection is requireRole('owner') on the backend.
function OwnerRoute() {
  const { user } = useAuth()

  if (user?.role !== 'owner') {
    return <Forbidden />
  }

  return <Outlet />
}

export default OwnerRoute
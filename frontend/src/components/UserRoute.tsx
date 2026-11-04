import { Outlet } from 'react-router-dom'
import { useAuth } from '../context/auth-context.ts'
import Forbidden from '../pages/Forbidden.tsx'

// Use INSIDE <ProtectedRoute />. Normal users only (the owner reviews requests, never submits them).
// The real protection is requireRole('user') on the backend.
function UserRoute() {
  const { user } = useAuth()

  if (user?.role !== 'user') {
    return <Forbidden />
  }

  return <Outlet />
}

export default UserRoute

import { createContext, useContext } from 'react'
import type { AuthUser } from '../api/auth.ts'

export interface AuthContextValue {
  user: AuthUser | null
  // True only while the first /me check after page load is running.
  loading: boolean
  login: (email: string, password: string) => Promise<AuthUser>
  logout: () => Promise<void>
  // Used after account deletion, when the session is already gone on the server.
  clearUser: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext)
  if (!value) {
    throw new Error('useAuth must be used inside <AuthProvider>')
  }
  return value
}
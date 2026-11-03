import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { authApi } from '../api/auth.ts'
import type { AuthUser } from '../api/auth.ts'
import { AuthContext } from './auth-context.ts'
import type { AuthContextValue } from './auth-context.ts'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  // On every page load / refresh, ask the server who is logged in (cookie-based).
  useEffect(() => {
    const controller = new AbortController()

    authApi
      .me(controller.signal)
      .then((data) => setUser(data.user))
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') return
        setUser(null) // 401 = logged out; network errors are treated the same
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })

    return () => controller.abort()
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const data = await authApi.login({ email, password })
    setUser(data.user)
    return data.user
  }, [])

  const logout = useCallback(async () => {
    try {
      await authApi.logout()
    } finally {
      setUser(null) // even if the request failed, leave the logged-in UI
    }
  }, [])

  const clearUser = useCallback(() => setUser(null), [])

  const value = useMemo<AuthContextValue>(
    () => ({ user, loading, login, logout, clearUser }),
    [user, loading, login, logout, clearUser],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
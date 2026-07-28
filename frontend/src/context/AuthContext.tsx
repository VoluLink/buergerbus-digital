import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { login as loginRequest, logout as logoutRequest, refreshToken } from '../services/auth'
import { getCurrentUserProfile } from '../services/profile'
import { clearStoredAuth, getStoredToken, setStoredToken } from '../services/httpClient'
import type { LoginCredentials } from '../types/Login'
import type { UserProfile } from '../types/UserProfile'

type AuthContextValue = {
  currentUser: UserProfile | null
  isLoading: boolean
  error: string | null
  login: (credentials: LoginCredentials) => Promise<UserProfile>
  logout: () => void
  refreshProfile: () => Promise<UserProfile | null>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

const SESSION_EXPIRED_MESSAGE = 'Deine Sitzung ist abgelaufen. Bitte melde dich erneut an.'
const SESSION_IDLE_MESSAGE = 'Deine Sitzung wurde wegen Inaktivität beendet. Bitte melde dich erneut an.'
const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000
let restoreAccessTokenInFlight: Promise<string | null> | null = null

function restoreAccessTokenOnce() {
  restoreAccessTokenInFlight ??= refreshToken()
    .then(response => response.token)
    .catch(() => null)
    .finally(() => { restoreAccessTokenInFlight = null })
  return restoreAccessTokenInFlight
}
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const idleTimeoutRef = useRef<number | null>(null)

  const logout = useCallback((message?: string) => {
    void logoutRequest().catch(() => undefined)
    clearStoredAuth()
    setCurrentUser(null)
    setError(message ?? null)
  }, [])

  const resetIdleTimeout = useCallback(() => {
    if (idleTimeoutRef.current !== null) {
      window.clearTimeout(idleTimeoutRef.current)
    }

    idleTimeoutRef.current = window.setTimeout(() => {
      logout(SESSION_IDLE_MESSAGE)
    }, INACTIVITY_TIMEOUT_MS)
  }, [logout])

  const handleUserActivity = useCallback(() => {
    if (!getStoredToken()) {
      return
    }

    resetIdleTimeout()
  }, [resetIdleTimeout])

  const refreshProfile = useCallback(async () => {
    const token = getStoredToken()
    if (!token) {
      const refreshedToken = await restoreAccessTokenOnce()
      if (!refreshedToken) { setCurrentUser(null); setIsLoading(false); return null }
      setStoredToken(refreshedToken)
    }

    setIsLoading(true)
    setError(null)

    try {
      const profile = await getCurrentUserProfile()
      setCurrentUser(profile)
      resetIdleTimeout()
      return profile
    } catch (err) {
      setCurrentUser(null)
      setError(err instanceof Error ? err.message : 'Profil konnte nicht geladen werden.')
      clearStoredAuth()
      return null
    } finally {
      setIsLoading(false)
    }
  }, [resetIdleTimeout])

  useEffect(() => {
    void refreshProfile()
  }, [refreshProfile])

  useEffect(() => {
    if (!currentUser || !getStoredToken()) {
      if (idleTimeoutRef.current !== null) {
        window.clearTimeout(idleTimeoutRef.current)
        idleTimeoutRef.current = null
      }
      return undefined
    }

    const activityEvents: Array<keyof WindowEventMap> = ['pointerdown', 'keydown', 'scroll', 'touchstart']

    resetIdleTimeout()

    for (const eventName of activityEvents) {
      window.addEventListener(eventName, handleUserActivity, { passive: true })
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        handleUserActivity()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      for (const eventName of activityEvents) {
        window.removeEventListener(eventName, handleUserActivity)
      }

      document.removeEventListener('visibilitychange', handleVisibilityChange)

      if (idleTimeoutRef.current !== null) {
        window.clearTimeout(idleTimeoutRef.current)
        idleTimeoutRef.current = null
      }
    }
  }, [currentUser, handleUserActivity, resetIdleTimeout])

  useEffect(() => {
    function handleUnauthorized() {
      setCurrentUser(null)
      setError(SESSION_EXPIRED_MESSAGE)
    }

    window.addEventListener('bb:auth:unauthorized', handleUnauthorized)
    return () => window.removeEventListener('bb:auth:unauthorized', handleUnauthorized)
  }, [])

  const login = useCallback(async (credentials: LoginCredentials) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await loginRequest(credentials)

      if (!response.success) {
        throw new Error(response.message || 'Login fehlgeschlagen.')
      }

      if (!response.token) {
        throw new Error('Login fehlgeschlagen: Token fehlt.')
      }

      setStoredToken(response.token)
      setCurrentUser(response.user)
      resetIdleTimeout()
      return response.user
    } catch (err) {
      setCurrentUser(null)
      setError(err instanceof Error ? err.message : 'Login fehlgeschlagen.')
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [resetIdleTimeout])

  const value = useMemo<AuthContextValue>(() => ({
    currentUser,
    isLoading,
    error,
    login,
    logout,
    refreshProfile,
  }), [currentUser, error, isLoading, login, logout, refreshProfile])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth muss innerhalb von AuthProvider verwendet werden.')
  }
  return context
}

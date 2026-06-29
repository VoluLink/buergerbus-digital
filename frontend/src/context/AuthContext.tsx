import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { login as loginRequest, refreshToken as refreshTokenRequest } from '../services/auth'
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

const USER_ID_STORAGE_KEY = 'bb.auth.userId'
const SESSION_EXPIRED_MESSAGE = 'Deine Sitzung ist abgelaufen. Bitte melde dich erneut an.'
const SESSION_IDLE_MESSAGE = 'Deine Sitzung wurde wegen Inaktivität beendet. Bitte melde dich erneut an.'
const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000
const REFRESH_THRESHOLD_MS = 2 * 60 * 1000
const REFRESH_THROTTLE_MS = 30 * 1000

function parseJwtExpiration(token: string): number | null {
  const segments = token.split('.')
  if (segments.length < 2) {
    return null
  }

  try {
    const normalizedPayload = segments[1].replace(/-/g, '+').replace(/_/g, '/')
    const paddedPayload = normalizedPayload.padEnd(Math.ceil(normalizedPayload.length / 4) * 4, '=')
    const payload = JSON.parse(window.atob(paddedPayload)) as { exp?: number }

    return typeof payload.exp === 'number' ? payload.exp * 1000 : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const idleTimeoutRef = useRef<number | null>(null)
  const isRefreshingRef = useRef(false)
  const lastRefreshAttemptRef = useRef(0)

  const logout = useCallback((message?: string) => {
    clearStoredAuth()
    setCurrentUser(null)
    setError(message ?? null)
  }, [])

  const refreshAccessToken = useCallback(async () => {
    if (isRefreshingRef.current) {
      return getStoredToken()
    }

    isRefreshingRef.current = true

    try {
      const response = await refreshTokenRequest()
      setStoredToken(response.token)
      lastRefreshAttemptRef.current = Date.now()
      return response.token
    } catch (err) {
      logout(err instanceof Error ? err.message : SESSION_EXPIRED_MESSAGE)
      return null
    } finally {
      isRefreshingRef.current = false
    }
  }, [logout])

  const maybeRefreshToken = useCallback(async () => {
    const token = getStoredToken()
    if (!token) {
      return
    }

    const expiration = parseJwtExpiration(token)
    if (!expiration) {
      return
    }

    const now = Date.now()
    if (expiration - now > REFRESH_THRESHOLD_MS) {
      return
    }

    if (now - lastRefreshAttemptRef.current < REFRESH_THROTTLE_MS) {
      return
    }

    await refreshAccessToken()
  }, [refreshAccessToken])

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
    void maybeRefreshToken()
  }, [maybeRefreshToken, resetIdleTimeout])

  const refreshProfile = useCallback(async () => {
    const token = getStoredToken()
    const storedUserId = localStorage.getItem(USER_ID_STORAGE_KEY)
    const userId = storedUserId ? Number(storedUserId) : null

    if (!token || !userId || Number.isNaN(userId)) {
      setCurrentUser(null)
      setIsLoading(false)
      if (!token) {
        localStorage.removeItem(USER_ID_STORAGE_KEY)
      }
      return null
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
    void refreshProfile()
  }, [location.pathname, refreshProfile])

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
      lastRefreshAttemptRef.current = Date.now()

      localStorage.setItem(USER_ID_STORAGE_KEY, String(response.user.id))
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

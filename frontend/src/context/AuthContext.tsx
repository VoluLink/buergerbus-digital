import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { login as loginRequest } from '../services/auth'
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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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
      return profile
    } catch (err) {
      setCurrentUser(null)
      setError(err instanceof Error ? err.message : 'Profil konnte nicht geladen werden.')
      clearStoredAuth()
      return null
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void refreshProfile()
  }, [refreshProfile])

  useEffect(() => {
    void refreshProfile()
  }, [location.pathname, refreshProfile])

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

      localStorage.setItem(USER_ID_STORAGE_KEY, String(response.user.id))
      setCurrentUser(response.user)
      return response.user
    } catch (err) {
      setCurrentUser(null)
      setError(err instanceof Error ? err.message : 'Login fehlgeschlagen.')
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  const logout = useCallback(() => {
    clearStoredAuth()
    setCurrentUser(null)
  }, [])

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

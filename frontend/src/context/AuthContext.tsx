import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { login as loginRequest } from '../services/auth'
import { getCurrentUserProfile } from '../services/profile'
import type { LoginCredentials } from '../types/Login'
import type { UserProfile } from '../types/UserProfile'

type AuthContextValue = {
  currentUser: UserProfile | null
  token: string | null
  isLoading: boolean
  error: string | null
  login: (credentials: LoginCredentials) => Promise<UserProfile>
  logout: () => void
  refreshProfile: () => Promise<UserProfile | null>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

const USER_ID_STORAGE_KEY = 'bb.auth.userId'
const TOKEN_STORAGE_KEY = 'bb.auth.token'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refreshProfile = useCallback(async () => {
    const storedUserId = localStorage.getItem(USER_ID_STORAGE_KEY)
    const userId = storedUserId ? Number(storedUserId) : null

    const storedToken = localStorage.getItem(TOKEN_STORAGE_KEY)
    setToken(storedToken)

    if (!userId || Number.isNaN(userId)) {
      setCurrentUser(null)
      setIsLoading(false)
      return null
    }

    setIsLoading(true)
    setError(null)

    try {
      const profile = await getCurrentUserProfile(userId)
      setCurrentUser(profile)
      return profile
    } catch (err) {
      setCurrentUser(null)
      setError(err instanceof Error ? err.message : 'Profil konnte nicht geladen werden.')
      localStorage.removeItem(USER_ID_STORAGE_KEY)
      localStorage.removeItem(TOKEN_STORAGE_KEY)
      setToken(null)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void refreshProfile()
  }, [refreshProfile])

  const login = useCallback(async (credentials: LoginCredentials) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await loginRequest(credentials)

      if (!response.success) {
        throw new Error(response.message || 'Login fehlgeschlagen.')
      }

      localStorage.setItem(USER_ID_STORAGE_KEY, String(response.user.id))
      const nextToken = response.token ?? null
      if (nextToken) {
        localStorage.setItem(TOKEN_STORAGE_KEY, nextToken)
      } else {
        localStorage.removeItem(TOKEN_STORAGE_KEY)
      }

      setToken(nextToken)
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
    localStorage.removeItem(USER_ID_STORAGE_KEY)
    localStorage.removeItem(TOKEN_STORAGE_KEY)
    setCurrentUser(null)
    setToken(null)
  }, [])

  const value = useMemo<AuthContextValue>(() => ({
    currentUser,
    token,
    isLoading,
    error,
    login,
    logout,
    refreshProfile,
  }), [currentUser, token, error, isLoading, login, logout, refreshProfile])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth muss innerhalb von AuthProvider verwendet werden.')
  }
  return context
}

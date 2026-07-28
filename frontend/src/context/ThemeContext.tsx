import { createContext, useContext, useEffect, useMemo, useState } from 'react'

export type ThemePreference = 'light' | 'dark'

type ThemeContextValue = {
  preference: ThemePreference
  setPreference: (preference: ThemePreference) => void
}

const storageKey = 'buergerbus-theme-preference'
const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

function getInitialPreference(): ThemePreference {
  const stored = localStorage.getItem(storageKey)
  return stored === 'dark' ? 'dark' : 'light'
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [preference, setPreference] = useState<ThemePreference>(getInitialPreference)

  useEffect(() => {
    const isDark = preference === 'dark'
    document.documentElement.classList.toggle('dark', isDark)
    document.documentElement.style.colorScheme = isDark ? 'dark' : 'light'
  }, [preference])

  const value = useMemo(() => ({
    preference,
    setPreference: (nextPreference: ThemePreference) => {
      localStorage.setItem(storageKey, nextPreference)
      setPreference(nextPreference)
    },
  }), [preference])

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const value = useContext(ThemeContext)
  if (!value) throw new Error('useTheme must be used within a ThemeProvider')
  return value
}

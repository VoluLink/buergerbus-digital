import { createContext, useContext, useEffect, useState } from 'react'
import { useAuth } from './AuthContext'

type InitiativeContextValue = {
  activeInitiativeId: number | null
  setActiveInitiativeId: (initiativeId: number | null) => void
}

const InitiativeContext = createContext<InitiativeContextValue | undefined>(undefined)

export function InitiativeProvider({ children }: { children: React.ReactNode }) {
  const { currentUser } = useAuth()
  const [activeInitiativeId, setActiveInitiativeId] = useState<number | null>(null)

  useEffect(() => {
    setActiveInitiativeId(currentUser?.initiative?.id ?? null)
  }, [currentUser?.id, currentUser?.initiative?.id])

  return (
    <InitiativeContext.Provider value={{ activeInitiativeId, setActiveInitiativeId }}>
      {children}
    </InitiativeContext.Provider>
  )
}

export function useInitiative() {
  const value = useContext(InitiativeContext)
  if (!value) throw new Error('useInitiative must be used within an InitiativeProvider')
  return value
}

export interface InitiativeSummary {
  id: number
  name: string
}

export interface RoleSummary {
  id: number
  name: string
}

export interface FahrerProfile {
  id: number
  fuehrerscheinklasse?: string | null
  letzteG25?: string | null
  naechsteG25?: string | null
  bemerkung?: string | null
  aktiv: boolean
}

export interface UserProfile {
  id: number
  username: string
  email: string
  vorname?: string | null
  nachname?: string | null
  adresse?: string | null
  telefonnummer?: string | null
  bemerkung?: string | null
  aktiv: boolean
  roles: string[]
  initiative?: InitiativeSummary | null
  fahrer?: FahrerProfile | null
}

export interface UserSummary {
  id: number
  username: string
  email: string
  roles: string[]
  initiative?: InitiativeSummary | null
  fahrerId?: number | null
  isActive: boolean
}
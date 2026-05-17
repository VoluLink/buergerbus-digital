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
  vorname: string
  nachname: string
  adresse: string
  telefonnummer?: string | null
  fuehrerscheinklasse: string
  letzteG25: string
  naechsteG25?: string | null
  bemerkung?: string | null
  aktiv: boolean
}

export interface UserProfile {
  id: number
  username: string
  email: string
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
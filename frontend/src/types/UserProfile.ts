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
  bemerkung?: string | null
  aktiv: boolean
}

export interface UserProfile {
  id: number
  username: string
  email: string
  activeRole?: string | null

  vorname?: string | null
  nachname?: string | null

  strasse?: string | null
  postleitzahl?: string | null
  ort?: string | null

  telefonnummer?: string | null
  bemerkung?: string | null

  fuehrerscheinklasse?: string | null
  letzteG25?: string | null
  naechsteG25?: string | null
  
  aktiv: boolean
  roles: string[]
  initiative?: InitiativeSummary | null
  fahrer?: FahrerProfile | null
}

export interface UserSummary {
  id: number
  username: string
  email: string
  activeRole?: string | null
  roles: string[]
  initiative?: InitiativeSummary | null
  fahrerId?: number | null
  isActive: boolean
}
export interface FahrerListItem {
  fahrerId: number
  benutzerId: number
  name: string
  email?: string | null
  telefonnummer?: string | null
  fahrzeug?: string | null
  status: string
  aktiv: boolean
  bemerkung?: string | null
}

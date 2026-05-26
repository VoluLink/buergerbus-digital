export interface FahrerListItem {
  fahrerId: number
  benutzerId: number
  name: string
  telefonnummer?: string | null
  fahrzeug?: string | null
  status: string
  aktiv: boolean
  bemerkung?: string | null
}

export interface FahrerMe {
  fahrerId: number
  benutzerId: number
  name: string
  telefonnummer?: string | null
  aktiv: boolean
  status: string
  bemerkung?: string | null
  fahrzeug?: string | null
  fahrzeuge: string[]
}

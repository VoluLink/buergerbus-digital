export interface Fahrzeug {
  id: number
  kennzeichen: string
  bezeichnung: string
  markeTyp: string
  fahrzeugart: string
  kapazitaet: number
  kilometerstand: number
  betriebsaufnahme: string
  bemerkung: string | null
  status: string
  aktiv: boolean
  initiativeId: number
  letzteWartung: string | null
  naechsteWartung: string | null
  schaeden: string | null
  reparaturtermin: string | null
}

export type FahrzeugFormMode = 'create' | 'edit'

export interface FahrzeugFormData {
  id: string
  kennzeichen: string
  bezeichnung: string
  markeTyp: string
  fahrzeugart: string
  kapazitaet: string
  kilometerstand: string
  betriebsaufnahme: string
  bemerkung: string
  status: string
  aktiv: 'true' | 'false'
  initiativeId: string
  letzteWartung: string
  naechsteWartung: string
  schaeden: string
  reparaturtermin: string
}

export type FahrzeugFieldType = 'text' | 'date' | 'textarea' | 'number' | 'select'

export interface FahrzeugFieldConfig {
  name: keyof FahrzeugFormData
  label: string
  type: FahrzeugFieldType
  options?: Array<{ label: string; value: string }>
}
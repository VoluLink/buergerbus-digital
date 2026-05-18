export interface Fahrzeug {
  id: number
  kennzeichen: string
  bezeichnung: string
  kapazitaet: number
  kilometerstand: number
  betriebsaufnahme: string
  bemerkung: string | null
  status: string
  aktiv: boolean
  initiativeId: number
}

export type FahrzeugFormMode = 'create' | 'edit'

export interface FahrzeugFormData {
  kennzeichen: string
  bezeichnung: string
  kapazitaet: string
  kilometerstand: string
  betriebsaufnahme: string
  bemerkung: string
  status: string
}

export type FahrzeugFieldType = 'text' | 'date' | 'textarea' | 'number' | 'select'

export interface FahrzeugFieldConfig {
  name: keyof FahrzeugFormData
  label: string
  type: FahrzeugFieldType
  options?: Array<{ label: string; value: string }>
}
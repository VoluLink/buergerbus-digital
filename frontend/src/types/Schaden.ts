export interface Schaden {
  id: number
  fahrzeugId: number
  initiativeId: number
  beschreibung: string
  entstandenAm: string
  behobenAm: string | null
  status: string
}

export interface SchadenFormData {
  beschreibung: string
  entstandenAm: string
  behobenAm: string
  status: string
}

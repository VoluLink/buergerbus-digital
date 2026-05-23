export interface Wartung {
  id: number
  fahrzeugId: number
  initiativeId: number
  letzterTermin: string
  naechsterTermin: string | null
  grund: string | null
  ort: string
  kosten: number | null
}

export interface WartungFormData {
  letzterTermin: string
  naechsterTermin: string
  grund: string
  ort: string
  kosten: string
}

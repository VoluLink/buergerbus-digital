import type { Fahrt } from '../types/Fahrt'

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

if (!API_BASE_URL) {
  if (import.meta.env.DEV) {
    console.error('import.meta.env.VITE_API_BASE_URL:', import.meta.env.VITE_API_BASE_URL)
    console.error('import.meta.env:', import.meta.env)
  }
  throw new Error('VITE_API_BASE_URL ist nicht gesetzt.')
}

export interface FahrerKontakt {
  id: number
  name: string
  telefon: string
}

export const fahrerDaten: FahrerKontakt[] = [
  { id: 1, name: 'Max Mustermann', telefon: '0123456789' },
  { id: 2, name: 'Anna Schmidt', telefon: '0987654321' },
  { id: 3, name: 'Rolf Schmidt', telefon: '0987654321' },
]

export const fahrtenDaten: Fahrt[] = [
  { id: 1, datum: '2026-04-24', startort: 'Dorfmitte', zielort: 'Arztpraxis' },
  { id: 2, datum: '2026-04-25', startort: 'Bahnhof', zielort: 'Supermarkt' }
]

//hier kommen später echte API-Aufrufe hin, z.B. mit fetch oder axios, um die Daten von einem Backend zu holen
//jetzt werden die Daten direkt aus den Arrays geliefert, damit die App schon mal funktioniert
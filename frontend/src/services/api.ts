import type { Fahrer } from '../types/Fahrer'
import type { Fahrt } from '../types/Fahrt'

export const fahrerDaten: Fahrer[] = [
  { id: 1, name: 'Max Mustermann', telefon: '0123456789' },
  { id: 2, name: 'Anna Schmidt', telefon: '0987654321' },
  { id: 3, name: 'Rolf Schmidt', telefon: '0987654321' }
]

export const fahrtenDaten: Fahrt[] = [
  { id: 1, datum: '2026-04-24', startort: 'Dorfmitte', zielort: 'Arztpraxis' },
  { id: 2, datum: '2026-04-25', startort: 'Bahnhof', zielort: 'Supermarkt' }
]

//hier kommen später echte API-Aufrufe hin, z.B. mit fetch oder axios, um die Daten von einem Backend zu holen
//jetzt werden die Daten direkt aus den Arrays geliefert, damit die App schon mal funktioniert
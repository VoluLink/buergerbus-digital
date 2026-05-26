import type { Fahrer, FahrerFormData } from '../types/Fahrer'

// ── Mock-Daten (werden durch echte API-Calls ersetzt) ─────────────────────────
let mockDrivers: Fahrer[] = [
  {
    id: 1,
    vorname: 'Max',
    nachname: 'Mustermann',
    adresse: 'Musterstraße 1, 12345 Musterstadt',
    telefonnummer: '+49 30 12345678',
    fuehrerscheinklasse: 'B',
    letzteG25: '2023-06-15',
    naechsteG25: '2028-06-15',
    bemerkung: 'Fährt regelmäßig morgens.',
    angelegtAm: '2024-01-01',
    geaendertAm: null,
    aktiv: true,
    benutzerId: 1,
    initiativeId: 1,
    emailadresse: 'max.mustermann@example.de',
  },
]
let nextId = 2

// ── API-Funktionen ─────────────────────────────────────────────────────────────

export async function getAllFahrer(): Promise<Fahrer[]> {
  // TODO: return await fetch(BASE_URL).then(r => r.json()).then(dtos => dtos.map(mapDtoToFahrer))
  return [...mockDrivers]
}

export async function createFahrer(
  formData: FahrerFormData,
  _benutzerId = 1,
  _initiativeId = 1,
): Promise<Fahrer> {
  // TODO: const body = mapFahrerToDto(formData, benutzerId, initiativeId)
  //       return await fetch(BASE_URL, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(body) })
  //                .then(r => r.json()).then(mapDtoToFahrer)
  const newDriver: Fahrer = {
    id: nextId++,
    vorname: formData.vorname,
    nachname: formData.nachname,
    adresse: formData.adresse,
    telefonnummer: formData.telefonnummer || null,
    fuehrerscheinklasse: formData.fuehrerscheinklasse,
    letzteG25: formData.letzteG25,
    naechsteG25: formData.naechsteG25 || null,
    bemerkung: formData.bemerkung || null,
    aktiv: formData.aktiv,
    benutzerId: _benutzerId,
    initiativeId: _initiativeId,
    angelegtAm: new Date().toISOString(),
    geaendertAm: null,
    emailadresse: formData.emailadresse,
  }
  mockDrivers = [...mockDrivers, newDriver]
  return newDriver
}

export async function updateFahrer(
  id: number,
  formData: FahrerFormData,
  _benutzerId = 1,
  _initiativeId = 1,
): Promise<Fahrer> {
  // TODO: const body = mapFahrerToDto(formData, benutzerId, initiativeId)
  //       return await fetch(`${BASE_URL}/${id}`, { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify(body) })
  //                .then(r => r.json()).then(mapDtoToFahrer)
  mockDrivers = mockDrivers.map((driver) =>
    driver.id === id
      ? {
          ...driver,
          vorname: formData.vorname,
          nachname: formData.nachname,
          adresse: formData.adresse,
          telefonnummer: formData.telefonnummer || null,
          fuehrerscheinklasse: formData.fuehrerscheinklasse,
          letzteG25: formData.letzteG25,
          naechsteG25: formData.naechsteG25 || null,
          bemerkung: formData.bemerkung || null,
          aktiv: formData.aktiv,
          geaendertAm: new Date().toISOString(),
          emailadresse: formData.emailadresse,
          benutzerId: _benutzerId,
          initiativeId: _initiativeId,
        }
      : driver,
  )
  return mockDrivers.find((d) => d.id === id)!
}

export async function deleteFahrer(id: number): Promise<void> {
  // TODO: await fetch(`${BASE_URL}/${id}`, { method: 'DELETE' })
  mockDrivers = mockDrivers.filter((driver) => driver.id !== id)
}

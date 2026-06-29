import type { FahrgastUpsertRequest } from '../../services/fahrgastApi'
import {
  normalizeFahrgastFormData,
  normalizeFahrgastText,
  type Fahrgast,
  type FahrgastFormData,
} from '../../types/Fahrgast'

export function formatDateDisplay(value: string) {
  if (!value) {
    return '-'
  }

  const parsedDate = new Date(value)
  if (Number.isNaN(parsedDate.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('de-DE').format(parsedDate)
}

export function createFormFromGuest(guest: Fahrgast): FahrgastFormData {
  return normalizeFahrgastFormData(guest)
}

export function createEmptyForm(): FahrgastFormData {
  return {
    vorname: '',
    nachname: '',
    adresse: '',
    email: '',
    telefonnummer: '',
    bemerkung: '',
    letzteNutzung: '',
    aktiv: 'true',
    initiativeId: '',
  }
}

export function filterGuests(guests: Fahrgast[], searchQuery: string) {
  return guests
    .filter((entry) => entry.vorname !== 'Gelöschter' && entry.nachname !== 'Fahrgast')
    .filter((entry) => {
      const haystack =
        `${entry.vorname ?? ''} ${entry.nachname ?? ''} ${entry.adresse ?? ''} ${entry.telefonnummer ?? ''}`.toLowerCase()

      return haystack.includes((searchQuery ?? '').trim().toLowerCase())
    })
}

export function toFahrgastUpsertRequest(
  form: FahrgastFormData,
  options: { isAdmin: boolean },
): FahrgastUpsertRequest {
  const vorname = normalizeFahrgastText(form.vorname).trim()
  const nachname = normalizeFahrgastText(form.nachname).trim()
  const adresse = normalizeFahrgastText(form.adresse).trim()
  const email = normalizeFahrgastText(form.email).trim()
  const telefonnummer = normalizeFahrgastText(form.telefonnummer).trim()
  const bemerkung = normalizeFahrgastText(form.bemerkung).trim()
  const letzteNutzung = normalizeFahrgastText(form.letzteNutzung).trim()

  const payload: FahrgastUpsertRequest = {
    vorname,
    nachname,
    adresse,
    email: email || null,
    telefonnummer: telefonnummer || null,
    bemerkung: bemerkung || null,
    letzteNutzung: letzteNutzung ? `${letzteNutzung}T00:00:00Z` : null,
    aktiv: form.aktiv === 'true',
  }

  if (options.isAdmin) {
    const parsedInitiativeId = Number(form.initiativeId)
    if (!Number.isNaN(parsedInitiativeId)) {
      payload.initiativeId = parsedInitiativeId
    }
  }

  return payload
}

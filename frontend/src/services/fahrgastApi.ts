import { API_BASE_URL } from '../config/apiConfig'
import { apiFetch } from './httpClient'
import { mapDtoToFahrgast, type Fahrgast, type FahrgastBackendDto } from '../types/Fahrgast'

export type FahrgastUpsertRequest = {
  vorname: string
  nachname: string
  adresse: string
  email?: string | null
  telefonnummer?: string | null
  bemerkung?: string | null
  letzteNutzung?: string | null
  aktiv: boolean
  initiativeId?: number
}


function buildInitiativeQuery(initiativeId?: number | null) {
  return initiativeId ? `?initiativeId=${initiativeId}` : ''
}

export async function getFahrgaeste(initiativeId?: number | null): Promise<Fahrgast[]> {
  const response = await apiFetch(`${API_BASE_URL}/api/v1/passengers${buildInitiativeQuery(initiativeId)}`)

  if (!response.ok) {
    if (response.status === 403) {
      throw new Error('Keine Berechtigung.')
    }
    throw new Error('Fehler beim Laden der Fahrgäste')
  }

  const data = (await response.json()) as FahrgastBackendDto[]
  return data.map(mapDtoToFahrgast)
}

export async function createFahrgast(payload: FahrgastUpsertRequest): Promise<Fahrgast> {

  const response = await apiFetch(`${API_BASE_URL}/api/v1/passengers`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    if (response.status === 403) {
      throw new Error('Keine Berechtigung.')
    }
    const errorText = await response.text()
    throw new Error(errorText || 'Fehler beim Erstellen')
  }

  const data = (await response.json()) as FahrgastBackendDto
  return mapDtoToFahrgast(data)
}

export async function updateFahrgast(fahrgastId: number, payload: FahrgastUpsertRequest): Promise<Fahrgast> {

  const response = await apiFetch(`${API_BASE_URL}/api/v1/passengers/${fahrgastId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    if (response.status === 403) {
      throw new Error('Keine Berechtigung.')
    }
    const errorText = await response.text()
    throw new Error(errorText || 'Fehler beim Aktualisieren')
  }

  const data = (await response.json()) as FahrgastBackendDto
  return mapDtoToFahrgast(data)
}

export async function deletePassenger(fahrgastId: number): Promise<void> {
  const response = await apiFetch(`${API_BASE_URL}/api/v1/passengers/${fahrgastId}`, {
    method: 'DELETE',
  })

  if (!response.ok) {
    if (response.status === 403) {
      throw new Error('Keine Berechtigung.')
    }
    const errorText = await response.text()
    throw new Error(errorText || 'Fehler beim Löschen')
  }
}

export const deleteFahrgast = deletePassenger

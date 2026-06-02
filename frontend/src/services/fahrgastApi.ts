import { API_BASE_URL } from './api'
import { apiFetch } from './httpClient'
import type { Fahrgast } from '../types/Fahrgast'

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


export async function getFahrgaeste(): Promise<Fahrgast[]> {
  const response = await apiFetch(`${API_BASE_URL}/api/v1/fahrgaeste`)

  if (!response.ok) {
    if (response.status === 403) {
      throw new Error('Keine Berechtigung.')
    }
    throw new Error('Fehler beim Laden der Fahrgäste')
  }

  return response.json()
}

export async function createFahrgast(payload: FahrgastUpsertRequest): Promise<Fahrgast> {

  const response = await apiFetch(`${API_BASE_URL}/api/v1/fahrgaeste`, {
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

  return response.json()
}

export async function updateFahrgast(fahrgastId: number, payload: FahrgastUpsertRequest): Promise<Fahrgast> {

  const response = await apiFetch(`${API_BASE_URL}/api/v1/fahrgaeste/${fahrgastId}`, {
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

  return response.json()
}

export async function deleteFahrgast(fahrgastId: number): Promise<void> {
  const response = await apiFetch(`${API_BASE_URL}/api/v1/fahrgaeste/${fahrgastId}`, {
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

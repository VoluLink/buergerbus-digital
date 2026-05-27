import { API_BASE_URL } from './api'
import { apiFetch } from './httpClient'
import type { Fahrzeug } from '../types/Fahrzeug'

export type CreateFahrzeugRequest = {
  kennzeichen: string
  bezeichnung: string
  kapazitaet: number
  kilometerstand: number
  betriebsaufnahme: string
  initiativeId: number
  bemerkung?: string | null
  status?: string | null
}

export type UpdateFahrzeugRequest = CreateFahrzeugRequest

async function parseResponse<T>(response: Response, fallbackMessage: string): Promise<T> {
  if (!response.ok) {
    if (response.status === 403) {
      throw new Error('Keine Berechtigung.')
    }
    const errorText = await response.text()
    throw new Error(errorText || fallbackMessage)
  }

  return response.json()
}

function buildUserQuery(userId?: number) {
  return userId ? `?userId=${userId}` : ''
}

export async function getFahrzeuge(userId?: number): Promise<Fahrzeug[]> {
  const response = await apiFetch(`${API_BASE_URL}/api/v1/fahrzeuge${buildUserQuery(userId)}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  return parseResponse<Fahrzeug[]>(response, 'Fahrzeugdaten konnten nicht geladen werden.')
}

export async function createFahrzeug(
  userId: number | undefined,
  request: CreateFahrzeugRequest,
): Promise<Fahrzeug> {
  const response = await apiFetch(`${API_BASE_URL}/api/v1/fahrzeuge${buildUserQuery(userId)}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  })

  return parseResponse<Fahrzeug>(response, 'Das Fahrzeug konnte nicht gespeichert werden.')
}

export async function updateFahrzeug(
  vehicleId: number,
  userId: number | undefined,
  request: UpdateFahrzeugRequest,
): Promise<Fahrzeug> {
  const response = await apiFetch(
    `${API_BASE_URL}/api/v1/fahrzeuge/${vehicleId}${buildUserQuery(userId)}`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    },
  )

  return parseResponse<Fahrzeug>(response, 'Das Fahrzeug konnte nicht gespeichert werden.')
}

export async function deleteFahrzeug(vehicleId: number, userId?: number): Promise<void> {
  const response = await apiFetch(
    `${API_BASE_URL}/api/v1/fahrzeuge/${vehicleId}${buildUserQuery(userId)}`,
    {
      method: 'DELETE',
    },
  )

  if (!response.ok) {
    if (response.status === 403) {
      throw new Error('Keine Berechtigung.')
    }
    const errorText = await response.text()
    throw new Error(errorText || 'Das Fahrzeug konnte nicht geloescht werden.')
  }
}
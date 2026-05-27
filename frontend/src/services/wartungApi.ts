import { API_BASE_URL } from './api'
import { apiFetch } from './httpClient'
import type { Wartung } from '../types/Wartung'

export type CreateWartungRequest = {
  letzterTermin: string
  naechsterTermin?: string | null
  grund?: string | null
  ort: string
  kosten?: number | null
}

export type UpdateWartungRequest = CreateWartungRequest

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

export async function getWartungenByFahrzeug(
  fahrzeugId: number,
  userId: number,
): Promise<Wartung[]> {
  const response = await apiFetch(
    `${API_BASE_URL}/api/v1/fahrzeuge/${fahrzeugId}/wartungen?userId=${userId}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    },
  )

  return parseResponse<Wartung[]>(response, 'Wartungen konnten nicht geladen werden.')
}

export async function createWartung(
  fahrzeugId: number,
  userId: number,
  request: CreateWartungRequest,
): Promise<Wartung> {
  const response = await apiFetch(
    `${API_BASE_URL}/api/v1/fahrzeuge/${fahrzeugId}/wartungen?userId=${userId}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    },
  )

  return parseResponse<Wartung>(response, 'Wartung konnte nicht gespeichert werden.')
}

export async function updateWartung(
  wartungId: number,
  userId: number,
  request: UpdateWartungRequest,
): Promise<Wartung> {
  const response = await apiFetch(`${API_BASE_URL}/api/v1/wartungen/${wartungId}?userId=${userId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  })

  return parseResponse<Wartung>(response, 'Wartung konnte nicht aktualisiert werden.')
}

export async function deleteWartung(wartungId: number, userId: number): Promise<void> {
  const response = await apiFetch(`${API_BASE_URL}/api/v1/wartungen/${wartungId}?userId=${userId}`, {
    method: 'DELETE',
  })

  if (!response.ok) {
    if (response.status === 403) {
      throw new Error('Keine Berechtigung.')
    }
    const errorText = await response.text()
    throw new Error(errorText || 'Wartung konnte nicht geloescht werden.')
  }
}

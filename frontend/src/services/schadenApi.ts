import { API_BASE_URL } from '../config/apiConfig'
import { apiFetch } from './httpClient'
import type { Schaden } from '../types/Schaden'

export type CreateSchadenRequest = {
  beschreibung: string
  entstandenAm: string
  behobenAm?: string | null
  status: string
}

export type UpdateSchadenRequest = CreateSchadenRequest

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

export async function getSchaedenByFahrzeug(
  fahrzeugId: number,
  userId: number,
): Promise<Schaden[]> {
  const response = await apiFetch(
    `${API_BASE_URL}/api/v1/fahrzeuge/${fahrzeugId}/schaeden?userId=${userId}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    },
  )

  return parseResponse<Schaden[]>(response, 'Schaeden konnten nicht geladen werden.')
}

export async function createSchaden(
  fahrzeugId: number,
  userId: number,
  request: CreateSchadenRequest,
): Promise<Schaden> {
  const response = await apiFetch(
    `${API_BASE_URL}/api/v1/fahrzeuge/${fahrzeugId}/schaeden?userId=${userId}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    },
  )

  return parseResponse<Schaden>(response, 'Schaden konnte nicht gespeichert werden.')
}

export async function updateSchaden(
  schadenId: number,
  userId: number,
  request: UpdateSchadenRequest,
): Promise<Schaden> {
  const response = await apiFetch(`${API_BASE_URL}/api/v1/schaeden/${schadenId}?userId=${userId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  })

  return parseResponse<Schaden>(response, 'Schaden konnte nicht aktualisiert werden.')
}

export async function deleteSchaden(schadenId: number, userId: number): Promise<void> {
  const response = await apiFetch(`${API_BASE_URL}/api/v1/schaeden/${schadenId}?userId=${userId}`, {
    method: 'DELETE',
  })

  if (!response.ok) {
    if (response.status === 403) {
      throw new Error('Keine Berechtigung.')
    }
    const errorText = await response.text()
    throw new Error(errorText || 'Schaden konnte nicht geloescht werden.')
  }
}

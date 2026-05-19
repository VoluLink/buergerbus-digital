import { API_BASE_URL } from './api'
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
    const errorText = await response.text()
    throw new Error(errorText || fallbackMessage)
  }

  return response.json()
}

export async function getFahrzeuge(userId: number): Promise<Fahrzeug[]> {
  const response = await fetch(`${API_BASE_URL}/api/v1/fahrzeuge?userId=${userId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  return parseResponse<Fahrzeug[]>(response, 'Fahrzeugdaten konnten nicht geladen werden.')
}

export async function createFahrzeug(
  userId: number,
  request: CreateFahrzeugRequest,
): Promise<Fahrzeug> {
  const response = await fetch(`${API_BASE_URL}/api/v1/fahrzeuge?userId=${userId}`, {
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
  userId: number,
  request: UpdateFahrzeugRequest,
): Promise<Fahrzeug> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/fahrzeuge/${vehicleId}?userId=${userId}`,
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

export async function deleteFahrzeug(vehicleId: number, userId: number): Promise<void> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/fahrzeuge/${vehicleId}?userId=${userId}`,
    {
      method: 'DELETE',
    },
  )

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(errorText || 'Das Fahrzeug konnte nicht geloescht werden.')
  }
}
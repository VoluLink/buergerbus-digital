import { API_BASE_URL } from './api'
import type { CreateInitiativeRequest, Initiative, UpdateInitiativeRequest } from '../types/Initiative'

export async function getInitiativen(): Promise<Initiative[]> {
  const response = await fetch(`${API_BASE_URL}/api/v1/initiativen`)

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(errorText || 'Initiativen konnten nicht geladen werden.')
  }

  return response.json()
}

export async function createInitiative(request: CreateInitiativeRequest): Promise<Initiative> {
  const response = await fetch(`${API_BASE_URL}/api/v1/initiativen`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: request.name,
      beschreibung: request.beschreibung,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(errorText || 'Initiative konnte nicht erstellt werden.')
  }

  return response.json()
}

export async function updateInitiative(
  id: number,
  request: UpdateInitiativeRequest,
): Promise<Initiative> {
  const response = await fetch(`${API_BASE_URL}/api/v1/initiativen/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: request.name,
      beschreibung: request.beschreibung,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(errorText || 'Initiative konnte nicht aktualisiert werden.')
  }

  return response.json()
}

export async function deleteInitiative(id: number): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/v1/initiativen/${id}`, {
    method: 'DELETE',
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(errorText || 'Initiative konnte nicht gelöscht werden.')
  }
}

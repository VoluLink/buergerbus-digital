import { API_BASE_URL } from './api'
import { apiFetch } from './httpClient'
import type {
  CreateInitiativeRequest,
  Initiative,
  InitiativeDeletePreview,
  UpdateInitiativeRequest,
} from '../types/Initiative'

export async function getInitiativen(): Promise<Initiative[]> {
  const response = await apiFetch(`${API_BASE_URL}/api/v1/initiativen`)

  if (!response.ok) {
    if (response.status === 403) {
      throw new Error('Keine Berechtigung.')
    }
    const errorText = await response.text()
    throw new Error(errorText || 'Initiativen konnten nicht geladen werden.')
  }

  return response.json()
}

export async function createInitiative(request: CreateInitiativeRequest): Promise<Initiative> {
  const response = await apiFetch(`${API_BASE_URL}/api/v1/initiativen`, {
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
    if (response.status === 403) {
      throw new Error('Keine Berechtigung.')
    }
    const errorText = await response.text()
    throw new Error(errorText || 'Initiative konnte nicht erstellt werden.')
  }

  return response.json()
}

export async function updateInitiative(
  id: number,
  request: UpdateInitiativeRequest,
): Promise<Initiative> {
  const response = await apiFetch(`${API_BASE_URL}/api/v1/initiativen/${id}`, {
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
    if (response.status === 403) {
      throw new Error('Keine Berechtigung.')
    }
    const errorText = await response.text()
    throw new Error(errorText || 'Initiative konnte nicht aktualisiert werden.')
  }

  return response.json()
}

export async function deleteInitiative(id: number): Promise<void> {
  const response = await apiFetch(`${API_BASE_URL}/api/v1/initiativen/${id}`, {
    method: 'DELETE',
  })

  if (!response.ok) {
    if (response.status === 403) {
      throw new Error('Keine Berechtigung.')
    }
    const errorText = await response.text()
    throw new Error(errorText || 'Initiative konnte nicht gelöscht werden.')
  }
}

export async function getInitiativeDeletePreview(id: number): Promise<InitiativeDeletePreview> {
  const response = await apiFetch(`${API_BASE_URL}/api/v1/initiativen/${id}/delete-preview`)

  if (!response.ok) {
    if (response.status === 403) {
      throw new Error('Keine Berechtigung.')
    }
    const errorText = await response.text()
    throw new Error(errorText || 'Vorschau zum Löschen konnte nicht geladen werden.')
  }

  return response.json()
}

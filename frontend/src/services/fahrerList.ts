import { API_BASE_URL } from './api'
import { apiFetch } from './httpClient'
import type { FahrerListItem } from '../types/FahrerListItem'

export async function getAllFahrer(): Promise<FahrerListItem[]> {
  const response = await apiFetch(`${API_BASE_URL}/api/v1/fahrer`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    if (response.status === 403) {
      throw new Error('Keine Berechtigung.')
    }
    const errorText = await response.text()
    throw new Error(errorText || 'Fahrer konnten nicht geladen werden.')
  }

  return response.json()
}

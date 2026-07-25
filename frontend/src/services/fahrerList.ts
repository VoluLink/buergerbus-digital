import { API_BASE_URL } from '../config/apiConfig'
import { apiFetch } from './httpClient'
import type { FahrerListItem } from '../types/FahrerListItem'

export async function getAllFahrer(initiativeId?: number | null): Promise<FahrerListItem[]> {
  const query = initiativeId ? `?initiativeId=${initiativeId}` : ''
  const response = await apiFetch(`${API_BASE_URL}/api/v1/drivers${query}`, {
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

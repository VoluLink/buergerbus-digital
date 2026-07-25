import { API_BASE_URL } from '../config/apiConfig'
import { apiFetch } from './httpClient'

export type AddressSuggestion = { label: string }

export async function searchAddresses(query: string, signal: AbortSignal): Promise<AddressSuggestion[]> {
  const response = await apiFetch(`${API_BASE_URL}/api/v1/adressen?q=${encodeURIComponent(query)}`, { signal })

  if (!response.ok) {
    throw new Error('Adresssuche ist derzeit nicht verfügbar.')
  }

  return response.json() as Promise<AddressSuggestion[]>
}

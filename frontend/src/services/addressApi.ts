import { API_BASE_URL } from '../config/apiConfig'
import { apiFetch } from './httpClient'

export type AddressSuggestion = {
  displayName: string
  street: string | null
  houseNumber: string | null
  postalCode: string | null
  city: string | null
  latitude: number | null
  longitude: number | null
}

export async function searchAddresses(query: string, signal: AbortSignal): Promise<AddressSuggestion[]> {
  const response = await apiFetch(`${API_BASE_URL}/api/v1/adressen?q=${encodeURIComponent(query)}`, { signal })

  if (!response.ok) {
    if ([502, 503, 504].includes(response.status)) {
      throw new Error('Adresssuche momentan nicht erreichbar. Die Adresse kann weiterhin manuell eingegeben werden.')
    }

    throw new Error('Adresssuche konnte nicht durchgeführt werden.')
  }

  return response.json() as Promise<AddressSuggestion[]>
}

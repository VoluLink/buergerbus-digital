import { API_BASE_URL } from './api'
import type { FahrerMe } from '../types/FahrerMe'

const TOKEN_STORAGE_KEY = 'bb.auth.token'

export async function getMyFahrerInfo(): Promise<FahrerMe> {
  const token = localStorage.getItem(TOKEN_STORAGE_KEY)

  if (!token) {
    throw new Error('Nicht eingeloggt.')
  }

  const response = await fetch(`${API_BASE_URL}/api/v1/fahrer/me`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  })

  if (response.status === 401) {
    throw new Error('Bitte einloggen, um Fahrerinfos zu sehen.')
  }

  if (response.status === 403) {
    throw new Error('Keine Berechtigung: Nur Fahrer dürfen diese Seite öffnen.')
  }

  if (response.status === 404) {
    throw new Error('Kein Fahrerprofil vorhanden.')
  }

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(errorText || 'Fahrerprofil konnte nicht geladen werden.')
  }

  return response.json()
}

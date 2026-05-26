import { API_BASE_URL } from './api'

export async function createFahrt(data: any) {
  const res = await fetch(`${API_BASE_URL}/api/v1/fahrten`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(err || 'Fehler beim Erstellen der Fahrt')
  }

  return await res.json()
}

export async function updateFahrt(id: string, data: any) {
  return fetch(`${API_BASE_URL}/api/v1/fahrten/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
}
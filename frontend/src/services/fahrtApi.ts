import { API_BASE_URL } from './api'

/* =========================
   CREATE
========================= */

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

/* =========================
   GET ALL
========================= */

export async function getFahrten() {
  const res = await fetch(`${API_BASE_URL}/api/v1/fahrten`)

  if (!res.ok) {
    const err = await res.text()
    throw new Error(err || 'Fehler beim Laden der Fahrten')
  }

  return await res.json()
}

/* =========================
   GET BY ID
========================= */

export async function getFahrt(id: number) {
  const res = await fetch(`${API_BASE_URL}/api/v1/fahrten/${id}`)

  if (!res.ok) {
    const err = await res.text()
    throw new Error(err || 'Fehler beim Laden der Fahrt')
  }

  return await res.json()
}

/* =========================
   UPDATE
========================= */

export async function updateFahrt(id: number, data: any) {
  const res = await fetch(`${API_BASE_URL}/api/v1/fahrten/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(err || 'Fehler beim Aktualisieren der Fahrt')
  }

  return await res.json()
}

/* =========================
   DELETE
========================= */

export async function deleteFahrt(id: number) {
  const res = await fetch(`${API_BASE_URL}/api/v1/fahrten/${id}`, {
    method: 'DELETE',
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(err || 'Fehler beim Löschen der Fahrt')
  }

  return true
}
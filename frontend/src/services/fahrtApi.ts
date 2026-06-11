import { API_BASE_URL } from './api'
import { apiFetch } from './httpClient'

/* =========================
   CREATE
========================= */

function buildInitiativeQuery(initiativeId?: number | null) {
  return initiativeId ? `?initiativeId=${initiativeId}` : ''
}

export async function createFahrt(data: any) {
  const res = await apiFetch(`${API_BASE_URL}/api/v1/fahrten`, {
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

export async function getFahrten(initiativeId?: number | null) {
  const res = await apiFetch(`${API_BASE_URL}/api/v1/fahrten${buildInitiativeQuery(initiativeId)}`)

  if (!res.ok) {
    const err = await res.text()
    throw new Error(err || 'Fehler beim Laden der Fahrten')
  }

  return await res.json()
}

/* =========================
   GET BY IDs
========================= */

export async function getFahrt(id: number) {
  const res = await apiFetch(`${API_BASE_URL}/api/v1/fahrten/${id}`)

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
  const res = await apiFetch(`${API_BASE_URL}/api/v1/fahrten/${id}`, {
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
  const res = await apiFetch(`${API_BASE_URL}/api/v1/fahrten/${id}`, {
    method: 'DELETE',
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(err || 'Fehler beim Löschen der Fahrt')
  }

  return true
}

export async function updateFahrtteilnehmerAbgehakt(id: number, istAbgehakt: boolean) {
  const res = await apiFetch(`${API_BASE_URL}/api/v1/fahrtteilnehmer/${id}/abgehakt`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ istAbgehakt }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(err || 'Fehler beim Speichern des Checkstatus')
  }

  return await res.json()
}

export async function meldeFahrerAn(fahrtId: number) {
  const res = await apiFetch(`${API_BASE_URL}/api/v1/fahrten/${fahrtId}/fahrer/anmelden`, {
    method: 'PATCH',
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(err || 'Fehler beim Anmelden als Fahrer')
  }

  return await res.json()
}

export async function meldeFahrerAb(fahrtId: number) {
  const res = await apiFetch(`${API_BASE_URL}/api/v1/fahrten/${fahrtId}/fahrer/abmelden`, {
    method: 'PATCH',
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(err || 'Fehler beim Abmelden als Fahrer')
  }

  return await res.json()
}

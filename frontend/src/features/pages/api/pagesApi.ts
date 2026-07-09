import { API_BASE_URL } from '../../../config/apiConfig'
import { apiFetch } from '../../../services/httpClient'
import type { AdminPage, CreatePageRequest, PublicPage, UpdatePageRequest } from '../types'

async function readErrorMessage(response: Response, fallback: string) {
  const errorText = await response.text()
  return errorText || fallback
}

export async function getPublicPage(slug: string): Promise<PublicPage | null> {
  const response = await apiFetch(`${API_BASE_URL}/api/v1/public/pages/${encodeURIComponent(slug)}`, {
    auth: false,
  })

  if (response.status === 404) {
    return null
  }

  if (!response.ok) {
    throw new Error(await readErrorMessage(response, 'Seite konnte nicht geladen werden.'))
  }

  return response.json()
}

export async function getAdminPages(): Promise<AdminPage[]> {
  const response = await apiFetch(`${API_BASE_URL}/api/v1/admin/pages`)

  if (!response.ok) {
    throw new Error(await readErrorMessage(response, 'Seiten konnten nicht geladen werden.'))
  }

  const data = await response.json() as { pages: AdminPage[] }
  return data.pages ?? []
}

export async function getAdminPage(id: string): Promise<AdminPage> {
  const response = await apiFetch(`${API_BASE_URL}/api/v1/admin/pages/${id}`)

  if (!response.ok) {
    throw new Error(await readErrorMessage(response, 'Seite konnte nicht geladen werden.'))
  }

  return response.json()
}

export async function createPage(request: CreatePageRequest): Promise<AdminPage> {
  const response = await apiFetch(`${API_BASE_URL}/api/v1/admin/pages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  })

  if (!response.ok) {
    throw new Error(await readErrorMessage(response, 'Seite konnte nicht erstellt werden.'))
  }

  return response.json()
}

export async function updatePage(id: string, request: UpdatePageRequest): Promise<AdminPage> {
  const response = await apiFetch(`${API_BASE_URL}/api/v1/admin/pages/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  })

  if (!response.ok) {
    throw new Error(await readErrorMessage(response, 'Seite konnte nicht aktualisiert werden.'))
  }

  return response.json()
}

export async function deletePage(id: string): Promise<void> {
  const response = await apiFetch(`${API_BASE_URL}/api/v1/admin/pages/${id}`, {
    method: 'DELETE',
  })

  if (!response.ok) {
    throw new Error(await readErrorMessage(response, 'Seite konnte nicht gelöscht werden.'))
  }
}
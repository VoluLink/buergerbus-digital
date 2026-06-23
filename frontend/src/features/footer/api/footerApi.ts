import { API_BASE_URL } from '../../../services/api'
import { apiFetch } from '../../../services/httpClient'
import type { AdminFooterLink, CreateFooterLinkRequest, PublicFooterResponse, UpdateFooterLinkRequest } from '../types'

async function readErrorMessage(response: Response, fallback: string) {
  const errorText = await response.text()
  return errorText || fallback
}

export async function getPublicFooter(): Promise<PublicFooterResponse> {
  const response = await apiFetch(`${API_BASE_URL}/api/v1/public/footer`, {
    auth: false,
  })

  if (!response.ok) {
    throw new Error(await readErrorMessage(response, 'Footer konnte nicht geladen werden.'))
  }

  return response.json()
}

export async function getAdminFooterLinks(): Promise<AdminFooterLink[]> {
  const response = await apiFetch(`${API_BASE_URL}/api/v1/admin/footer-links`)

  if (!response.ok) {
    throw new Error(await readErrorMessage(response, 'Footer-Links konnten nicht geladen werden.'))
  }

  const data = await response.json() as { links: AdminFooterLink[] }
  return data.links ?? []
}

export async function getAdminFooterLink(id: string): Promise<AdminFooterLink> {
  const response = await apiFetch(`${API_BASE_URL}/api/v1/admin/footer-links/${id}`)

  if (!response.ok) {
    throw new Error(await readErrorMessage(response, 'Footer-Link konnte nicht geladen werden.'))
  }

  return response.json()
}

export async function createFooterLink(request: CreateFooterLinkRequest): Promise<AdminFooterLink> {
  const response = await apiFetch(`${API_BASE_URL}/api/v1/admin/footer-links`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  })

  if (!response.ok) {
    throw new Error(await readErrorMessage(response, 'Footer-Link konnte nicht erstellt werden.'))
  }

  return response.json()
}

export async function updateFooterLink(id: string, request: UpdateFooterLinkRequest): Promise<AdminFooterLink> {
  const response = await apiFetch(`${API_BASE_URL}/api/v1/admin/footer-links/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  })

  if (!response.ok) {
    throw new Error(await readErrorMessage(response, 'Footer-Link konnte nicht aktualisiert werden.'))
  }

  return response.json()
}

export async function deleteFooterLink(id: string): Promise<void> {
  const response = await apiFetch(`${API_BASE_URL}/api/v1/admin/footer-links/${id}`, {
    method: 'DELETE',
  })

  if (!response.ok) {
    throw new Error(await readErrorMessage(response, 'Footer-Link konnte nicht gelöscht werden.'))
  }
}
import { API_BASE_URL } from './api'
import { apiFetch } from './httpClient'
import type { InitiativeSummary, RoleSummary, UserProfile, UserSummary } from '../types/UserProfile'

export interface PagedUsersResponse {
  items: UserSummary[]
  page: number
  pageSize: number
  totalItems: number
  totalPages: number
}

export async function getUsers(
  page = 1,
  pageSize = 25,
  search = '',
): Promise<PagedUsersResponse> {
  const params = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
  })

  if (search.trim()) {
    params.set('search', search.trim())
  }

  const response = await apiFetch(`${API_BASE_URL}/api/v1/users?${params.toString()}`, {
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
    throw new Error(errorText || 'Benutzer konnten nicht geladen werden.')
  }

  return response.json()
}

export async function fetchInitiatives(): Promise<InitiativeSummary[]> {
  const response = await apiFetch(`${API_BASE_URL}/api/v1/initiatives`, {
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
    throw new Error(errorText || 'Initiativen konnten nicht geladen werden.')
  }

  return response.json()
}

export async function fetchRoles(): Promise<RoleSummary[]> {
  const response = await apiFetch(`${API_BASE_URL}/api/v1/roles`, {
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
    throw new Error(errorText || 'Rollen konnten nicht geladen werden.')
  }

  return response.json()
}

export async function fetchUserProfile(userId: number): Promise<UserProfile> {
  const response = await apiFetch(`${API_BASE_URL}/api/v1/users/${userId}/profile`, {
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
    throw new Error(errorText || 'Profil konnte nicht geladen werden.')
  }

  return response.json()
}

export async function updateUserRoles(
  userId: number,
  roles: string[],
  activeRole?: string | null,
): Promise<{ roles: string[]; activeRole?: string | null; newToken?: string | null }> {
  const response = await apiFetch(`${API_BASE_URL}/api/v1/users/${userId}/roles`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ roles, activeRole }),
  })

  if (!response.ok) {
    if (response.status === 403) {
      throw new Error('Keine Berechtigung.')
    }
    const errorText = await response.text()
    throw new Error(errorText || 'Rollen konnten nicht gespeichert werden.')
  }

  const data = await response.json() as { roles: string[]; activeRole?: string | null; newToken?: string | null }
  return data
}

export async function updateUserInitiative(userId: number, initiativeId: number): Promise<InitiativeSummary> {
  const response = await apiFetch(`${API_BASE_URL}/api/v1/users/${userId}/initiative`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ initiativeId }),
  })

  if (!response.ok) {
    if (response.status === 403) {
      throw new Error('Keine Berechtigung.')
    }
    const errorText = await response.text()
    throw new Error(errorText || 'Initiative konnte nicht gespeichert werden.')
  }

  return response.json()
}

export interface CreateBenutzerRequest {
  name: string
  email: string
  password: string
  roleId: number
  initiativeId: number
}

export async function createBenutzer(payload: CreateBenutzerRequest): Promise<UserProfile> {
  const response = await apiFetch(`${API_BASE_URL}/api/v1/benutzer`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    if (response.status === 403) {
      throw new Error('Keine Berechtigung.')
    }
    const errorText = await response.text()
    throw new Error(errorText || 'Benutzer konnte nicht angelegt werden.')
  }

  return response.json()
}

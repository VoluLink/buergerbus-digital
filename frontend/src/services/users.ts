import { API_BASE_URL } from './api'
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

  const response = await fetch(`${API_BASE_URL}/api/v1/users?${params.toString()}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(errorText || 'Benutzer konnten nicht geladen werden.')
  }

  return response.json()
}

export async function fetchInitiatives(): Promise<InitiativeSummary[]> {
  const response = await fetch(`${API_BASE_URL}/api/v1/initiatives`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(errorText || 'Initiativen konnten nicht geladen werden.')
  }

  return response.json()
}

export async function fetchRoles(): Promise<RoleSummary[]> {
  const response = await fetch(`${API_BASE_URL}/api/v1/roles`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(errorText || 'Rollen konnten nicht geladen werden.')
  }

  return response.json()
}

export async function fetchUserProfile(userId: number): Promise<UserProfile> {
  const response = await fetch(`${API_BASE_URL}/api/v1/users/${userId}/profile`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(errorText || 'Profil konnte nicht geladen werden.')
  }

  return response.json()
}

export async function updateUserRoles(userId: number, roles: string[]): Promise<string[]> {
  const response = await fetch(`${API_BASE_URL}/api/v1/users/${userId}/roles`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ roles }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(errorText || 'Rollen konnten nicht gespeichert werden.')
  }

  const data = await response.json() as { roles: string[] }
  return data.roles
}

export async function updateUserInitiative(userId: number, initiativeId: number): Promise<InitiativeSummary> {
  const response = await fetch(`${API_BASE_URL}/api/v1/users/${userId}/initiative`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ initiativeId }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(errorText || 'Initiative konnte nicht gespeichert werden.')
  }

  return response.json()
}

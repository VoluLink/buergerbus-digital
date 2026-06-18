import { API_BASE_URL } from './api'
import { apiFetch } from './httpClient'
import type { UserProfile } from '../types/UserProfile'

export type ChangePasswordRequest = {
  currentPassword: string
  newPassword: string
}

export type ChangePasswordResponse = {
  message: string
}

type UpdateFahrerProfileRequest = {
  bemerkung?: string | null
  aktiv: boolean
}

type UpdateUserProfileRequest = {
  username: string
  vorname?: string | null
  nachname?: string | null
  strasse?: string | null
  postleitzahl?: string | null
  ort?: string | null
  telefonnummer?: string | null
  fuehrerscheinklasse?: string | null
  letzteG25?: string | null
  naechsteG25?: string | null
  bemerkung?: string | null
  aktiv: boolean
  fahrer?: UpdateFahrerProfileRequest | null
}

export async function getCurrentUserProfile(): Promise<UserProfile> {
  const response = await apiFetch(`${API_BASE_URL}/api/v1/users/me`, {
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

export async function getUserProfileById(userId: number): Promise<UserProfile> {
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

export async function updateUserProfile(userId: number, request: UpdateUserProfileRequest): Promise<UserProfile> {
  const response = await apiFetch(`${API_BASE_URL}/api/v1/users/${userId}/profile`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  })

  if (!response.ok) {
      if (response.status === 403) {
        throw new Error('Keine Berechtigung.')
      }
    const errorText = await response.text()
    throw new Error(errorText || 'Profil konnte nicht gespeichert werden.')
  }

  return response.json()
}

export async function deleteUserProfile(userId: number): Promise<void> {
  const response = await apiFetch(`${API_BASE_URL}/api/v1/users/${userId}/profile`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    if (response.status === 403) {
      throw new Error('Keine Berechtigung.')
    }
    const errorText = await response.text()
    throw new Error(errorText || 'Profil konnte nicht gelöscht werden.')
  }
}

export async function changePassword(request: ChangePasswordRequest): Promise<ChangePasswordResponse> {
  const response = await apiFetch(`${API_BASE_URL}/api/v1/auth/change-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  })

  if (!response.ok) {
    if (response.status === 403) {
      throw new Error('Keine Berechtigung.')
    }

    const errorText = await response.text()
    throw new Error(errorText || 'Passwort konnte nicht geändert werden.')
  }

  return response.json()
}
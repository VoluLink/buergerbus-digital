import { API_BASE_URL } from './api'
import type { UserProfile } from '../types/UserProfile'

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

export async function getCurrentUserProfile(userId: number): Promise<UserProfile> {
  const response = await fetch(`${API_BASE_URL}/api/v1/users/me?userId=${userId}`, {
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

export async function getUserProfileById(userId: number): Promise<UserProfile> {
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

export async function updateUserProfile(userId: number, request: UpdateUserProfileRequest): Promise<UserProfile> {
  const response = await fetch(`${API_BASE_URL}/api/v1/users/${userId}/profile`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(errorText || 'Profil konnte nicht gespeichert werden.')
  }

  return response.json()
}
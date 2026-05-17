import { API_BASE_URL } from './api'
import type { UserProfile } from '../types/UserProfile'

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
import { API_BASE_URL } from './api'
import { apiFetch } from './httpClient'
import type { LoginCredentials, LoginResponse, RefreshTokenResponse } from '../types/Login'

export async function login(
  credentials: LoginCredentials,
): Promise<LoginResponse> {
  const response = await apiFetch(`${API_BASE_URL}/api/v1/auth/login`, {
    method: 'POST',
    auth: false,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(credentials),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(errorText || 'Login fehlgeschlagen.')
  }

  return response.json()
}

export async function refreshToken(): Promise<RefreshTokenResponse> {
  const response = await apiFetch(`${API_BASE_URL}/api/v1/auth/refresh`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(errorText || 'Token konnte nicht erneuert werden.')
  }

  return response.json()
}
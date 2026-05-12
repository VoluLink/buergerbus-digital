import { API_BASE_URL } from './api'
import type { LoginCredentials, LoginResponse } from '../types/Login'

export async function login(
  credentials: LoginCredentials,
): Promise<LoginResponse> {
  const response = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
    method: 'POST',
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
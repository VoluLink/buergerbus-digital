import { API_BASE_URL } from '../config/apiConfig'
import { apiFetch } from './httpClient'
import type { ForgotPasswordRequest, PasswordResetResponse, ResetPasswordRequest } from '../types/PasswordReset'

export async function requestPasswordReset(
  body: ForgotPasswordRequest,
): Promise<PasswordResetResponse> {
  const response = await apiFetch(`${API_BASE_URL}/api/v1/auth/forgot-password`, {
    method: 'POST',
    auth: false,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(errorText || 'Passwort-Zurücksetzung konnte nicht angefordert werden.')
  }

  return response.json()
}

export async function resetPassword(
  body: ResetPasswordRequest,
): Promise<PasswordResetResponse> {
  const response = await apiFetch(`${API_BASE_URL}/api/v1/auth/reset-password`, {
    method: 'POST',
    auth: false,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(errorText || 'Passwort konnte nicht zurückgesetzt werden.')
  }

  return response.json()
}

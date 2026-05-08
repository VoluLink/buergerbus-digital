import type { LoginCredentials, LoginResponse } from '../types/Login'

function wait(durationMs: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, durationMs)
  })
}

export async function loginWithMockService(
  credentials: LoginCredentials,
): Promise<LoginResponse> {
  await wait(350)

  return {
    success: true,
    message: 'Demo-Login erfolgreich. Die Backend-Anbindung folgt später.',
    email: credentials.email,
  }
}
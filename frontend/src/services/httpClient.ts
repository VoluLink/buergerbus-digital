const TOKEN_STORAGE_KEY = 'bb.auth.token'
const USER_ID_STORAGE_KEY = 'bb.auth.userId'

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_STORAGE_KEY)
}

export function setStoredToken(token: string) {
  localStorage.setItem(TOKEN_STORAGE_KEY, token)
}

export function clearStoredAuth() {
  localStorage.removeItem(TOKEN_STORAGE_KEY)
  localStorage.removeItem(USER_ID_STORAGE_KEY)
}

export async function apiFetch(
  input: RequestInfo | URL,
  init: RequestInit & { auth?: boolean } = {},
): Promise<Response> {
  const authEnabled = init.auth !== false
  const token = authEnabled ? getStoredToken() : null

  const headers = new Headers(init.headers)

  if (authEnabled && token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const response = await fetch(input, {
    ...init,
    headers,
  })

  if (response.status === 401 && authEnabled) {
    clearStoredAuth()
    window.dispatchEvent(new Event('bb:auth:unauthorized'))
  }

  return response
}

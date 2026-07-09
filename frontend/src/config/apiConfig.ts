export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

if (!API_BASE_URL) {
  if (import.meta.env.DEV) {
    console.error('VITE_API_BASE_URL is not set')
  }
  throw new Error('VITE_API_BASE_URL ist nicht gesetzt.')
}

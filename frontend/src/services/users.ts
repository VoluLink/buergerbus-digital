import { API_BASE_URL } from './api'

type UserRole = 'Admin' | 'Disponend' | 'Fahrer'

export interface User {
  id: string
  username: string
  email: string
  fahrerId: string
  location: string
  roles: UserRole[]
  status: 'Aktiv' | 'Inaktiv'
}

// Hole alle Nutzer vom Backend
export async function fetchUsers(): Promise<User[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/users`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    return await response.json()
  } catch {
    // Fallback auf Mock-Daten wenn Backend nicht verfügbar
    console.warn('Backend nicht verfügbar, verwende Mock-Daten')
    return [
      {
        id: 'U-001',
        username: 'Max Mustermann',
        email: 'max.mustermann@firma.de',
        fahrerId: '-',
        location: 'Berlin',
        roles: ['Admin', 'Disponend'],
        status: 'Aktiv',
      },
    ]
  }
}

// Update User Rollen
export async function updateUserRoles(userId: string, roles: UserRole[]): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/users/${userId}/roles`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ roles }),
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
  } catch {
    console.error('Fehler beim Aktualisieren der Rollen')
  }
}

// Update User Status
export async function updateUserStatus(userId: string, status: 'Aktiv' | 'Inaktiv'): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/users/${userId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status }),
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
  } catch {
    console.error('Fehler beim Aktualisieren des Status')
  }
}

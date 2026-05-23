import { API_BASE_URL } from './api'
import type { Fahrgast, FahrgastBackendDto } from '../types/Fahrgast'
import { mapDtoToFahrgast, mapFahrgastToDto } from '../types/Fahrgast'

const fahrgastSpeicher: FahrgastBackendDto[] = [
  {
    Id: 1,
    Vorname: 'Max',
    Nachname: 'Mustermann',
    Adresse: 'Hauptstraße 1, 10115 Berlin',
    Email: 'max.mustermann@example.de',
    Telefonnummer: '+49 30 12345678',
    Bemerkung: 'VIP Gast',
    AngelegtAm: '2026-05-01T10:00:00Z',
    GeaendertAm: null,
    LetzteNutzung: '2026-05-15T08:30:00Z',
    Aktiv: true,
    InitiativeId: 1,
  },
]

function cloneDto(dto: FahrgastBackendDto): FahrgastBackendDto {
  return { ...dto }
}

export async function getFahrgaeste(): Promise<Fahrgast[]> {
  return fahrgastSpeicher.map(cloneDto).map(mapDtoToFahrgast)
}

export async function createFahrgast(fahrgast: Fahrgast): Promise<Fahrgast> {
  const dto = mapFahrgastToDto(fahrgast)

  const response = await fetch(`${API_BASE_URL}/api/v1/fahrgaeste`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(dto),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(errorText || 'Fehler beim Erstellen')
  }

  return response.json()
}

export async function updateFahrgast(fahrgastId: number, fahrgast: Fahrgast): Promise<Fahrgast> {
  const dto = mapFahrgastToDto(fahrgast)
  const index = fahrgastSpeicher.findIndex((entry) => entry.Id === fahrgastId)

  if (index !== -1) {
    fahrgastSpeicher[index] = cloneDto(dto)
  }

  return mapDtoToFahrgast(dto)
}

export async function deleteFahrgast(fahrgastId: number): Promise<void> {
  const index = fahrgastSpeicher.findIndex((entry) => entry.Id === fahrgastId)
  if (index !== -1) {
    fahrgastSpeicher.splice(index, 1)
  }
}

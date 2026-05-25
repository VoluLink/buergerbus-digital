import { API_BASE_URL } from './api'
import type { CalendarRide, PassengerForm, RideStatus, RideType } from '../types/DashboardRide'

type DashboardStateSnapshot = {
  rides: CalendarRide[]
  completedPassengerKeys: string[]
  nextRideId: number
}

type BackendFahrgastDto = {
  id: number
  vorname: string
  nachname: string
  telefonnummer?: string | null
}

type BackendTeilstreckeDto = {
  id: number
  abholadresse: string
  zieladresse: string
  startzeit?: string | null
  status?: string | null
  fahrgastId: number
  fahrgast?: BackendFahrgastDto | null
}

type BackendFahrtDto = {
  id: number
  titel: string
  datum: string
  fahrttyp: string
  startzeit: string
  endzeit?: string | null
  bemerkung?: string | null
  status: string
  teilstrecken?: BackendTeilstreckeDto[] | null
}

type BackendFahrtWriteDto = {
  titel: string
  datum: string
  zielort: string
  fahrttyp: string
  startzeit: string
  endzeit: string | null
  bemerkung: string | null
  status: string
  initiativeId: number
  teilstrecken: Array<{
    abholadresse: string
    zieladresse: string
    startzeit: string | null
    status: string | null
    fahrgastId: number | null
  }>
}

const DASHBOARD_STORAGE_KEY = 'bb.dashboard.state.v1'

function extractHourMinute(value?: string | null) {
  if (!value) return ''
  const match = value.match(/(\d{2}:\d{2})/)
  return match ? match[1] : ''
}

function mapBackendTypeToRideType(fahrttyp: string): RideType {
  const normalized = fahrttyp.trim().toLowerCase()

  if (normalized.includes('theme')) return 'theme'
  if (normalized.includes('vermiet')) return 'rental'
  return 'standard'
}

function mapBackendStatusToRideStatus(status: string, type: RideType): RideStatus {
  const normalized = status.trim().toLowerCase()

  if (normalized.includes('abgeschlossen') || normalized.includes('completed')) return 'completed'
  if (normalized.includes('zugewiesen') || normalized.includes('assigned')) return 'assigned'
  if (normalized.includes('gespeichert') || normalized.includes('saved')) return 'saved'

  if (type === 'theme') return 'theme'
  if (type === 'rental') return 'rental'

  return 'open'
}

function mapRideStatusToBackendStatus(status: RideStatus): string {
  const mapping: Record<RideStatus, string> = {
    open: 'Offen',
    assigned: 'Zugewiesen',
    completed: 'Abgeschlossen',
    theme: 'Themenfahrt',
    rental: 'Vermietung',
    saved: 'Gespeichert',
  }

  return mapping[status]
}

function mapTeilstreckenToPassengers(teilstrecken?: BackendTeilstreckeDto[] | null): PassengerForm[] {
  if (!teilstrecken) return []

  return teilstrecken.map((item, index) => ({
    id: index + 1,
    sourceGuestId: item.fahrgastId > 0 ? item.fahrgastId : null,
    name: item.fahrgast
      ? `${item.fahrgast.vorname} ${item.fahrgast.nachname}`.trim()
      : `Fahrgast ${index + 1}`,
    phone: item.fahrgast?.telefonnummer ?? '',
    pickupAddress: item.abholadresse,
    destinationAddress: item.zieladresse,
    time: extractHourMinute(item.startzeit),
  }))
}

function mapBackendRideToCalendarRide(dto: BackendFahrtDto): CalendarRide {
  const type = mapBackendTypeToRideType(dto.fahrttyp)

  return {
    id: dto.id,
    date: new Date(dto.datum),
    type,
    status: mapBackendStatusToRideStatus(dto.status, type),
    title: dto.titel,
    time: extractHourMinute(dto.startzeit),
    driverName: '',
    passengers: mapTeilstreckenToPassengers(dto.teilstrecken),
    remarks: dto.bemerkung ?? '',
  }
}

function mapCalendarRideToBackendWriteDto(ride: CalendarRide): BackendFahrtWriteDto {
  const firstPassenger = ride.passengers[0]

  return {
    titel: ride.title,
    datum: ride.date.toISOString(),
    zielort: firstPassenger?.destinationAddress || '',
    fahrttyp: ride.type,
    startzeit: ride.time,
    endzeit: null,
    bemerkung: ride.remarks || null,
    status: mapRideStatusToBackendStatus(ride.status),
    initiativeId: 1,
    teilstrecken: ride.passengers.map((p) => ({
      abholadresse: p.pickupAddress,
      zieladresse: p.destinationAddress,
      startzeit: p.time || null,
      status: null,
      fahrgastId: p.sourceGuestId ?? null,
    })),
  }
}

function parseStoredState(raw: string | null): DashboardStateSnapshot {
  if (!raw) {
    return { rides: [], completedPassengerKeys: [], nextRideId: 1 }
  }

  try {
    const parsed = JSON.parse(raw)
    return {
      rides: (parsed.rides ?? []).map((r: any) => ({
        ...r,
        date: new Date(r.date),
      })),
      completedPassengerKeys: parsed.completedPassengerKeys ?? [],
      nextRideId: parsed.nextRideId ?? 1,
    }
  } catch {
    return { rides: [], completedPassengerKeys: [], nextRideId: 1 }
  }
}

function serializeState(state: DashboardStateSnapshot) {
  return JSON.stringify({
    ...state,
    rides: state.rides.map((r) => ({
      ...r,
      date: r.date.toISOString(),
    })),
  })
}

/* =========================
   BACKEND API
========================= */

async function tryLoadFromBackend(): Promise<CalendarRide[] | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/fahrten`)
    if (!res.ok) return null

    const data: BackendFahrtDto[] = await res.json()
    return data.map(mapBackendRideToCalendarRide)
  } catch {
    return null
  }
}

async function trySaveToBackend(rides: CalendarRide[]) {
  try {
    for (const ride of rides) {
      await fetch(`${API_BASE_URL}/api/v1/fahrten`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mapCalendarRideToBackendWriteDto(ride)),
      })
    }
  } catch {
    // ignore
  }
}

/* =========================
   PUBLIC API (FRONTEND)
========================= */

export async function loadDashboardState(): Promise<DashboardStateSnapshot> {
  const local = parseStoredState(localStorage.getItem(DASHBOARD_STORAGE_KEY))
  const backend = await tryLoadFromBackend()

  if (!backend) return local

  return {
    rides: backend,
    completedPassengerKeys: local.completedPassengerKeys,
    nextRideId: backend.reduce((m, r) => Math.max(m, r.id), 0) + 1,
  }
}

export async function saveDashboardState(state: DashboardStateSnapshot): Promise<void> {
  localStorage.setItem(DASHBOARD_STORAGE_KEY, serializeState(state))
  await trySaveToBackend(state.rides)
}
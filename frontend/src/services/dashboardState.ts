import { API_BASE_URL } from './api'
import { apiFetch } from './httpClient'
import type { CalendarRide, PassengerForm, RideStatus, RideType } from '../types/DashboardRide'
import type { FahrerListItem } from '../types/FahrerListItem'

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
  fahrtTeilnehmerId: number
  abholadresse: string
  zieladresse: string
  startzeit?: string | null
  status?: string | null
  fahrgastId?: number | null
  fahrgast?: BackendFahrgastDto | null
}

type BackendFahrtTeilnehmerDto = {
  id: number
  fahrtId: number
  fahrgastId?: number | null
  vorname: string
  nachname: string
  adresse?: string | null
  telefonnummer?: string | null
  istAbgehakt: boolean
  abgehaktAm?: string | null
  istTemporaer: boolean
  alsStammgastGespeichert: boolean
  teilstrecken?: BackendTeilstreckeDto[] | null
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
  fahrerId?: number | null
  fahrzeugId?: number | null
  teilnehmer?: BackendFahrtTeilnehmerDto[] | null
}

type BackendFahrtWriteDto = {
  fahrt: {
    titel: string
    datum: string
    zielort: string
    fahrttyp: string
    startzeit: string
    endzeit: string | null
    bemerkung: string | null
    status: string
    fahrerId: number | null
    fahrzeugId: number | null
    initiativeId: number | null
  }
  teilnehmer: Array<{
    fahrgastId: number | null
    vorname: string
    nachname: string
    adresse: string | null
    telefonnummer: string | null
    alsStammgastSpeichern: boolean
    abholadresse: string
    zieladresse: string
    startzeit: string | null
    endzeit: string | null
    reihenfolge: number | null
    status: string | null
  }>
}

const DASHBOARD_STORAGE_KEY = 'bb.dashboard.state.v1'

function safeText(value?: string | null) {
  return value ?? ''
}

function extractHourMinute(value?: string | null) {
  if (!value) return ''
  const match = value.match(/(\d{2}:\d{2})/)
  return match ? match[1] : ''
}

function mapBackendTypeToRideType(fahrttyp: string): RideType {
  const normalized = safeText(fahrttyp).trim().toLowerCase()

  if (normalized.includes('theme')) return 'theme'
  if (normalized.includes('vermiet')) return 'rental'
  return 'standard'
}

function mapBackendStatusToRideStatus(status: string, type: RideType): RideStatus {
  const normalized = safeText(status).trim().toLowerCase()

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
      ? `${safeText(item.fahrgast.vorname)} ${safeText(item.fahrgast.nachname)}`.trim()
      : `Fahrgast ${index + 1}`,
    phone: safeText(item.fahrgast?.telefonnummer),
    pickupAddress: safeText(item.abholadresse),
    destinationAddress: safeText(item.zieladresse),
    time: extractHourMinute(item.startzeit),
  }))
}

function mapTeilnehmerToPassengers(teilnehmer?: BackendFahrtTeilnehmerDto[] | null): PassengerForm[] {
  if (!teilnehmer) return []

  return teilnehmer.map((item, index) => {
    const firstSegment = item.teilstrecken?.[0]
    const fullName = `${safeText(item.vorname)} ${safeText(item.nachname)}`.trim()

    return {
      id: item.id,
      sourceGuestId: item.fahrgastId ?? null,
      saveAsGuest: item.alsStammgastGespeichert,
      name: fullName,
      phone: safeText(item.telefonnummer),
      pickupAddress: safeText(firstSegment?.abholadresse ?? item.adresse),
      destinationAddress: safeText(firstSegment?.zieladresse),
      time: extractHourMinute(firstSegment?.startzeit),
      istAbgehakt: item.istAbgehakt,
      abgehaktAm: item.abgehaktAm ?? null,
    }
  })
}

function toLocalDateString(date: Date) {
  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

export function mapBackendRideToCalendarRide(dto: BackendFahrtDto, fahrerListe: FahrerListItem[] = []): CalendarRide {
  const type = mapBackendTypeToRideType(dto.fahrttyp)
  const safeFahrerListe = Array.isArray(fahrerListe) ? fahrerListe : []

  const fahrer = safeFahrerListe.find(
    (f) => f.fahrerId === dto.fahrerId,
  )

  return {
    id: dto.id,
    date: new Date(dto.datum),
    type,
    status: mapBackendStatusToRideStatus(dto.status, type),
    title: dto.titel,
    time: extractHourMinute(dto.startzeit),
    driverName: fahrer?.name ?? '',
    fahrerId: dto.fahrerId ?? null,
    fahrzeugId: dto.fahrzeugId ?? null,
    passengers: mapTeilnehmerToPassengers(dto.teilnehmer),
    remarks: dto.bemerkung ?? '',
  }
}

export function mapCalendarRideToBackendWriteDto(ride: CalendarRide, initiativeId?: number | null): BackendFahrtWriteDto {
  const firstPassenger = ride.passengers[0]
  const earliestTime = ride.passengers
    .map(p => p.time)
    .filter((t): t is string => !!t)
    .sort()[0]

  return {
    fahrt: {
      titel: ride.title,
      datum: toLocalDateString(ride.date),
      zielort: firstPassenger?.destinationAddress || '',
      fahrttyp: ride.type,
      startzeit: earliestTime
        ? `${toLocalDateString(ride.date)}T${earliestTime}:00`
        : `${toLocalDateString(ride.date)}T00:00:00`,
      endzeit: null,
      bemerkung: safeText(ride.remarks).trim() || null,
      status: mapRideStatusToBackendStatus(ride.status),
      fahrerId: ride.fahrerId,
      fahrzeugId: ride.fahrzeugId,
      initiativeId: initiativeId ?? null,
    },
    teilnehmer: ride.passengers.map((p, index) => ({
      fahrgastId: p.sourceGuestId ?? null,
      vorname: safeText(p.name).trim().split(/\s+/)[0] ?? '',
      nachname: safeText(p.name).trim().split(/\s+/).slice(1).join(' ') || safeText(p.name).trim(),
      adresse: p.saveAsGuest ? (safeText(p.pickupAddress).trim() || null) : null,
      telefonnummer: safeText(p.phone).trim() ? safeText(p.phone).trim() : null,
      alsStammgastSpeichern: Boolean(p.saveAsGuest),
      abholadresse: safeText(p.pickupAddress),
      zieladresse: safeText(p.destinationAddress),
      startzeit: p.time
        ? `${toLocalDateString(ride.date)}T${p.time}:00`
        : null,
      endzeit: null,
      reihenfolge: index + 1,
      status: null,
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

/*async function tryLoadFromBackend(): Promise<CalendarRide[] | null> {
  try {
    const response = await apiFetch(endpoint, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    const res = await fetch(`${API_BASE_URL}/api/v1/fahrten`)
    if (!res.ok) return null

    const data: BackendFahrtDto[] = await res.json()
    return data.map(mapBackendRideToCalendarRide)
  } catch {
    return null
  }
}*/

async function tryLoadFromBackend(
  fahrerListe: FahrerListItem[],
  initiativeId?: number | null,
): Promise<CalendarRide[] | null> {
  try {
    const query = initiativeId ? `?initiativeId=${initiativeId}` : ''
    const res = await fetch(`${API_BASE_URL}/api/v1/fahrten${query}`)
    if (!res.ok) return null

    const data: BackendFahrtDto[] = await res.json()

    return data.map((dto) =>
      mapBackendRideToCalendarRide(dto, fahrerListe)
    )
  } catch {
    return null
  }
}

/*async function trySaveToBackend(rides: CalendarRide[]) {
  try {
    await apiFetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(rides.map(mapCalendarRideToBackendWriteDto)),
    })
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
}*/

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

export async function loadDashboardState(
  fahrerListe: FahrerListItem[],
  initiativeId?: number | null,
): Promise<DashboardStateSnapshot> {
  const local = parseStoredState(localStorage.getItem(DASHBOARD_STORAGE_KEY))
  const backend = await tryLoadFromBackend(fahrerListe, initiativeId)

  if (!backend) return local

  return {
    rides: backend,
    completedPassengerKeys: local.completedPassengerKeys,
    nextRideId:
      backend.reduce((m, r) => Math.max(m, r.id), 0) + 1,
  }
}

export async function saveDashboardState(state: DashboardStateSnapshot): Promise<void> {
  localStorage.setItem(DASHBOARD_STORAGE_KEY, serializeState(state))
  //await trySaveToBackend(state.rides)
}
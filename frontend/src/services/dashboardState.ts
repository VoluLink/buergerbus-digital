import { API_BASE_URL } from './api'
import type { CalendarRide, PassengerForm, RideStatus, RideType } from '../types/DashboardRide'
import type { FahrerListItem } from '../types/FahrerListItem'

type DashboardStateSnapshot = {
  rides: CalendarRide[]
  completedPassengerKeys: string[]
  nextRideId: number
}

export type BackendFahrtDto = {
  id: number
  titel: string
  datum: string
  datumBis: string | null
  fahrttyp: string
  startzeit: string
  endzeit?: string | null
  bemerkung?: string | null
  status: string
  angelegtVonUserName?: string | null
  fahrerId?: number | null
  fahrzeugId?: number | null
  teilnehmer?: BackendFahrtTeilnehmerDto[] | null
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

type BackendFahrtWriteDto = {
  fahrt: {
    titel: string
    datum: string
    datumBis: string | null
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

function buildRentalTimeRange(startTime?: string | null, endTime?: string | null) {
  const rentalStart = extractHourMinute(startTime)
  const rentalEnd = extractHourMinute(endTime)

  if (rentalStart && rentalEnd) {
    return `${rentalStart}-${rentalEnd}`
  }

  return rentalStart || rentalEnd
}

function mapBackendTypeToRideType(fahrttyp: string): RideType {
  const normalized = safeText(fahrttyp).trim().toLowerCase()

  if (normalized.includes('theme')) return 'theme'

  if (
    normalized.includes('vermiet') ||
    normalized === 'rental'
  ) {
    return 'rental'
  }

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

function mapTeilnehmerToPassengers(teilnehmer?: BackendFahrtTeilnehmerDto[] | null): PassengerForm[] {
  if (!teilnehmer) return []

  return teilnehmer.map((item) => {
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

function buildDefaultRideEndzeit(date: Date, latestPassengerTime?: string | null) {
  const normalizedTime = safeText(latestPassengerTime).trim()
  const match = normalizedTime.match(/^(\d{2}):(\d{2})$/)

  if (!match) {
    return null
  }

  const hours = Number(match[1])
  const minutes = Number(match[2])

  if (!Number.isInteger(hours) || !Number.isInteger(minutes)) {
    return null
  }

  const endDate = new Date(date)
  endDate.setHours(hours, minutes, 0, 0)
  endDate.setMinutes(endDate.getMinutes() + 60)

  return `${toLocalDateString(endDate)}T${String(endDate.getHours()).padStart(2, '0')}:${String(endDate.getMinutes()).padStart(2, '0')}:00`
}

export function mapBackendRideToCalendarRide(dto: BackendFahrtDto, fahrerListe: FahrerListItem[] = []): CalendarRide {
  const type = mapBackendTypeToRideType(dto.fahrttyp)
  const safeFahrerListe = Array.isArray(fahrerListe) ? fahrerListe : []
  const normalizedEndTime = extractHourMinute(dto.endzeit)

  const fahrer = safeFahrerListe.find(
    (f) => f.fahrerId === dto.fahrerId,
  )

  return {  
    id: dto.id,
    date: new Date(dto.datum),
    dateBis: dto.datumBis ? new Date(dto.datumBis) : null,
    type,
    status: mapBackendStatusToRideStatus(dto.status, type),
    title: dto.titel,
    time: type === 'rental'
      ? buildRentalTimeRange(dto.startzeit, dto.endzeit)
      : extractHourMinute(dto.startzeit),
    endTime: normalizedEndTime || null,
    driverName: fahrer?.name ?? '',
    createdByName: safeText(dto.angelegtVonUserName),
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
  const latestTime = ride.passengers
    .map(p => p.time)
    .filter((t): t is string => !!t)
    .sort()
    .at(-1)
  const fallbackEndzeit = buildDefaultRideEndzeit(ride.date, latestTime)

  if (ride.type === 'rental') {
    const [timeFrom, timeTo] = (ride.time ?? '').split('-')

    return {
      fahrt: {
        titel: ride.title,

        datum: toLocalDateString(ride.date),

        datumBis: ride.dateBis
          ? toLocalDateString(ride.dateBis)
          : null,

        zielort: '',

        fahrttyp: ride.type,

        startzeit: `${toLocalDateString(ride.date)}T${timeFrom || '00:00'}:00`,

        endzeit: timeTo
          ? `${toLocalDateString(
              ride.dateBis ?? ride.date
            )}T${timeTo}:00`
          : null,

        bemerkung: safeText(ride.remarks).trim() || null,

        status: mapRideStatusToBackendStatus(ride.status),

        fahrerId: ride.fahrerId,
        fahrzeugId: ride.fahrzeugId,

        initiativeId: initiativeId ?? null,
      },

      teilnehmer: [],
    }
  }

  return {
    fahrt: {
      titel: ride.title,
      datum: toLocalDateString(ride.date),
      datumBis: null,
      zielort: firstPassenger?.destinationAddress || '',
      fahrttyp: ride.type,
      startzeit: earliestTime
        ? `${toLocalDateString(ride.date)}T${earliestTime}:00`
        : `${toLocalDateString(ride.date)}T00:00:00`,
      endzeit: ride.endTime
        ? `${toLocalDateString(ride.date)}T${ride.endTime}:00`
        : fallbackEndzeit,
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
        createdByName: r.createdByName ?? '',
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
}
import type { CalendarRide, PassengerForm, RideStatus, RideType } from '../../../types/DashboardRide'
import { rideStatusMetadata } from '../../../config/rideStatusConfig'
import {
  getRentalStartTime,
  getRentalEndTime,
  formatMinutesAsTime,
  parseTimeToMinutes,
} from './timeUtils'
import {
  isSameDay,
  normalizeDate,
} from './dateUtils'

// Formatters
const statusMetadata = rideStatusMetadata

const rentalRangeDateFormatter = new Intl.DateTimeFormat('de-DE', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
})

// Helper functions
export function normalizePassengerText(value?: string | null) {
  return value ?? ''
}

export function getEarliestPassengerTime(passengers: PassengerForm[]) {
  return passengers
    .map((passenger) => normalizePassengerText(passenger.time).trim())
    .filter((time): time is string => time.length > 0)
    .sort()[0] ?? ''
}

// Display time functions
export function getRideDisplayTime(ride: Pick<CalendarRide, 'type' | 'time' | 'passengers'>) {
  if (ride.type === 'rental') {
    return normalizePassengerText(ride.time).trim()
  }

  return getEarliestPassengerTime(ride.passengers) || normalizePassengerText(ride.time).trim()
}

export function getRideCalendarDisplayTime(ride: Pick<CalendarRide, 'type' | 'time' | 'passengers'>) {
  if (ride.type === 'rental') {
    return getRentalStartTime(ride.time)
  }

  return getRideDisplayTime(ride)
}

export function getDayTimelineRideDisplayTime(
  ride: Pick<CalendarRide, 'type' | 'time' | 'endTime' | 'passengers' | 'date' | 'dateBis'>,
  startMinutes: number,
  endMinutes: number,
) {
  if (ride.type === 'rental') {
    const rentalEndTime = getRentalEndTime(ride.time)

    if (ride.dateBis && !isSameDay(ride.date, ride.dateBis) && rentalEndTime) {
      return `${rentalRangeDateFormatter.format(ride.date)} ${getRentalStartTime(ride.time)} - ${rentalRangeDateFormatter.format(ride.dateBis)} ${rentalEndTime}`
    }

    return `${formatMinutesAsTime(startMinutes)}-${formatMinutesAsTime(endMinutes)}`
  }

  if (normalizePassengerText(ride.endTime).trim()) {
    return `${formatMinutesAsTime(startMinutes)}-${formatMinutesAsTime(endMinutes)}`
  }

  return getRideCalendarDisplayTime(ride)
}

// Title functions
export function getDayTimelineRideTitle(
  ride: CalendarRide,
  startMinutes: number,
  endMinutes: number,
) {
  const displayTime = getDayTimelineRideDisplayTime(ride, startMinutes, endMinutes)

  if (!displayTime) {
    return `${ride.title} • Keine Uhrzeit (${statusMetadata[ride.status].label})`
  }

  if (ride.type === 'rental') {
    return `${ride.title} • Vermietet ${displayTime} Uhr (${statusMetadata[ride.status].label})`
  }

  if (normalizePassengerText(ride.endTime).trim()) {
    return `${ride.title} • ${displayTime} Uhr (${statusMetadata[ride.status].label})`
  }

  return getRideCalendarTitle(ride)
}

export function getRideTimeSummary(ride: Pick<CalendarRide, 'type' | 'time' | 'passengers'>) {
  const rideTime = getRideDisplayTime(ride)

  if (!rideTime) {
    return 'Keine Uhrzeit'
  }

  if (ride.type === 'rental') {
    return `${rideTime} Uhr`
  }

  return `Erste Abholung ${rideTime} Uhr`
}

export function getRideCalendarTitle(ride: CalendarRide) {
  const calendarTime = getRideCalendarDisplayTime(ride)

  if (!calendarTime) {
    return `${ride.title} • Keine Uhrzeit (${statusMetadata[ride.status].label})`
  }

  if (ride.type === 'rental') {
    return `${ride.title} • Von ${calendarTime} Uhr (${statusMetadata[ride.status].label})`
  }

  return `${ride.title} • Erste Abholung ${calendarTime} Uhr (${statusMetadata[ride.status].label})`
}

// Status and type functions
export function buildDriverDisplayName(
  username?: string,
  email?: string,
  firstName?: string,
  lastName?: string,
) {
  const nameParts = [firstName, lastName].filter(Boolean)
  if (nameParts.length > 0) {
    return nameParts.join(' ')
  }

  if (username) {
    return username
  }

  return email || ''
}

export function getRideStatusByType(rideType: RideType, driverName: string): RideStatus {
  if (rideType === 'theme') {
    return 'theme'
  }

  if (rideType === 'rental') {
    return 'rental'
  }

  return normalizePassengerText(driverName).trim() ? 'assigned' : 'open'
}

export function rideTypeButtonClassName(currentType: RideType, rideType: RideType) {
  if (currentType === rideType) {
    if (rideType === 'theme') {
      return 'bg-[#0053a0] text-white shadow-md'
    }

    if (rideType === 'rental') {
      return 'bg-[#0053a0] text-white shadow-md'
    }

    return 'bg-[#0053a0] text-white shadow-md'
  }

  return 'border border-slate-300 bg-white text-slate-500 hover:bg-slate-50'
}

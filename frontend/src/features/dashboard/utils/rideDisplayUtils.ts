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
    .sort((left, right) => {
      const [leftHours, leftMinutes] = left.split(':').map(Number)
      const [rightHours, rightMinutes] = right.split(':').map(Number)
      return leftHours * 60 + leftMinutes - (rightHours * 60 + rightMinutes)
    })[0] ?? ''
}

type TimeRangeRide = Pick<CalendarRide, 'type' | 'time' | 'endTime' | 'passengers'>

function getValidTimes(values: Array<string | null | undefined>) {
  return values
    .map((value) => normalizePassengerText(value).trim())
    .filter((value) => parseTimeToMinutes(value) !== null)
}

/**
 * Determines the display range once for month, week, day, and detail views.
 * Passenger pickup times define the start; arrival times, then the ride end,
 * define the end. The latest pickup is only an end-time fallback.
 */
export function getTripTimeRange(ride: TimeRangeRide) {
  if (ride.type === 'rental') {
    const start = getRentalStartTime(ride.time)
    const end = getRentalEndTime(ride.time) || normalizePassengerText(ride.endTime).trim()
    return { start: getValidTimes([start])[0] ?? '', end: getValidTimes([end])[0] ?? '' }
  }

  const pickupTimes = getValidTimes(ride.passengers.map((passenger) => passenger.time))
  // The planned ride range is authoritative. Participant times remain a
  // backwards-compatible fallback for legacy records without a ride start.
  const start = getValidTimes([ride.time])[0]
    ?? pickupTimes.sort((left, right) => parseTimeToMinutes(left)! - parseTimeToMinutes(right)!)[0]
    ?? ''
  const arrivalTimes = getValidTimes(ride.passengers.map((passenger) => passenger.endTime))
  const end = getValidTimes([ride.endTime])[0]
    ?? arrivalTimes.sort((left, right) => parseTimeToMinutes(right)! - parseTimeToMinutes(left)!)[0]
    ?? pickupTimes.sort((left, right) => parseTimeToMinutes(right)! - parseTimeToMinutes(left)!)[0]
    ?? ''

  return { start, end }
}

export function formatTripTimeRange(ride: TimeRangeRide) {
  const { start, end } = getTripTimeRange(ride)
  if (!start) return 'Keine Zeit angegeben'
  if (!end || start === end) return `${start} Uhr`
  return `${start} – ${end} Uhr`
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

    return `${formatMinutesAsTime(startMinutes)} – ${formatMinutesAsTime(endMinutes)} Uhr`
  }

  return formatTripTimeRange(ride)
}

// Title functions
export function getDayTimelineRideTitle(
  ride: CalendarRide,
  startMinutes: number,
  endMinutes: number,
) {
  const displayTime = getDayTimelineRideDisplayTime(ride, startMinutes, endMinutes)

  if (ride.type === 'rental') {
    return `${ride.title} • Vermietet ${displayTime} (${statusMetadata[ride.status].label})`
  }

  return `${ride.title} • ${displayTime} (${statusMetadata[ride.status].label})`
}

export function getRideTimeSummary(ride: TimeRangeRide) {
  return formatTripTimeRange(ride)
}

export function getRideCalendarTitle(ride: CalendarRide) {
  return `${ride.title} • ${formatTripTimeRange(ride)} (${statusMetadata[ride.status].label})`
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

export function getRideStatusByType(rideType: RideType, fahrerId: number | null): RideStatus {
  if (rideType === 'rental') {
    return 'rental'
  }

  return fahrerId ? 'assigned' : 'open'
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

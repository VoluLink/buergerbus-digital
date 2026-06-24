import {
  createFahrt,
  getFahrten,
  getFahrt,
  updateFahrt,
  deleteFahrt,
  updateFahrtteilnehmerAbgehakt,
  meldeFahrerAn,
  meldeFahrerAb,
} from '../services/fahrtApi'

import { mapCalendarRideToBackendWriteDto, mapBackendRideToCalendarRide } from '../services/dashboardState'
import { useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  Bus,
  Clock3,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  CircleUserRound,
  Bell,
  LogOut,
  MapPin,
  Menu,
  Plus,
  Phone,
  Sparkles,
  Settings,
  Trash2,
  UserRound,
  UserRoundPlus,
  Users,
  X,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import UserMenuButton from '../components/UserMenuButton'
import { useAuth } from '../context/AuthContext'
import { useRoleVisibility } from '../hooks/useRoleVisibility'
import { saveDashboardState } from '../services/dashboardState'
import { getFahrgaeste } from '../services/fahrgastApi'
import { getFahrzeuge } from '../services/fahrzeugApi'
import { getInitiativen } from '../services/initiativeApi'
import type { CalendarRide, PassengerForm, RideStatus, RideType } from '../types/DashboardRide'
import type { Fahrgast } from '../types/Fahrgast'
import type { Initiative } from '../types/Initiative'
import { getAllFahrer } from '../services/fahrerList'


type RideFormType = 'standard' | 'theme'
type DayRole = 'dispo' | 'fahrer'
type CalendarView = 'Monat' | 'Woche' | 'Tag'

type RideFormState = {
  fahrerId: number | null
  fahrzeugId: number | null
  driverName: string
  themeTitle: string
  themeDestination: string
  remarks: string
  passengers: PassengerForm[]
}

type CalendarDay = {
  date: Date
  isCurrentMonth: boolean
}

type FiveMinuteTimeFieldProps = {
  value: string
  onChange: (value: string) => void
  wrapperClassName?: string
  fieldClassName?: string
}

const weekDays = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']
const calendarViews: CalendarView[] = ['Monat', 'Woche', 'Tag']

const topFilters = ['Offene Fahrten', 'Meine Fahrten', 'Alle Fahrten']
const statusLegend = [
  { key: 'open', label: 'Offene Fahrten', color: 'bg-amber-500' },
  { key: 'assigned', label: 'Zugewiesen', color: 'bg-blue-500' },
  { key: 'completed', label: 'Abgeschlossen', color: 'bg-emerald-500' },
  { key: 'theme', label: 'Themenfahrt', color: 'bg-fuchsia-500' },
  { key: 'rental', label: 'Vermietung', color: 'bg-cyan-600' },
  { key: 'saved', label: 'Nur gespeichert', color: 'bg-sky-400' },
] satisfies Array<{ key: RideStatus; label: string; color: string }>

const statusMetadata = statusLegend.reduce<Record<RideStatus, { label: string; color: string }>>(
  (accumulator, entry) => {
    accumulator[entry.key] = {
      label: entry.label,
      color: entry.color,
    }
    return accumulator
  },
  {
    open: { label: 'Offene Fahrten', color: 'bg-amber-500' },
    assigned: { label: 'Zugewiesen', color: 'bg-blue-500' },
    completed: { label: 'Abgeschlossen', color: 'bg-emerald-500' },
    theme: { label: 'Themenfahrt', color: 'bg-fuchsia-500' },
    rental: { label: 'Vermietung', color: 'bg-cyan-600' },
    saved: { label: 'Nur gespeichert', color: 'bg-sky-400' },
  },
)

const monthFormatter = new Intl.DateTimeFormat('de-DE', {
  month: 'long',
  year: 'numeric',
})

const dayDialogFormatter = new Intl.DateTimeFormat('de-DE', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

const weekdayFormatter = new Intl.DateTimeFormat('de-DE', {
  weekday: 'long',
})

const dayHeaderDateFormatter = new Intl.DateTimeFormat('de-DE', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

const rentalRangeDateFormatter = new Intl.DateTimeFormat('de-DE', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
})

const dateInputFormatter = new Intl.DateTimeFormat('en-CA')
const hourTimeOptions = Array.from({ length: 24 }, (_, index) => String(index).padStart(2, '0'))
const minuteTimeOptions = Array.from({ length: 12 }, (_, index) => String(index * 5).padStart(2, '0'))
const DAY_TIMELINE_HOUR_HEIGHT = 48
const DAY_TIMELINE_VERTICAL_PADDING = 18
const DAY_TIMELINE_TOTAL_HEIGHT = (DAY_TIMELINE_HOUR_HEIGHT * 24) + (DAY_TIMELINE_VERTICAL_PADDING * 2)
const dayTimelineHourMarkers = Array.from({ length: 25 }, (_, index) => index)

function normalizeDate(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function addDays(date: Date, amount: number) {
  const nextDate = new Date(date)
  nextDate.setDate(nextDate.getDate() + amount)
  return normalizeDate(nextDate)
}

function addMonths(date: Date, amount: number) {
  const nextDate = new Date(date)
  nextDate.setMonth(nextDate.getMonth() + amount)
  return normalizeDate(nextDate)
}

function startOfWeek(date: Date) {
  const nextDate = normalizeDate(date)
  const weekday = nextDate.getDay()
  const mondayOffset = weekday === 0 ? -6 : 1 - weekday
  nextDate.setDate(nextDate.getDate() + mondayOffset)
  return normalizeDate(nextDate)
}

function isSameDay(left: Date, right: Date) {
  return left.getFullYear() === right.getFullYear()
    && left.getMonth() === right.getMonth()
    && left.getDate() === right.getDate()
}

function buildMonthDays(currentMonth: Date) {
  const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1)
  const startDate = startOfWeek(firstDayOfMonth)

  const days: CalendarDay[] = []

  for (let index = 0; index < 42; index += 1) {
    const date = addDays(startDate, index)
    days.push({
      date,
      isCurrentMonth: date.getMonth() === currentMonth.getMonth(),
    })
  }

  return days
}

function buildWeekDays(selectedDate: Date) {
  const weekStart = startOfWeek(selectedDate)
  const days: CalendarDay[] = []

  for (let index = 0; index < 7; index += 1) {
    const date = addDays(weekStart, index)
    days.push({
      date,
      isCurrentMonth: true,
    })
  }

  return days
}

function formatMonthHeading(date: Date) {
  const heading = monthFormatter.format(date)
  return heading.charAt(0).toUpperCase() + heading.slice(1)
}

function formatDialogHeading(date: Date) {
  const heading = dayDialogFormatter.format(date)
  return heading.charAt(0).toUpperCase() + heading.slice(1)
}

function toDateKey(date: Date) {
  return date.toISOString().slice(0, 10)
}

function toDateInputValue(date: Date) {
  return dateInputFormatter.format(date)
}

function normalizeName(value: string) {
  return value.trim().toLocaleLowerCase('de-DE')
}

function normalizePassengerText(value?: string | null) {
  return value ?? ''
}

function getEarliestPassengerTime(passengers: PassengerForm[]) {
  return passengers
    .map((passenger) => normalizePassengerText(passenger.time).trim())
    .filter((time): time is string => time.length > 0)
    .sort()[0] ?? ''
}

function getRentalStartTime(time?: string | null) {
  const normalizedTime = normalizePassengerText(time).trim()

  if (!normalizedTime) {
    return ''
  }

  return normalizedTime.split('-')[0]?.trim() ?? ''
}

function getRentalEndTime(time?: string | null) {
  const normalizedTime = normalizePassengerText(time).trim()

  if (!normalizedTime) {
    return ''
  }

  return normalizedTime.split('-')[1]?.trim() ?? ''
}

function parseTimeToMinutes(value?: string | null) {
  const normalizedTime = normalizePassengerText(value).trim()
  const match = normalizedTime.match(/^(\d{1,2}):(\d{2})$/)

  if (!match) {
    return null
  }

  const hours = Number(match[1])
  const minutes = Number(match[2])

  if (!Number.isInteger(hours) || !Number.isInteger(minutes) || hours < 0 || hours > 24 || minutes < 0 || minutes > 59) {
    return null
  }

  if (hours === 24 && minutes > 0) {
    return null
  }

  return Math.min(hours * 60 + minutes, 24 * 60)
}

function formatMinutesAsTime(totalMinutes: number) {
  const clampedMinutes = Math.max(0, Math.min(totalMinutes, 24 * 60))
  const hours = Math.floor(clampedMinutes / 60)
  const minutes = clampedMinutes % 60

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
}

function snapTimeToFiveMinuteStep(value?: string | null) {
  const normalizedValue = normalizePassengerText(value).trim()

  if (!normalizedValue) {
    return ''
  }

  const minutes = parseTimeToMinutes(normalizedValue)

  if (minutes === null) {
    return normalizedValue
  }

  const snappedMinutes = Math.min(Math.round(minutes / 5) * 5, 23 * 60 + 55)
  const hours = Math.floor(snappedMinutes / 60)
  const remainderMinutes = snappedMinutes % 60

  return `${String(hours).padStart(2, '0')}:${String(remainderMinutes).padStart(2, '0')}`
}

function buildTimeFromParts(hours: string, minutes: string) {
  if (!hours) {
    return ''
  }

  return snapTimeToFiveMinuteStep(`${hours}:${minutes || '00'}`)
}

function FiveMinuteTimeField({
  value,
  onChange,
  wrapperClassName = 'mt-2 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2',
  fieldClassName = 'w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-700 outline-none',
}: FiveMinuteTimeFieldProps) {
  const normalizedValue = snapTimeToFiveMinuteStep(value)
  const [hours = '', minutes = ''] = normalizedValue.split(':')
  const selectedMinutes = hours ? (minutes || '00') : ''

  return (
    <div className={wrapperClassName}>
      <select
        value={hours}
        onChange={(event) => {
          const nextHours = event.target.value

          if (!nextHours) {
            onChange('')
            return
          }

          onChange(buildTimeFromParts(nextHours, selectedMinutes || '00'))
        }}
        className={fieldClassName}
      >
        <option value="">Stunde</option>
        {hourTimeOptions.map((hourValue) => (
          <option key={`hour-${hourValue}`} value={hourValue}>
            {hourValue}
          </option>
        ))}
      </select>

      <span className="text-sm font-semibold text-slate-400">:</span>

      <select
        value={selectedMinutes}
        onChange={(event) => {
          if (!hours) {
            return
          }

          onChange(buildTimeFromParts(hours, event.target.value || '00'))
        }}
        disabled={!hours}
        className={fieldClassName}
      >
        <option value="">Minute</option>
        {minuteTimeOptions.map((minuteValue) => (
          <option key={`minute-${minuteValue}`} value={minuteValue}>
            {minuteValue}
          </option>
        ))}
      </select>
    </div>
  )
}

function formatHourLabel(hour: number) {
  return `${String(hour).padStart(2, '0')}:00`
}

function getRideDisplayTime(ride: Pick<CalendarRide, 'type' | 'time' | 'passengers'>) {
  if (ride.type === 'rental') {
    return normalizePassengerText(ride.time).trim()
  }

  return getEarliestPassengerTime(ride.passengers) || normalizePassengerText(ride.time).trim()
}

function getRideCalendarDisplayTime(ride: Pick<CalendarRide, 'type' | 'time' | 'passengers'>) {
  if (ride.type === 'rental') {
    return getRentalStartTime(ride.time)
  }

  return getRideDisplayTime(ride)
}

function isSameRentalSeriesRide(
  left: Pick<CalendarRide, 'id' | 'type' | 'title' | 'time' | 'remarks' | 'fahrzeugId'>,
  right: Pick<CalendarRide, 'id' | 'type' | 'title' | 'time' | 'remarks' | 'fahrzeugId'>,
) {
  return left.id !== right.id
    && left.type === 'rental'
    && right.type === 'rental'
    && normalizePassengerText(left.title).trim() === normalizePassengerText(right.title).trim()
    && normalizePassengerText(left.time).trim() === normalizePassengerText(right.time).trim()
    && normalizePassengerText(left.remarks).trim() === normalizePassengerText(right.remarks).trim()
    && left.fahrzeugId === right.fahrzeugId
}

function getRideTimelineRange(
  ride: Pick<CalendarRide, 'id' | 'date' | 'dateBis' | 'type' | 'time' | 'passengers' | 'title' | 'remarks' | 'fahrzeugId'>,
  activeDay?: Date,
) {
  if (ride.type === 'rental') {
    const [startTime, endTime] = normalizePassengerText(ride.time).split('-')
    const startMinutes = parseTimeToMinutes(startTime)

    if (startMinutes === null) {
      return null
    }

    const parsedEndMinutes = parseTimeToMinutes(endTime)
    const selectedDay = activeDay ? normalizeDate(activeDay) : normalizeDate(ride.date)
    const rentalEndDate = ride.dateBis ? normalizeDate(ride.dateBis) : null

    if (rentalEndDate && !isSameDay(ride.date, rentalEndDate)) {
      if (isSameDay(selectedDay, ride.date)) {
        return {
          startMinutes,
          endMinutes: 24 * 60,
        }
      }

      if (isSameDay(selectedDay, rentalEndDate)) {
        return {
          startMinutes: 0,
          endMinutes: parsedEndMinutes !== null ? parsedEndMinutes : 24 * 60,
        }
      }

      return {
        startMinutes: 0,
        endMinutes: 24 * 60,
      }
    }

    const endMinutes = parsedEndMinutes !== null && parsedEndMinutes > startMinutes
      ? parsedEndMinutes
      : Math.min(startMinutes + 60, 24 * 60)

    return { startMinutes, endMinutes }
  }

  const startMinutes = parseTimeToMinutes(getRideCalendarDisplayTime(ride))

  if (startMinutes === null) {
    return null
  }

  return {
    startMinutes,
    endMinutes: Math.min(startMinutes + 60, 24 * 60),
  }
}

type DayTimelineRideLayout = {
  ride: CalendarRide
  startMinutes: number
  endMinutes: number
  column: number
  columnCount: number
}

function buildDayTimelineRideLayout(
  rides: Array<{ ride: CalendarRide; startMinutes: number; endMinutes: number }>,
): DayTimelineRideLayout[] {
  const layouts: DayTimelineRideLayout[] = []
  const activeLayouts: DayTimelineRideLayout[] = []
  let clusterLayouts: DayTimelineRideLayout[] = []
  let clusterColumnCount = 0

  const finalizeCluster = () => {
    clusterLayouts.forEach((layout) => {
      layout.columnCount = clusterColumnCount || 1
    })

    clusterLayouts = []
    clusterColumnCount = 0
  }

  rides.forEach(({ ride, startMinutes, endMinutes }) => {
    for (let index = activeLayouts.length - 1; index >= 0; index -= 1) {
      if (activeLayouts[index].endMinutes <= startMinutes) {
        activeLayouts.splice(index, 1)
      }
    }

    if (activeLayouts.length === 0 && clusterLayouts.length > 0) {
      finalizeCluster()
    }

    const usedColumns = new Set(activeLayouts.map((layout) => layout.column))
    let column = 0

    while (usedColumns.has(column)) {
      column += 1
    }

    const layout: DayTimelineRideLayout = {
      ride,
      startMinutes,
      endMinutes,
      column,
      columnCount: 1,
    }

    activeLayouts.push(layout)
    clusterLayouts.push(layout)
    clusterColumnCount = Math.max(clusterColumnCount, activeLayouts.length)
    layouts.push(layout)
  })

  if (clusterLayouts.length > 0) {
    finalizeCluster()
  }

  return layouts
}

function getDayTimelineRideDisplayTime(
  ride: Pick<CalendarRide, 'type' | 'time' | 'passengers' | 'date' | 'dateBis'>,
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

  return getRideCalendarDisplayTime(ride)
}

function getDayTimelineRideTitle(
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

  return getRideCalendarTitle(ride)
}

function getRideTimeSummary(ride: Pick<CalendarRide, 'type' | 'time' | 'passengers'>) {
  const rideTime = getRideDisplayTime(ride)

  if (!rideTime) {
    return 'Keine Uhrzeit'
  }

  if (ride.type === 'rental') {
    return `${rideTime} Uhr`
  }

  return `Erste Abholung ${rideTime} Uhr`
}

function getRideCalendarTitle(ride: CalendarRide) {
  const calendarTime = getRideCalendarDisplayTime(ride)

  if (!calendarTime) {
    return `${ride.title} • Keine Uhrzeit (${statusMetadata[ride.status].label})`
  }

  if (ride.type === 'rental') {
    return `${ride.title} • Von ${calendarTime} Uhr (${statusMetadata[ride.status].label})`
  }

  return `${ride.title} • Erste Abholung ${calendarTime} Uhr (${statusMetadata[ride.status].label})`
}

function buildDriverDisplayName(username?: string, email?: string, firstName?: string, lastName?: string) {
  const nameParts = [firstName, lastName].filter(Boolean)
  if (nameParts.length > 0) {
    return nameParts.join(' ')
  }

  if (username) {
    return username
  }

  return email || ''
}

function getRideStatusByType(rideType: RideType, driverName: string): RideStatus {
  if (rideType === 'theme') {
    return 'theme'
  }

  if (rideType === 'rental') {
    return 'rental'
  }

  return normalizePassengerText(driverName).trim() ? 'assigned' : 'open'
}

function getDefaultRideStatusForOpenRide(ride: CalendarRide): RideStatus {
  if (ride.type === 'theme') {
    return 'theme'
  }

  if (ride.type === 'rental') {
    return 'rental'
  }

  if (ride.status === 'saved') {
    return 'saved'
  }

  return getRideStatusByType(ride.type, ride.driverName)
}

function rideTypeButtonClassName(currentType: RideType, rideType: RideType) {
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

function createEmptyPassenger(id: number): PassengerForm {
  return {
    id,
    sourceGuestId: null,
    saveAsGuest: false,
    name: '',
    phone: '',
    pickupAddress: '',
    destinationAddress: '',
    time: '',
    istAbgehakt: false,
    abgehaktAm: null,
  }
}

function applyThemeDestinationToPassengers(passengers: PassengerForm[], destination: string) {
  return passengers.map((passenger) => ({
    ...passenger,
    destinationAddress: destination,
  }))
}

function createInitialRideForms() {
  return {
    standard: {
      fahrerId: null,
      fahrzeugId: null,
      driverName: '',
      themeTitle: '',
      themeDestination: '',
      remarks: '',
      passengers: [createEmptyPassenger(1)],
    },
    theme: {
      fahrerId: null,
      fahrzeugId: null,
      driverName: '',
      themeTitle: '',
      themeDestination: '',
      remarks: '',
      passengers: [createEmptyPassenger(1)],
    },
  } satisfies Record<RideFormType, RideFormState>
}

function DashboardPage() {
  const navigate = useNavigate()
  const { currentUser, logout } = useAuth()
  const { canManageDataCrud, canManageInitiatives, isAdmin, isDisponent, isFahrer, isGast } = useRoleVisibility()
  const isRideCrudRestricted = !canManageDataCrud
  const visibleTopFilters = isGast
    ? []
    : isDisponent
    ? topFilters.filter((filter) => filter !== 'Meine Fahrten')
    : topFilters
  const today = useMemo(() => normalizeDate(new Date()), [])

  const [selectedFilter, setSelectedFilter] = useState('Alle Fahrten')
  const [selectedView, setSelectedView] = useState<CalendarView>('Monat')
  const [currentMonth, setCurrentMonth] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1),
  )
  const [selectedDate, setSelectedDate] = useState(today)
  const [isSideMenuOpen, setIsSideMenuOpen] = useState(false)
  const [isDayDialogOpen, setIsDayDialogOpen] = useState(false)
  const [isRideDialogOpen, setIsRideDialogOpen] = useState(false)
  const [dayRole, setDayRole] = useState<DayRole>('dispo')
  const [rideType, setRideType] = useState<RideType>('standard')
  const [rideFormsByType, setRideFormsByType] = useState<Record<RideFormType, RideFormState>>(
    createInitialRideForms(),
  )
  const [rentalRemarks, setRentalRemarks] = useState('')
  const [rentalName, setRentalName] = useState('')
  const [rentalDateFrom, setRentalDateFrom] = useState(toDateInputValue(today))
  const [rentalDateTo, setRentalDateTo] = useState(toDateInputValue(today))
  const [rentalTimeFrom, setRentalTimeFrom] = useState('')
  const [rentalTimeTo, setRentalTimeTo] = useState('')
  const [rentalVehicleId, setRentalVehicleId] = useState<number | null>(null)
  const [calendarRides, setCalendarRides] = useState<CalendarRide[]>([])
  const [rideInEditId, setRideInEditId] = useState<number | null>(null)
  const [ridePendingDelete, setRidePendingDelete] = useState<CalendarRide | null>(null)
  const [expandedRideIds, setExpandedRideIds] = useState<number[]>([])
  const [collapsedDriverRideIds, setCollapsedDriverRideIds] = useState<number[]>([])
  const [nextRideId, setNextRideId] = useState(1)
  const [isDashboardHydrated, setIsDashboardHydrated] = useState(false)
  const [knownGuests, setKnownGuests] = useState<Fahrgast[]>([])
  const [knownGuestsLoaded, setKnownGuestsLoaded] = useState(false)
  const [fahrerListe, setFahrerListe] = useState<any[]>([])
  const [fahrzeugListe, setFahrzeugListe] = useState<any[]>([])
  const [initiativeListe, setInitiativeListe] = useState<Initiative[]>([])
  const [fahrerSuche, setFahrerSuche] = useState('')
  const [selectedFahrerId, setSelectedFahrerId] = useState<number | null>(null)
  const [selectedInitiativeId, setSelectedInitiativeId] = useState<number | null>(currentUser?.initiative?.id ?? null)
  const [rideSaveError, setRideSaveError] = useState<string | null>(null)
  const [rideCapacityWarning, setRideCapacityWarning] = useState<string | null>(null)

  const remarksPlaceholder = useMemo(() => {
    if (rideType === 'theme') {
      return 'Zusätzliche Informationen zur Themenfahrt...'
    }

    if (rideType === 'rental') {
      return 'Bemerkungen zur Vermietung...'
    }

    return 'Zusätzliche Informationen zur Fahrt...'
  }, [rideType])

  const currentDriverNames = useMemo(() => {
    if (!currentUser) {
      return []
    }

    const fullName = buildDriverDisplayName(
      currentUser.username,
      currentUser.email,
      currentUser.vorname ?? undefined,
      currentUser.nachname ?? undefined,
    )

    const candidates = [fullName, currentUser.username, currentUser.email]
      .filter((value): value is string => Boolean(value && value.trim()))
      .map((value) => normalizeName(value))

    return Array.from(new Set(candidates))
  }, [currentUser])

  const currentDriverDisplayName = useMemo(() => {
    if (!currentUser) {
      return ''
    }

    return buildDriverDisplayName(
      currentUser.username,
      currentUser.email,
      currentUser.vorname ?? undefined,
      currentUser.nachname ?? undefined,
    )
  }, [currentUser])

  const currentCreatorDisplayName = useMemo(() => {
    if (!currentUser) {
      return ''
    }

    return buildDriverDisplayName(
      currentUser.username,
      currentUser.email,
      currentUser.vorname ?? undefined,
      currentUser.nachname ?? undefined,
    )
  }, [currentUser])

  const visibleFahrzeuge = useMemo(() => {
    if (canManageInitiatives && selectedInitiativeId != null) {
      return fahrzeugListe.filter((vehicle) => vehicle.initiativeId === selectedInitiativeId)
    }

    return fahrzeugListe
  }, [canManageInitiatives, fahrzeugListe, selectedInitiativeId])

  useEffect(() => {
    let isCancelled = false

    async function hydrateDashboard() {
      const [rides, fahrer] = await Promise.all([
        getFahrten(selectedInitiativeId),
        getAllFahrer(),
      ])

      if (isCancelled) return

      const mapped = rides.map((dto) =>
        mapBackendRideToCalendarRide(dto, fahrer)
      )

      setCalendarRides(mapped)
      setFahrerListe(fahrer)
      setIsDashboardHydrated(true)
    }

    void hydrateDashboard()

    return () => {
      isCancelled = true
    }
  }, [selectedInitiativeId])

  useEffect(() => {
    if (!canManageInitiatives) {
      return
    }

    let isCancelled = false

    async function loadInitiatives() {
      try {
        const data = await getInitiativen()

        if (!isCancelled) {
          setInitiativeListe(data)
          if (selectedInitiativeId == null && data.length > 0) {
            setSelectedInitiativeId(data[0].id)
          }
        }
      } catch {
        if (!isCancelled) {
          setInitiativeListe([])
        }
      }
    }

    void loadInitiatives()

    return () => {
      isCancelled = true
    }
  }, [canManageInitiatives, selectedInitiativeId])

  useEffect(() => {
    let isCancelled = false

    async function loadKnownGuests() {
      try {
        const guests = await getFahrgaeste(selectedInitiativeId)

        if (!isCancelled) {
          setKnownGuests(guests.filter((guest) => guest.aktiv))
          setKnownGuestsLoaded(true)
        }
      } catch {
        if (!isCancelled) {
          setKnownGuests([])
          setKnownGuestsLoaded(true)
        }
      }
    }

    void loadKnownGuests()

    return () => {
      isCancelled = true
    }
  }, [selectedInitiativeId])

  useEffect(() => {
    if (!knownGuestsLoaded) {
      return
    }

    const allowedGuestIds = new Set(knownGuests.map((guest) => guest.id))

    setRideFormsByType((currentState) => {
      let hasChanges = false

      const nextState = Object.entries(currentState).reduce<Record<RideFormType, RideFormState>>((accumulator, [rideFormKey, rideForm]) => {
        const sanitizedPassengers = rideForm.passengers.map((passenger) => {
          if (passenger.sourceGuestId == null || allowedGuestIds.has(passenger.sourceGuestId)) {
            return passenger
          }

          hasChanges = true

          return {
            ...passenger,
            sourceGuestId: null,
            saveAsGuest: false,
            name: '',
            phone: '',
            pickupAddress: '',
          }
        })

        accumulator[rideFormKey as RideFormType] = {
          ...rideForm,
          passengers: sanitizedPassengers,
        }

        return accumulator
      }, {} as Record<RideFormType, RideFormState>)

      return hasChanges ? nextState : currentState
    })
  }, [knownGuests, knownGuestsLoaded])

  useEffect(() => {
    let isCancelled = false

    async function loadFahrer() {
      try {
        const data = await getAllFahrer()

        if (!isCancelled) {
        setFahrerListe(data)
        }
      } catch {
        if (!isCancelled) {
          setFahrerListe([])
        }
      }
    }

    void loadFahrer()

    return () => {
      isCancelled = true
    }
  }, [])

  useEffect(() => {
    let isCancelled = false

    async function loadFahrzeuge() {
      try {
        const data = await getFahrzeuge()

        if (!isCancelled) {
          setFahrzeugListe(data)
        }
      } catch {
        if (!isCancelled) {
          setFahrzeugListe([])
        }
      }
    }

    void loadFahrzeuge()

    return () => {
      isCancelled = true
    }
  }, [])

  useEffect(() => {
    if (!isDashboardHydrated) {
      return
    }

    void saveDashboardState({
      rides: calendarRides,
      nextRideId,
    })
  }, [calendarRides, isDashboardHydrated, nextRideId])

  function openDayDialog(date: Date) {
    if (isGast) {
      return
    }

    setSelectedDate(normalizeDate(date))
    setIsDayDialogOpen(true)
  }

  function closeDayDialog() {
    setRidePendingDelete(null)
    setExpandedRideIds([])
    setCollapsedDriverRideIds([])
    setIsDayDialogOpen(false)
  }

  function openRideDialog() {
    if (isRideCrudRestricted) {
      return
    }

    setRideSaveError(null)
    setRideCapacityWarning(null)
    setIsDayDialogOpen(false)
    setRideInEditId(null)
    setRideFormsByType(createInitialRideForms())
    setRentalRemarks('')
    const selectedDateValue = toDateInputValue(selectedDate)
    setRentalName('')
    setRentalDateFrom(selectedDateValue)
    setRentalDateTo(selectedDateValue)
    setRentalTimeFrom('')
    setRentalTimeTo('')

    const initialVehicleId = visibleFahrzeuge.length === 1 ? visibleFahrzeuge[0].id : null
    setRentalVehicleId(initialVehicleId)
    setRideFormsByType((currentState) => ({
      standard: { ...currentState.standard, fahrzeugId: initialVehicleId },
      theme: { ...currentState.theme, fahrzeugId: initialVehicleId },
    }))
    setIsRideDialogOpen(true)
  }

  function closeRideDialog() {
    setRideSaveError(null)
    setRideCapacityWarning(null)
    setIsRideDialogOpen(false)
  }

  function toggleRideExpanded(rideId: number) {
    setExpandedRideIds((current) =>
      current.includes(rideId)
        ? current.filter((id) => id !== rideId)
        : [...current, rideId],
    )
  }

  function toggleDriverRideCollapsed(rideId: number) {
    setCollapsedDriverRideIds((current) =>
      current.includes(rideId)
        ? current.filter((id) => id !== rideId)
        : [...current, rideId],
    )
  }

  async function toggleDriverSelfAssignment(ride: CalendarRide) {
    const driverIdentity = currentDriverDisplayName || currentUser?.username || currentUser?.email || ''

    if (!driverIdentity) {
      return
    }

    const isAssignedToCurrentDriver = ride.status === 'assigned'
      && normalizeName(ride.driverName) === normalizeName(driverIdentity)

    if (isAssignedToCurrentDriver) {
      await meldeFahrerAb(ride.id)
    } else {
      await meldeFahrerAn(ride.id)
    }

    await reloadFahrten()
  }

  function canToggleDriverAssignment(ride: CalendarRide) {
    const driverIdentity = currentDriverDisplayName || currentUser?.username || currentUser?.email || ''
    const isAssignedToCurrentDriver = Boolean(driverIdentity)
      && ride.status === 'assigned'
      && normalizeName(ride.driverName) === normalizeName(driverIdentity)

    const canSelfRegister = !ride.fahrerId
      && ride.status !== 'completed'
      && ride.status !== 'saved'
      && (ride.type === 'theme' || ride.status === 'open')

    return canSelfRegister || isAssignedToCurrentDriver
  }

  function canManagePassengerChecks(ride: CalendarRide) {
    const driverIdentity = currentDriverDisplayName || currentUser?.username || currentUser?.email || ''
    const isAssignedToCurrentDriver = Boolean(driverIdentity)
      && ride.status === 'assigned'
      && normalizeName(ride.driverName) === normalizeName(driverIdentity)

    return isAdmin || isDisponent || isAssignedToCurrentDriver
  }

  async function togglePassengerCompleted(rideId: number, passengerId: number, checked: boolean) {
    await updateFahrtteilnehmerAbgehakt(passengerId, checked)
    await reloadFahrten()
  }

  function openEditRideDialog(ride: CalendarRide) {
    if (isRideCrudRestricted) {
      return
    }

    setSelectedDate(normalizeDate(ride.date))
    setRideInEditId(ride.id)
    setRideType(ride.type)
    setIsDayDialogOpen(false)

    if (ride.type === 'rental') {
      const rideDateValue = toDateInputValue(ride.date)

      setRentalName(ride.title)
      setRentalRemarks(ride.remarks)

      setRentalDateFrom(rideDateValue)

      setRentalDateTo(
        ride.dateBis
          ? toDateInputValue(ride.dateBis)
          : rideDateValue
      )

      setRentalTimeFrom(getRentalStartTime(ride.time))

      setRentalTimeTo(
        normalizePassengerText(ride.endTime).trim() || normalizePassengerText(ride.time).split('-')[1]?.trim() || ''
      )
      setRentalVehicleId(ride.fahrzeugId ?? null)
      setRideFormsByType(createInitialRideForms())
      setIsRideDialogOpen(true)

      return
    }

    const seededForms: Record<RideFormType, RideFormState> = createInitialRideForms()
    const passengersForEdit: PassengerForm[] = ride.passengers.length > 0
      ? ride.passengers
      : [createEmptyPassenger(1)]
    const rideFormKey: RideFormType = ride.type === 'theme' ? 'theme' : 'standard'

    seededForms[rideFormKey] = {
      driverName: ride.driverName,
      fahrerId: ride.fahrerId,
      fahrzeugId: ride.fahrzeugId,
      themeTitle: rideFormKey === 'theme' ? ride.title : '',
      themeDestination: rideFormKey === 'theme' ? ride.passengers[0]?.destinationAddress ?? '' : '',
      remarks: ride.remarks,
      passengers: passengersForEdit,
    }

    setRideFormsByType(seededForms)
    setRentalName('')
    setRentalRemarks('')
    setRentalTimeFrom('')
    setRentalTimeTo('')
    setRentalDateFrom(toDateInputValue(ride.date))
    setRentalDateTo(toDateInputValue(ride.date))
    setIsRideDialogOpen(true)
  }

  function requestDeleteRide(ride: CalendarRide) {
    if (isRideCrudRestricted) {
      return
    }

    setRidePendingDelete(ride)
  }

  function cancelDeleteRide() {
    setRidePendingDelete(null)
  }

async function confirmDeleteRide() {
  if (isRideCrudRestricted) {
    return
  }

  if (!ridePendingDelete) return

  const rideId = ridePendingDelete.id

  await deleteFahrt(rideId)

  setCalendarRides((current) =>
    current.filter((r) => r.id !== rideId),
  )

  if (rideInEditId === rideId) {
    setRideInEditId(null)
  }

  setRidePendingDelete(null)
}

  function addPassengerField() {
    if (rideType === 'rental') {
      return
    }

    setRideFormsByType((currentState) => ({
      ...currentState,
      [rideType]: (() => {
        const currentRideForm = currentState[rideType]
        const selectedFahrzeug = visibleFahrzeuge.find((vehicle) => vehicle.id === currentRideForm.fahrzeugId)

        if (!selectedFahrzeug || currentRideForm.passengers.length >= selectedFahrzeug.kapazitaet) {
          return currentRideForm
        }

        const nextAvailablePassengerId = currentRideForm.passengers.reduce(
          (maxId, passenger) => Math.max(maxId, passenger.id),
          0,
        ) + 1

        return {
          ...currentRideForm,
          passengers: [
            ...currentRideForm.passengers,
            rideType === 'theme'
              ? {
                  ...createEmptyPassenger(nextAvailablePassengerId),
                  destinationAddress: currentState.theme.themeDestination,
                }
              : createEmptyPassenger(nextAvailablePassengerId),
          ],
        }
      })(),
    }))
  }

  function removePassengerField(passengerId: number) {
    if (rideType === 'rental') {
      return
    }

    setRideFormsByType((currentState) => ({
      ...currentState,
      [rideType]: {
        ...currentState[rideType],
        passengers: currentState[rideType].passengers.filter((passenger) => passenger.id !== passengerId),
      },
    }))
  }

  function updateRideField(field: keyof Omit<RideFormState, 'passengers'>, value: string) {
    if (rideType === 'rental') {
      return
    }

    setRideFormsByType((currentState) => ({
      ...currentState,
      [rideType]: {
        ...currentState[rideType],
        [field]: value,
        ...(rideType === 'theme' && field === 'themeDestination'
          ? {
              passengers: applyThemeDestinationToPassengers(currentState.theme.passengers, value),
            }
          : {}),
      },
    }))
  }

  function updatePassengerField(
    passengerId: number,
    field: keyof Omit<PassengerForm, 'id' | 'sourceGuestId' | 'saveAsGuest'>,
    value: string | boolean,
  ) {
    if (rideType === 'rental') {
      return
    }

    setRideFormsByType((currentState) => ({
      ...currentState,
      [rideType]: {
        ...currentState[rideType],
        passengers: currentState[rideType].passengers.map((passenger) =>
          passenger.id === passengerId
            ? {
                ...passenger,
                ...(field === 'name' ? { sourceGuestId: null } : {}),
                [field]: field === 'time' && typeof value === 'string'
                  ? snapTimeToFiveMinuteStep(value)
                  : value,
              }
            : passenger,
        ),
      },
    }))
  }

  function autofillPassengerFromKnownGuest(passengerId: number, selectedGuestId: number) {
    if (rideType === 'rental') {
      return
    }

    const selectedGuest = knownGuests.find((guest) => guest.id === selectedGuestId)

    setRideFormsByType((currentState) => ({
      ...currentState,
      [rideType]: {
        ...currentState[rideType],
        passengers: currentState[rideType].passengers.map((passenger) => {
          if (passenger.id !== passengerId) {
            return passenger
          }

          if (!selectedGuest) {
            return {
              ...passenger,
              sourceGuestId: null,
              saveAsGuest: false,
            }
          }

          return {
            ...passenger,
            sourceGuestId: selectedGuestId,
            saveAsGuest: false,
            name: `${normalizePassengerText(selectedGuest.vorname)} ${normalizePassengerText(selectedGuest.nachname)}`.trim(),
            phone: normalizePassengerText(selectedGuest.telefonnummer),
            pickupAddress: normalizePassengerText(selectedGuest.adresse),
          }
        }),
      },
    }))
  }

  function updatePassengerSaveAsGuest(passengerId: number, value: boolean) {
    setRideFormsByType((currentState) => ({
      ...currentState,
      [rideType]: {
        ...currentState[rideType],
        passengers: currentState[rideType].passengers.map((passenger) =>
          passenger.id === passengerId
            ? {
                ...passenger,
                saveAsGuest: value,
              }
            : passenger,
        ),
      },
    }))
  }

  function autofillFahrer(selectedFahrerId: number) {
    const selectedFahrer = fahrerListe.find(
      (f) => f.fahrerId === selectedFahrerId,
    )

    if (!selectedFahrer) {
      return
    }

    setSelectedFahrerId(selectedFahrer.fahrerId)

    setRideFormsByType((currentState) => ({
      ...currentState,
      [rideType]: {
        ...currentState[rideType],

        fahrerId: selectedFahrer.fahrerId,
        driverName: selectedFahrer.name,
      },
    }))
  }

  function autofillFahrzeug(selectedFahrzeugId: number) {
    const selectedFahrzeug = fahrzeugListe.find((vehicle) => vehicle.id === selectedFahrzeugId)

    if (!selectedFahrzeug) {
      return
    }

    if (rideType === 'rental') {
      setRentalVehicleId(selectedFahrzeugId)
      return
    }

    const currentPassengerCount = rideFormsByType[rideType].passengers.length
    const removedPassengerCount = Math.max(0, currentPassengerCount - selectedFahrzeug.kapazitaet)

    if (removedPassengerCount > 0) {
      setRideCapacityWarning(`Das neue Fahrzeug hat nur ${selectedFahrzeug.kapazitaet} Plätze. ${removedPassengerCount} Fahrgast${removedPassengerCount === 1 ? '' : 'e'} wurde${removedPassengerCount === 1 ? '' : 'n'} aus der Fahrt entfernt.`)
    } else {
      setRideCapacityWarning(null)
    }

    setRideFormsByType((currentState) => ({
      ...currentState,
      [rideType]: {
        ...currentState[rideType],
        fahrzeugId: selectedFahrzeug.id,
        passengers: currentState[rideType].passengers.slice(0, selectedFahrzeug.kapazitaet),
      },
    }))
  }

  function closeSideMenu() {
    setIsSideMenuOpen(false)
  }

  function goToPage(path: string) {
    closeSideMenu()
    navigate(path)
  }

  function handleLogout() {
    closeSideMenu()
    logout()
    navigate('/', { replace: true })
  }

  function shiftPeriod(amount: number) {
    if (selectedView === 'Monat') {
      setCurrentMonth((current) => addMonths(current, amount))
      setSelectedDate((current) => addMonths(current, amount))
      return
    }

    if (selectedView === 'Woche') {
      setSelectedDate((current) => {
        const nextDate = addDays(current, amount * 7)
        setCurrentMonth(new Date(nextDate.getFullYear(), nextDate.getMonth(), 1))
        return nextDate
      })
      return
    }

    setSelectedDate((current) => {
      const nextDate = addDays(current, amount)
      setCurrentMonth(new Date(nextDate.getFullYear(), nextDate.getMonth(), 1))
      return nextDate
    })
  }

  //function saveRide(statusOverride?: RideStatus) {
   // if (isRideCrudRestricted) {
   //   return
    //}

  async function reloadFahrten() {
    const data = await getFahrten(selectedInitiativeId)

    const mapped = data.map((dto) => mapBackendRideToCalendarRide(dto, fahrerListe))

    setCalendarRides(mapped)
  }

  async function saveRide(statusOverride?: RideStatus) {
    if (isRideCrudRestricted) {
      return
    }

    setRideSaveError(null)

    const normalizeErrorMessage = (error: unknown) => {
      const rawMessage = error instanceof Error ? error.message : 'Fehler beim Speichern der Fahrt.'

      return rawMessage
        .replace(/^"|"$/g, '')
        .replace(/^Error:\s*/i, '')
    }

    console.log('SAVE RIDE START')
    if (rideType === 'rental') {
      const rideTime = rentalTimeFrom && rentalTimeTo ? `${rentalTimeFrom}-${rentalTimeTo}` : rentalTimeFrom || rentalTimeTo

    if (rideInEditId !== null) {
      const editedDate = normalizeDate(
      new Date(rentalDateFrom || toDateInputValue(selectedDate))
    )

  const payload = mapCalendarRideToBackendWriteDto({
    id: rideInEditId,
    date: editedDate,
    dateBis: normalizeDate(new Date(rentalDateTo || rentalDateFrom || editedDate)),
    type: 'rental',
    status: statusOverride ?? 'rental',
    title: rentalName.trim() || 'Vermietung',
    time: rideTime,
    driverName: '',
    fahrzeugId: rentalVehicleId,
    passengers: [],
    remarks: rentalRemarks.trim(),
  } as any)

    try {
      await updateFahrt(rideInEditId, payload)
    } catch (error) {
      setRideSaveError(normalizeErrorMessage(error))
      return
    }
    await reloadFahrten()

    setExpandedRideIds((current) =>
      current.filter((id) => id !== rideInEditId)
    )

    setCurrentMonth(
      new Date(editedDate.getFullYear(), editedDate.getMonth(), 1)
    )

    setSelectedDate(editedDate)

    setRideInEditId(null)
    setIsRideDialogOpen(false)

    return
  }

      const fromDate = normalizeDate(new Date(rentalDateFrom || toDateInputValue(selectedDate)))
      const toDate = normalizeDate(new Date(rentalDateTo || rentalDateFrom || toDateInputValue(selectedDate)))
      const startsAfterEnds = fromDate.getTime() > toDate.getTime()
      const startDate = startsAfterEnds ? toDate : fromDate
      const endDate = startsAfterEnds ? fromDate : toDate

      const rentalRide: CalendarRide = {
        id: nextRideId,
        date: startDate,
        dateBis: endDate,
        type: 'rental',
        status: statusOverride ?? 'rental',
        title: rentalName.trim() || 'Vermietung',
        time: rideTime,
        driverName: '',
        fahrerId: null,
        fahrzeugId: rentalVehicleId,
        createdByName: currentCreatorDisplayName,
        passengers: [],
        remarks: rentalRemarks.trim(),
      }

      const payload = mapCalendarRideToBackendWriteDto(rentalRide, selectedInitiativeId)

      let createdRide
      try {
        createdRide = await createFahrt(payload)
      } catch (error) {
        setRideSaveError(normalizeErrorMessage(error))
        return
      }

      const backendRide = mapBackendRideToCalendarRide(
        createdRide,
        fahrerListe
      )

      setCalendarRides((current) => [...current, backendRide])

      setNextRideId((current) => current + 1)

      setSelectedDate(startDate)
      setCurrentMonth(
        new Date(startDate.getFullYear(), startDate.getMonth(), 1)
      )

      setRideInEditId(null)
      setIsRideDialogOpen(false)

      return
    }

    const activeForm = rideFormsByType[rideType]
    const driverName = normalizePassengerText(activeForm.driverName).trim()
    const passengers = (rideType === 'theme'
      ? applyThemeDestinationToPassengers(activeForm.passengers, activeForm.themeDestination)
      : activeForm.passengers
    ).map((passenger, index) => ({
      ...passenger,
      id: index + 1,
    }))

if (rideInEditId !== null) {
  const baseStatus =
    statusOverride ??
    getRideStatusByType(rideType, driverName)

const existingRide = calendarRides.find(
  (r) => r.id === rideInEditId
)

const rideTime = getEarliestPassengerTime(passengers)

const tempRide: CalendarRide = {
  id: rideInEditId,
  date: normalizeDate(selectedDate),
  dateBis: rentalDateTo ? normalizeDate(new Date(rentalDateTo)) : null,
  type: rideType,
  status: baseStatus,
  title:
    rideType === 'theme'
      ? normalizePassengerText(activeForm.themeTitle).trim() || 'Themenfahrt'
      : 'Standardfahrt',
  time: rideTime,
  driverName,
  createdByName: existingRide?.createdByName ?? currentCreatorDisplayName,
  fahrerId: activeForm.fahrerId,
  fahrzeugId: activeForm.fahrzeugId,
  passengers: activeForm.passengers.length > 0
    ? activeForm.passengers.map((p, i) => ({ ...p, id: i + 1 }))
    : existingRide?.passengers ?? [],
  remarks: normalizePassengerText(activeForm.remarks).trim(),
}

const payload = mapCalendarRideToBackendWriteDto(tempRide, selectedInitiativeId)

const response = await updateFahrt(rideInEditId, payload)

const backendRide = mapBackendRideToCalendarRide(response, fahrerListe)

setCalendarRides((currentRides) =>
  currentRides.map((ride) =>
    ride.id === rideInEditId ? backendRide : ride
  ),
)

  setRideInEditId(null)
  setIsRideDialogOpen(false)
  return
}

    const baseStatus = statusOverride ?? getRideStatusByType(rideType, driverName)
    const rideTime = getEarliestPassengerTime(passengers)

    const nextRide: CalendarRide = {
      id: nextRideId,
      date: normalizeDate(selectedDate),
      type: rideType,
      status: baseStatus,
      title:
        rideType === 'theme'
          ? normalizePassengerText(activeForm.themeTitle).trim() || 'Themenfahrt'
          : 'Standardfahrt',
      time: rideTime,
      driverName,
          createdByName: currentCreatorDisplayName,
      fahrerId: activeForm.fahrerId,
      fahrzeugId: activeForm.fahrzeugId,
      passengers,
      remarks: normalizePassengerText(activeForm.remarks).trim(),
    }

    const payload = mapCalendarRideToBackendWriteDto(nextRide, selectedInitiativeId)

    // 1. Backend speichern
    let createdRide
    try {
      createdRide = await createFahrt(payload)
    } catch (error) {
      setRideSaveError(normalizeErrorMessage(error))
      return
    }

    // 2. Backend Response in UI-Format umwandeln
    const backendRide = mapBackendRideToCalendarRide(createdRide,fahrerListe)

// 3. UI mit echter DB-Fahrt updaten
    setCalendarRides((current) => [...current, backendRide])
    setRideInEditId(null)
    setIsRideDialogOpen(false)
  }

  const filteredCalendarRides = useMemo(() => {
    if (selectedFilter === 'Offene Fahrten') {
      return calendarRides.filter((ride) => ride.status !== 'assigned' && ride.status !== 'completed')
    }

    if (selectedFilter === 'Meine Fahrten') {
      if (currentDriverNames.length === 0) {
        return []
      }

      return calendarRides.filter((ride) => currentDriverNames.includes(normalizeName(ride.driverName)))
    }

    return calendarRides
  }, [calendarRides, currentDriverNames, selectedFilter])

  useEffect(() => {
    if (isGast && selectedFilter !== 'Alle Fahrten') {
      setSelectedFilter('Alle Fahrten')
      return
    }

    if (isDisponent && selectedFilter === 'Meine Fahrten') {
      setSelectedFilter('Alle Fahrten')
    }
  }, [isDisponent, isGast, selectedFilter])

  useEffect(() => {
    if (isFahrer) {
      setDayRole('fahrer')
    }
  }, [isFahrer])

  const ridesByDay = useMemo(() => {
    return filteredCalendarRides.reduce<Map<string, CalendarRide[]>>(
      (acc, ride) => {

        const addToDay = (date: Date) => {
          const key = toDateKey(date)
          const list = acc.get(key) ?? []
          acc.set(key, [...list, ride])
        }

        if (ride.type === 'rental' && ride.dateBis) {
          let current = normalizeDate(new Date(ride.date))
          const end = normalizeDate(new Date(ride.dateBis))

          while (current.getTime() <= end.getTime()) {
            addToDay(current)
            current = addDays(current, 1)
          }

          return acc
        }

        addToDay(ride.date)

        return acc
      },
      new Map(),
    )
  }, [filteredCalendarRides])

  const monthDays = useMemo(() => buildMonthDays(currentMonth), [currentMonth])
  const weekDaysData = useMemo(() => buildWeekDays(selectedDate), [selectedDate])
  const activeCalendarDays =
    selectedView === 'Monat'
      ? monthDays
      : selectedView === 'Woche'
        ? weekDaysData
        : [{ date: selectedDate, isCurrentMonth: true }]

  const monthHeading = formatMonthHeading(currentMonth)
  const dialogHeading = formatDialogHeading(selectedDate)
  const dayHeaderLabel = weekdayFormatter.format(selectedDate)
  const dayHeaderDateLabel = dayHeaderDateFormatter.format(selectedDate)
  const activeRideForm = rideType === 'rental' ? null : rideFormsByType[rideType]
  const selectedRideVehicle = activeRideForm == null
    ? null
    : visibleFahrzeuge.find((vehicle) => vehicle.id === activeRideForm.fahrzeugId) ?? null
  const maxPassengersForActiveRide = selectedRideVehicle?.kapazitaet ?? 0
  const isPassengerLimitReached = activeRideForm != null
    && activeRideForm.passengers.length >= maxPassengersForActiveRide
  const selectedDayRides = ridesByDay.get(toDateKey(selectedDate)) ?? []
  const hasDriverDayView = selectedDayRides.some((ride) => ride.type !== 'rental')
  const dayTimelineRides = useMemo(() => {
    const scheduledRides = selectedDayRides
      .map((ride) => {
        const timelineRange = getRideTimelineRange(ride, selectedDate)

        if (!timelineRange) {
          return null
        }

        return {
          ride,
          startMinutes: timelineRange.startMinutes,
          endMinutes: timelineRange.endMinutes,
        }
      })
      .filter((entry): entry is { ride: CalendarRide; startMinutes: number; endMinutes: number } => entry !== null)
      .sort((left, right) => left.startMinutes - right.startMinutes || left.ride.title.localeCompare(right.ride.title, 'de-DE'))

    return buildDayTimelineRideLayout(scheduledRides)
  }, [selectedDate, selectedDayRides])
  const dayTimelineUnscheduledRides = useMemo(() => {
    return selectedDayRides.filter((ride) => getRideTimelineRange(ride, selectedDate) === null)
  }, [selectedDate, selectedDayRides])

  useEffect(() => {
    if (!hasDriverDayView && dayRole === 'fahrer') {
      setDayRole('dispo')
      return
    }

    if (isFahrer && hasDriverDayView && dayRole !== 'fahrer') {
      setDayRole('fahrer')
    }
  }, [dayRole, hasDriverDayView, isFahrer])

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">
      <header className="border-b border-slate-200 bg-white/95 px-4 py-3 shadow-sm backdrop-blur sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsSideMenuOpen(true)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0053a0]/40"
              aria-label="Navigation öffnen"
            >
              <Menu className="h-5 w-5" aria-hidden="true" />
            </button>

            {visibleTopFilters.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {visibleTopFilters.map((filter) => (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => setSelectedFilter(filter)}
                    className={`rounded-2xl px-5 py-2 text-sm font-semibold transition ${
                      selectedFilter === filter
                        ? 'bg-slate-800 text-white shadow-[0_10px_25px_rgba(15,23,42,0.2)]'
                        : 'border border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            ) : null}

            {canManageInitiatives ? (
              <label className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600">
                Initiative
                <select
                  value={selectedInitiativeId ?? ''}
                  onChange={(event) => setSelectedInitiativeId(event.target.value ? Number(event.target.value) : null)}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 outline-none"
                >
                  {initiativeListe.length > 0 ? (
                    initiativeListe.map((initiative) => (
                      <option key={initiative.id} value={initiative.id}>
                        {initiative.name}
                      </option>
                    ))
                  ) : (
                    <option value="">Alle</option>
                  )}
                </select>
              </label>
            ) : null}
          </div>

          <UserMenuButton
            onClick={() => navigate(isGast ? '/dashboard' : '/profil')}
            icon={<CircleUserRound className="h-6 w-6" aria-hidden="true" />}
          />
        </div>
      </header>

      <div className="p-3 sm:p-4 lg:p-6">
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
          <div className="flex flex-wrap items-center justify-between gap-5 border-b border-slate-200 pb-4">
            <h1 className="text-5xl font-bold tracking-tight text-slate-800">{monthHeading}</h1>

            <div className="ml-auto flex flex-wrap items-center gap-3">
              <div className="inline-flex rounded-2xl bg-slate-100 p-1">
                {calendarViews.map((view) => (
                  <button
                    key={view}
                    type="button"
                    onClick={() => setSelectedView(view)}
                    className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                      selectedView === view
                        ? 'bg-white text-slate-700 shadow-sm'
                        : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    {view}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => shiftPeriod(-1)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-50"
                aria-label="Vorheriger Zeitraum"
              >
                <ChevronLeft className="h-4 w-4" aria-hidden="true" />
              </button>

              <button
                type="button"
                onClick={() => shiftPeriod(1)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-50"
                aria-label="Nächster Zeitraum"
              >
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </button>

              {isAdmin ? (
                <button
                  type="button"
                  onClick={() => navigate('/admin/benachrichtigungen')}
                  className="inline-flex items-center gap-2 rounded-2xl border border-[#0053a0]/20 bg-[#0053a0]/5 px-4 py-2.5 text-sm font-semibold text-[#0053a0] transition hover:bg-[#0053a0]/10"
                >
                  <Bell className="h-4 w-4" aria-hidden="true" />
                  Benachrichtigungen
                </button>
              ) : null}

              {isAdmin ? (
                <button
                  type="button"
                  onClick={() => navigate('/admin/einstellungen')}
                  className="inline-flex items-center gap-2 rounded-2xl border border-[#0053a0]/20 bg-[#0053a0]/5 px-4 py-2.5 text-sm font-semibold text-[#0053a0] transition hover:bg-[#0053a0]/10"
                >
                  <Settings className="h-4 w-4" aria-hidden="true" />
                  Einstellungen
                </button>
              ) : null}

              {!isRideCrudRestricted ? (
                <button
                  type="button"
                  onClick={openRideDialog}
                  className="inline-flex items-center gap-2 rounded-2xl bg-[#0053a0] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(0,83,160,0.35)] transition hover:brightness-105"
                >
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  Fahrt
                </button>
              ) : null}
            </div>
          </div>

          {selectedView === 'Tag' ? (
            <div className="mt-5">
              <div className="mb-4 text-center text-sm font-semibold capitalize text-slate-500">
                {dayHeaderLabel}, {dayHeaderDateLabel}
              </div>

              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                <div className="max-h-[70vh] overflow-y-auto">
                  <div className="grid grid-cols-[4.5rem_1fr]">
                    <div className="relative bg-white" style={{ height: `${DAY_TIMELINE_TOTAL_HEIGHT}px` }}>
                      {dayTimelineHourMarkers.map((hour) => (
                        <div
                          key={hour}
                          className="absolute right-3 -translate-y-1/2 text-xs font-semibold text-slate-400"
                          style={{ top: `${(hour * DAY_TIMELINE_HOUR_HEIGHT) + DAY_TIMELINE_VERTICAL_PADDING}px` }}
                        >
                          {formatHourLabel(hour)}
                        </div>
                      ))}
                    </div>

                    <div className="relative border-l border-slate-200 bg-slate-50/50" style={{ height: `${DAY_TIMELINE_TOTAL_HEIGHT}px` }}>
                      {dayTimelineHourMarkers.map((hour) => (
                        <div
                          key={hour}
                          className="absolute inset-x-0 border-t border-dashed border-slate-200"
                          style={{ top: `${(hour * DAY_TIMELINE_HOUR_HEIGHT) + DAY_TIMELINE_VERTICAL_PADDING}px` }}
                        />
                      ))}

                      {dayTimelineRides.map(({ ride, startMinutes, endMinutes, column, columnCount }) => {
                        const top = ((startMinutes / 60) * DAY_TIMELINE_HOUR_HEIGHT) + DAY_TIMELINE_VERTICAL_PADDING
                        const durationMinutes = Math.max(endMinutes - startMinutes, 45)
                        const height = Math.max((durationMinutes / 60) * DAY_TIMELINE_HOUR_HEIGHT, 44)
                        const columnGapPercent = columnCount > 1 ? 1.5 : 0
                        const widthPercent = (100 - (columnGapPercent * (columnCount - 1))) / columnCount
                        const leftPercent = column * (widthPercent + columnGapPercent)
                        const displayTime = getDayTimelineRideDisplayTime(ride, startMinutes, endMinutes)
                        const showFullRentalPeriod = ride.type === 'rental' && !!ride.dateBis && !isSameDay(ride.date, ride.dateBis)

                        return (
                          <button
                            key={ride.id}
                            type="button"
                            onClick={() => openDayDialog(ride.date)}
                            className="absolute overflow-hidden rounded-2xl border border-slate-200 bg-white/95 p-3 text-left shadow-[0_10px_24px_rgba(15,23,42,0.08)] transition hover:border-[#0053a0]/40 hover:bg-white"
                            style={{
                              top: `${top}px`,
                              left: `calc(${leftPercent}% + 0.5rem)`,
                              width: `calc(${widthPercent}% - 0.5rem)`,
                              height: `${height}px`,
                            }}
                            title={getDayTimelineRideTitle(ride, startMinutes, endMinutes)}
                          >
                            <div className="space-y-2">
                              <span className={`block rounded-full text-center font-semibold text-white ${statusMetadata[ride.status].color} ${
                                showFullRentalPeriod
                                  ? 'whitespace-normal break-words px-2 py-1 text-[9px] leading-tight'
                                  : 'truncate px-1.5 py-0.5 text-[9px] leading-none'
                              }`}>
                                {displayTime || '---'}
                              </span>
                              <div className="min-w-0">
                                <div className="truncate text-sm font-semibold text-slate-800">{ride.title}</div>
                                {ride.type !== 'rental' ? (
                                  <div className="mt-1 text-xs text-slate-500">{ride.passengers.length} Fahrgäste</div>
                                ) : null}
                              </div>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {dayTimelineUnscheduledRides.length > 0 ? (
                <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="text-sm font-semibold text-slate-700">Ohne Uhrzeit</div>
                  <div className="mt-3 space-y-2">
                    {dayTimelineUnscheduledRides.map((ride) => (
                      <button
                        key={ride.id}
                        type="button"
                        onClick={() => openDayDialog(ride.date)}
                        className="w-full rounded-xl bg-white px-3 py-2 text-left text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-100"
                        title={getRideCalendarTitle(ride)}
                      >
                        <span className={`block truncate rounded-full px-1.5 py-0.5 text-center text-[9px] font-semibold leading-none text-white ${statusMetadata[ride.status].color}`}>
                          Ohne Uhrzeit
                        </span>
                        <span className="mt-2 block min-w-0 truncate">{ride.title}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          ) : (
            <>
              <div className="mt-5 grid grid-cols-7 gap-2 text-center text-sm font-semibold text-slate-500">
                {weekDays.map((day) => (
                  <div key={day} className="py-2">
                    {day}
                  </div>
                ))}
              </div>

              <div className="grid gap-2 grid-cols-1 sm:grid-cols-7">
                {activeCalendarDays.map((day) => {
                  const isSelected = isSameDay(day.date, selectedDate)
                  const dayLabel = day.date.getDate().toString()
                  const ridesForDay = ridesByDay.get(toDateKey(day.date)) ?? []
                  const visibleMarkers = ridesForDay.slice(0, 3)

                  return (
                    <button
                      key={day.date.toISOString()}
                      type="button"
                      onClick={() => openDayDialog(day.date)}
                      className={`flex flex-col justify-between rounded-xl border px-3 py-2 text-left transition ${
                        selectedView === 'Monat'
                          ? 'h-20 sm:h-22 lg:h-24'
                          : 'min-h-28 sm:min-h-32'
                      } ${
                        day.isCurrentMonth
                          ? isSelected
                            ? 'border-[#0053a0] bg-[#0053a0]/10 shadow-[inset_0_0_0_1px_rgba(0,83,160,0.35)]'
                            : 'border-slate-200 bg-white hover:border-[#0053a0]/40 hover:bg-[#0053a0]/5'
                          : 'border-slate-200 bg-slate-50 text-slate-300'
                      }`}
                    >
                      <span
                        className={`text-sm font-semibold ${
                          day.isCurrentMonth
                            ? isSelected
                              ? 'text-[#0053a0]'
                              : 'text-slate-700'
                            : 'text-slate-400'
                        }`}
                      >
                        {dayLabel}
                      </span>

                      <div className="space-y-1">
                        {visibleMarkers.map((ride) => {
                          const rideDisplayTime = getRideCalendarDisplayTime(ride)

                          if (selectedView === 'Monat') {
                            return (
                              <span
                                key={ride.id}
                                className={`block truncate rounded-full px-1.5 py-0.5 text-center text-[9px] font-semibold leading-none text-white ${statusMetadata[ride.status].color}`}
                                title={getRideCalendarTitle(ride)}
                              >
                                {rideDisplayTime || '---'}
                              </span>
                            )
                          }

                          return (
                            <span
                              key={ride.id}
                              className="block rounded-lg bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-700"
                              title={getRideCalendarTitle(ride)}
                            >
                              {rideDisplayTime ? (
                                <span className={`block truncate rounded-full px-1.5 py-0.5 text-center text-[9px] font-semibold leading-none text-white ${statusMetadata[ride.status].color}`}>
                                  {rideDisplayTime}
                                </span>
                              ) : (
                                <span className={`block h-2 rounded-full ${statusMetadata[ride.status].color}`} />
                              )}
                              <span className="mt-1 block min-w-0 truncate">{ride.title}</span>
                            </span>
                          )
                        })}
                        {ridesForDay.length > visibleMarkers.length ? (
                          <span className="block text-[10px] font-semibold text-slate-400">
                            +{ridesForDay.length - visibleMarkers.length}
                          </span>
                        ) : null}
                      </div>
                    </button>
                  )
                })}
              </div>
            </>
          )}

          <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 border-t border-slate-200 pt-5">
            {statusLegend.map((status) => (
              <div key={status.label} className="inline-flex items-center gap-2 text-sm text-slate-500">
                <span className={`h-3 w-3 rounded-full ${status.color}`} />
                {status.label}
              </div>
            ))}
          </div>
        </section>
      </div>

      <button
        type="button"
        onClick={handleLogout}
        className="mb-6 ml-3 inline-flex items-center gap-2 rounded-2xl border border-rose-200 bg-white px-4 py-3 text-sm font-semibold text-rose-700 shadow-[0_12px_30px_rgba(15,23,42,0.12)] transition hover:bg-rose-50 sm:ml-4 lg:ml-6"
      >
        <LogOut className="h-4 w-4" aria-hidden="true" />
        Abmelden
      </button>

      {isSideMenuOpen ? (
        <div className="fixed inset-0 z-30 bg-slate-900/45 backdrop-blur-[2px]" onClick={closeSideMenu}>
          <aside
            className="h-full w-full max-w-sm bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
            aria-label="Seitliche Navigation"
          >
            <div className="flex items-center justify-between bg-[#0053a0] px-6 py-5 text-white">
              <h2 className="text-4xl font-semibold tracking-tight">Navigation</h2>
              <button
                type="button"
                onClick={closeSideMenu}
                className="inline-flex h-11 w-11 items-center justify-center rounded-xl text-white transition hover:bg-white/10"
                aria-label="Navigation schließen"
              >
                <X className="h-7 w-7" aria-hidden="true" />
              </button>
            </div>

            <div className="space-y-3 p-4">
              <button
                type="button"
                onClick={() => goToPage('/dashboard')}
                className="flex w-full items-center gap-3 rounded-2xl bg-[#0053a0] px-4 py-3 text-left text-lg font-medium text-white"
              >
                <Bus className="h-5 w-5" aria-hidden="true" />
                Dashboard
              </button>

              {!isFahrer && !isGast ? (
                <button
                  type="button"
                  onClick={() => goToPage('/fahrerinfos')}
                  className="flex w-full items-center gap-3 rounded-2xl bg-[#0053a0]/12 px-4 py-3 text-left text-lg font-medium text-[#0053a0]"
                >
                  <UserRound className="h-5 w-5" aria-hidden="true" />
                  Fahrerinfos
                </button>
              ) : null}

              {!isGast ? (
                <button
                  type="button"
                  onClick={() => goToPage('/fahrzeuginfos')}
                  className="flex w-full items-center gap-3 rounded-2xl bg-[#0053a0]/12 px-4 py-3 text-left text-lg font-medium text-[#0053a0]"
                >
                  <Bus className="h-5 w-5" aria-hidden="true" />
                  Fahrzeuginfos
                </button>
              ) : null}

              {!isFahrer && !isGast ? (
                <button
                  type="button"
                  onClick={() => goToPage('/fahrgastinfos')}
                  className="flex w-full items-center gap-3 rounded-2xl bg-[#0053a0]/12 px-4 py-3 text-left text-lg font-medium text-[#0053a0]"
                >
                  <UserRoundPlus className="h-5 w-5" aria-hidden="true" />
                  Fahrgastinfos
                </button>
              ) : null}

              {canManageInitiatives ? (
                <button
                  type="button"
                  onClick={() => goToPage('/initiativen')}
                  className="flex w-full items-center gap-3 rounded-2xl bg-[#0053a0]/12 px-4 py-3 text-left text-lg font-medium text-[#0053a0]"
                >
                  <MapPin className="h-5 w-5" aria-hidden="true" />
                  Initiativen
                </button>
              ) : null}


              {!isFahrer && !isGast ? (
                <button
                  type="button"
                  onClick={() => goToPage('/rollenverteilung')}
                  className="flex w-full items-center gap-3 rounded-2xl bg-[#0053a0]/12 px-4 py-3 text-left text-lg font-medium text-[#0053a0]"
                >
                  <Settings className="h-5 w-5" aria-hidden="true" />
                  Rollenverteilung
                </button>
              ) : null}
            </div>
          </aside>
        </div>
      ) : null}

      {!isGast && isDayDialogOpen ? (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
          onClick={closeDayDialog}
        >
          <section
            className="relative w-full max-w-4xl overflow-hidden rounded-3xl bg-white shadow-[0_35px_80px_rgba(15,23,42,0.4)]"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="bg-[#0053a0] px-6 py-5 text-white sm:px-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                    {dialogHeading}
                  </h2>
                  <p className="mt-1 text-base text-white/80">{selectedDayRides.length} Fahrten</p>
                </div>

                <div className="flex items-center gap-4">
                  {!hasDriverDayView ? (
                    <div className="inline-flex rounded-2xl bg-white/20 p-1">
                      <button
                        type="button"
                        className="rounded-xl bg-white px-4 py-1.5 text-sm font-semibold text-slate-700"
                        disabled
                      >
                        Übersicht
                      </button>
                    </div>
                  ) : isFahrer ? (
                    <div className="inline-flex rounded-2xl bg-white/20 p-1">
                      <button
                        type="button"
                        className="rounded-xl bg-white px-4 py-1.5 text-sm font-semibold text-slate-700"
                        disabled
                      >
                        Fahrer
                      </button>
                    </div>
                  ) : (
                    <div className="inline-flex rounded-2xl bg-white/20 p-1">
                      <button
                        type="button"
                        onClick={() => setDayRole('dispo')}
                        className={`rounded-xl px-4 py-1.5 text-sm font-semibold transition ${
                          dayRole === 'dispo'
                            ? 'bg-white text-slate-700'
                            : 'text-white/75 hover:text-white'
                        }`}
                      >
                        Dispo
                      </button>
                      <button
                        type="button"
                        onClick={() => setDayRole('fahrer')}
                        className={`rounded-xl px-4 py-1.5 text-sm font-semibold transition ${
                          dayRole === 'fahrer'
                            ? 'bg-white text-slate-700'
                            : 'text-white/75 hover:text-white'
                        }`}
                      >
                        Fahrer
                      </button>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={closeDayDialog}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-white transition hover:bg-white/10"
                    aria-label="Dialog schliessen"
                  >
                    <X className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>
              </div>
            </header>

            <div className="relative h-[460px] overflow-y-auto px-5 py-5 sm:px-8">
              {selectedDayRides.length === 0 ? (
                <div className="flex h-full items-center justify-center text-center text-slate-400">
                  <p className="text-4xl font-medium text-slate-400">
                    Keine Fahrten an diesem Tag
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedDayRides.map((ride) => (
                    <article key={ride.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                      {dayRole === 'fahrer' && ride.type !== 'rental' ? (
                        <>
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <h3 className="text-3xl font-semibold tracking-tight text-slate-800">{ride.title}</h3>
                              <p className="mt-1 text-lg text-slate-500">
                                {getRideTimeSummary(ride)}
                                <span className="mx-2 text-slate-300">•</span>
                                {ride.passengers.length} Fahrgäste
                                {ride.driverName ? (
                                  <>
                                    <span className="mx-2 text-slate-300">•</span>
                                    {ride.driverName}
                                  </>
                                ) : null}
                                {ride.createdByName ? (
                                  <>
                                    <span className="mx-2 text-slate-300">•</span>
                                    Erstellt von {ride.createdByName}
                                  </>
                                ) : null}
                              </p>
                            </div>

                            <div className="flex items-center gap-2">
                              <span className={`inline-flex items-center rounded-xl px-3 py-1 text-sm font-semibold text-white ${statusMetadata[ride.status].color}`}>
                                {statusMetadata[ride.status].label}
                              </span>
                              {canToggleDriverAssignment(ride) ? (
                                <button
                                  type="button"
                                  onClick={() => void toggleDriverSelfAssignment(ride)}
                                  className={`rounded-xl px-3 py-1 text-sm font-semibold transition ${
                                    ride.status === 'assigned'
                                      && normalizeName(ride.driverName) === normalizeName(currentDriverDisplayName)
                                      ? 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                                      : 'bg-[#0053a0] text-white hover:brightness-105'
                                  }`}
                                >
                                  {ride.status === 'assigned'
                                    && normalizeName(ride.driverName) === normalizeName(currentDriverDisplayName)
                                    ? 'Abmelden'
                                    : 'Anmelden'}
                                </button>
                              ) : null}
                              <button
                                type="button"
                                onClick={() => toggleDriverRideCollapsed(ride.id)}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100"
                                aria-label={collapsedDriverRideIds.includes(ride.id) ? 'Fahrt einklappen' : 'Fahrt ausklappen'}
                              >
                                {collapsedDriverRideIds.includes(ride.id) ? (
                                  <ChevronUp className="h-5 w-5" aria-hidden="true" />
                                ) : (
                                  <ChevronDown className="h-5 w-5" aria-hidden="true" />
                                )}
                              </button>
                            </div>
                          </div>

                          {collapsedDriverRideIds.includes(ride.id) ? (
                            <div className="mt-4 space-y-3 border-t border-slate-200 pt-3">
                              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Bemerkungen</div>
                                <div className="mt-2 whitespace-pre-line text-base leading-7 text-slate-700">{ride.remarks || '-'}</div>
                              </div>
                              {ride.passengers.length > 0 ? (
                                ride.passengers.map((passenger, passengerIndex) => {
                                  const canEditChecks = canManagePassengerChecks(ride)

                                  return (
                                    <div key={passenger.id} className={`rounded-2xl border border-slate-200 bg-white p-3 transition ${passenger.istAbgehakt ? 'opacity-70' : ''}`}>
                                      <div className="flex flex-wrap items-start justify-between gap-2">
                                        <label className="inline-flex items-center gap-2 text-2xl font-semibold text-slate-800">
                                          <input
                                            type="checkbox"
                                            checked={Boolean(passenger.istAbgehakt)}
                                            disabled={!canEditChecks}
                                            onChange={(event) => void togglePassengerCompleted(ride.id, passenger.id, event.target.checked)}
                                            className={`h-6 w-6 rounded-md border-slate-300 ${canEditChecks ? '' : 'cursor-not-allowed opacity-50'}`}
                                          />
                                          <span className={passenger.istAbgehakt ? 'line-through text-slate-400' : ''}>
                                            {passenger.name || `Fahrgast ${passengerIndex + 1}`}
                                          </span>
                                        </label>
                                        <span className="inline-flex items-center gap-1 rounded-xl bg-[#0053a0]/12 px-3 py-1 text-sm font-semibold text-[#0053a0]">
                                          <Clock3 className="h-4 w-4" aria-hidden="true" />
                                          {passenger.time || '-'} Uhr
                                        </span>
                                      </div>

                                      <div className="mt-3 grid gap-2 md:grid-cols-3">
                                        <div className="rounded-xl bg-slate-50 px-3 py-2">
                                          <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">Abholung</div>
                                          <div className="mt-1 text-lg font-medium text-slate-800">{passenger.pickupAddress || '-'}</div>
                                        </div>
                                        <div className="rounded-xl bg-slate-50 px-3 py-2">
                                          <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">Ziel</div>
                                          <div className="mt-1 text-lg font-medium text-slate-800">{passenger.destinationAddress || '-'}</div>
                                        </div>
                                        <div className="rounded-xl bg-slate-50 px-3 py-2">
                                          <div className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                                            <Phone className="h-3.5 w-3.5" aria-hidden="true" />
                                            Telefon
                                          </div>
                                          <div className="mt-1 text-lg font-medium text-slate-800">{passenger.phone || '-'}</div>
                                        </div>
                                      </div>
                                    </div>
                                  )
                                })
                              ) : (
                                <p className="text-sm text-slate-500">Keine Fahrgäste hinterlegt.</p>
                              )}
                            </div>
                          ) : null}
                        </>
                      ) : (
                        <>
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <h3 className="text-2xl font-semibold text-slate-800">{ride.title}</h3>
                              <p className="mt-1 text-base text-slate-500">
                                {getRideTimeSummary(ride)}
                              </p>
                            </div>
                            <span className={`inline-flex items-center rounded-xl px-3 py-1 text-sm font-semibold text-white ${statusMetadata[ride.status].color}`}>
                              {statusMetadata[ride.status].label}
                            </span>
                          </div>

                          <div className="mt-3 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
                            <div>
                              <span className="font-semibold text-slate-700">Fahrtart:</span> {ride.type === 'theme' ? 'Themenfahrt' : ride.type === 'rental' ? 'Vermietung' : 'Standardfahrt'}
                            </div>
                            {ride.type !== 'rental' ? (
                              <>
                                <div>
                                  <span className="font-semibold text-slate-700">Fahrgäste:</span> {ride.passengers.length}
                                </div>
                                <div>
                                  <span className="font-semibold text-slate-700">Fahrer:</span> {ride.driverName || '-'}
                                </div>
                              </>
                            ) : null}
                            <div>
                              <span className="font-semibold text-slate-700">Erstellt von:</span> {ride.createdByName || '-'}
                            </div>
                            <div className="sm:col-span-2">
                              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Bemerkungen</div>
                                <div className="mt-2 whitespace-pre-line text-base leading-7 text-slate-700">{ride.remarks || '-'}</div>
                              </div>
                            </div>
                          </div>

                          {ride.type !== 'rental' ? (
                            <div className="mt-3 border-t border-slate-200 pt-3">
                              <button
                                type="button"
                                onClick={() => toggleRideExpanded(ride.id)}
                                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                              >
                                {expandedRideIds.includes(ride.id) ? (
                                  <ChevronUp className="h-4 w-4" aria-hidden="true" />
                                ) : (
                                  <ChevronDown className="h-4 w-4" aria-hidden="true" />
                                )}
                                {expandedRideIds.includes(ride.id) ? 'Gäste ausblenden' : 'Alle Gäste anzeigen'}
                              </button>

                              {expandedRideIds.includes(ride.id) ? (
                                <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                                  <h4 className="text-sm font-semibold text-slate-700">Fahrgäste</h4>
                                  {ride.passengers.length > 0 ? (
                                    <ul className="mt-2 space-y-2">
                                      {ride.passengers.map((passenger, passengerIndex) => (
                                        <li key={passenger.id} className="rounded-lg border border-slate-200 bg-white p-2 text-sm text-slate-700">
                                          <div className="font-semibold text-slate-800">{passenger.name || `Fahrgast ${passengerIndex + 1}`}</div>
                                          <div className="mt-1 text-xs text-slate-500">
                                            Telefon: {passenger.phone || '-'} | Abholung: {passenger.pickupAddress || '-'} | Ziel: {passenger.destinationAddress || '-'} | Zeit: {passenger.time || '-'}
                                          </div>
                                        </li>
                                      ))}
                                    </ul>
                                  ) : (
                                    <p className="mt-2 text-sm text-slate-500">Keine Fahrgäste hinterlegt.</p>
                                  )}
                                </div>
                              ) : null}
                            </div>
                          ) : null}

                          {!(isFahrer && ride.type === 'rental') ? (
                            <div className="mt-3 flex flex-wrap justify-end gap-2 border-t border-slate-200 pt-3">
                              <button
                                type="button"
                                onClick={() => requestDeleteRide(ride)}
                                className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100"
                              >
                                Löschen
                              </button>
                              <button
                                type="button"
                                onClick={() => openEditRideDialog(ride)}
                                className="rounded-xl bg-[#0053a0] px-3 py-2 text-sm font-semibold text-white transition hover:brightness-105"
                              >
                                Bearbeiten
                              </button>
                            </div>
                          ) : null}
                        </>
                      )}
                    </article>
                  ))}
                </div>
              )}

              {!isRideCrudRestricted ? (
                <button
                  type="button"
                  onClick={openRideDialog}
                  className="sticky bottom-4 ml-auto mt-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-[#0053a0] text-white shadow-[0_14px_30px_rgba(0,83,160,0.45)] transition hover:brightness-110"
                  aria-label="Neue Fahrt erstellen"
                >
                  <Plus className="h-7 w-7" aria-hidden="true" />
                </button>
              ) : null}
            </div>

            {ridePendingDelete ? (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-900/45 p-4 backdrop-blur-[2px]">
                <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl">
                  <h3 className="text-xl font-semibold text-slate-800">Fahrt wirklich löschen?</h3>
                  <p className="mt-2 text-sm text-slate-600">
                    Die Fahrt <span className="font-semibold text-slate-800">{ridePendingDelete.title}</span> wird dauerhaft aus dem Kalender entfernt.
                  </p>

                  <div className="mt-5 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={cancelDeleteRide}
                      className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                    >
                      Abbrechen
                    </button>
                    <button
                      type="button"
                      onClick={confirmDeleteRide}
                      disabled={isRideCrudRestricted}
                      className="rounded-xl border border-rose-200 bg-rose-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-rose-700"
                    >
                      Endgültig löschen
                    </button>
                  </div>
                </section>
              </div>
            ) : null}
          </section>
        </div>
      ) : null}

      {isRideDialogOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/65 p-3 backdrop-blur-sm sm:p-4"
        >
          <section
            className="max-h-[96vh] w-full max-w-4xl overflow-hidden rounded-[1.75rem] bg-white shadow-[0_40px_100px_rgba(15,23,42,0.45)]"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="bg-[#0053a0] px-6 py-5 text-white sm:px-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-4xl font-semibold tracking-tight">
                    {rideInEditId !== null ? 'Fahrt bearbeiten' : 'Neue Fahrt erstellen'}
                  </h2>
                  <p className="mt-2 text-base text-white/80">{dialogHeading}</p>
                </div>

                <button
                  type="button"
                  onClick={closeRideDialog}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-white transition hover:bg-white/15"
                  aria-label="Dialog schliessen"
                >
                  <X className="h-7 w-7" aria-hidden="true" />
                </button>
              </div>
            </header>

            <div className="max-h-[calc(96vh-170px)] overflow-y-auto px-6 py-6 sm:px-8">
              {rideSaveError ? (
                <div className="mb-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                  {rideSaveError}
                </div>
              ) : null}

              {rideCapacityWarning ? (
                <div className="mb-5 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>{rideCapacityWarning}</span>
                </div>
              ) : null}

              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Fahrtart</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setRideType('standard')}
                    className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold transition ${rideTypeButtonClassName(rideType, 'standard')}`}
                  >
                    Standardfahrt
                  </button>
                  <button
                    type="button"
                    onClick={() => setRideType('theme')}
                    className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold transition ${rideTypeButtonClassName(rideType, 'theme')}`}
                  >
                    <Sparkles className="h-4 w-4" aria-hidden="true" />
                    Themenfahrt
                  </button>
                  <button
                    type="button"
                    onClick={() => setRideType('rental')}
                    className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold transition ${rideTypeButtonClassName(rideType, 'rental')}`}
                  >
                    Vermietung
                  </button>
                </div>
              </div>

              {rideType === 'theme' ? (
                <div className="mt-6 rounded-2xl border border-[#0053a0]/25 bg-[#0053a0]/8 p-4">
                  <label className="block text-sm font-semibold text-slate-700" htmlFor="theme-title">
                    Thema / Titel
                  </label>
                  <input
                    id="theme-title"
                    type="text"
                    value={activeRideForm?.themeTitle ?? ''}
                    onChange={(event) => updateRideField('themeTitle', event.target.value)}
                    placeholder="z. B. Weihnachtsmarkt-Tour"
                    className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#0053a0] focus:ring-4 focus:ring-[#0053a0]/15"
                  />
                  <label className="mt-4 block text-sm font-semibold text-slate-700" htmlFor="theme-destination">
                    Zieladresse
                  </label>
                  <input
                    id="theme-destination"
                    type="text"
                    value={activeRideForm?.themeDestination ?? ''}
                    onChange={(event) => updateRideField('themeDestination', event.target.value)}
                    placeholder="z. B. Marktplatz 1, Frankfurt"
                    className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#0053a0] focus:ring-4 focus:ring-[#0053a0]/15"
                  />
                </div>
              ) : null}

              {rideType === 'rental' ? (
                <div className="mt-6 rounded-2xl border border-[#0053a0]/25 bg-[#0053a0]/8 p-4">
                  <label htmlFor="rental-name" className="block text-sm font-semibold text-slate-700">
                    Name
                  </label>
                  <input
                    id="rental-name"
                    type="text"
                    value={rentalName}
                    onChange={(event) => setRentalName(event.target.value)}
                    placeholder="Name der Vermietung"
                    className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#0053a0] focus:ring-4 focus:ring-[#0053a0]/15"
                  />

                  <div className="mt-4">
                    <label htmlFor="rental-vehicle" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
                      <Bus className="h-4 w-4 text-[#0053a0]" aria-hidden="true" />
                      Fahrzeug
                    </label>

                    <select
                      id="rental-vehicle"
                      value={rideType === 'rental'
                          ? (rentalVehicleId ?? '')
                          : (activeRideForm?.fahrzeugId ?? '')
                            }
                      onChange={(event) => autofillFahrzeug(Number(event.target.value))}
                      className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-700 outline-none transition focus:border-[#0053a0] focus:ring-4 focus:ring-[#0053a0]/15"
                    >
                      <option value="">Fahrzeug auswählen</option>
                      {visibleFahrzeuge.map((vehicle) => (
                        <option key={vehicle.id} value={vehicle.id}>
                          {vehicle.kennzeichen} – {vehicle.bezeichnung} – {vehicle.kapazitaet} Plätze
                        </option>
                      ))}
                    </select>

                    {visibleFahrzeuge.length === 0 ? (
                      <p className="mt-2 text-sm text-amber-700">Kein Fahrzeug verfügbar.</p>
                    ) : visibleFahrzeuge.length === 1 ? (
                      <p className="mt-2 text-sm text-emerald-700">Ein Fahrzeug wurde automatisch vorausgewählt.</p>
                    ) : null}
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <label className="text-sm font-semibold text-slate-700">
                      Datum von
                      <input
                        type="date"
                        value={rentalDateFrom}
                        onChange={(event) => setRentalDateFrom(event.target.value)}
                        className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-700 outline-none"
                      />
                    </label>
                    <label className="text-sm font-semibold text-slate-700">
                      Datum bis
                      <input
                        type="date"
                        value={rentalDateTo}
                        onChange={(event) => setRentalDateTo(event.target.value)}
                        className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-700 outline-none"
                      />
                    </label>
                    <label className="text-sm font-semibold text-slate-700">
                      Uhrzeit von
                      <FiveMinuteTimeField
                        value={rentalTimeFrom}
                        onChange={setRentalTimeFrom}
                      />
                    </label>
                    <label className="text-sm font-semibold text-slate-700">
                      Uhrzeit bis
                      <FiveMinuteTimeField
                        value={rentalTimeTo}
                        onChange={setRentalTimeTo}
                      />
                    </label>
                  </div>
                </div>
              ) : (
                <>
                  <div className="mt-6">
                    <label htmlFor="vehicle-name" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
                      <Bus className="h-4 w-4 text-[#0053a0]" aria-hidden="true" />
                      Fahrzeug
                    </label>
                    <select
                      id="vehicle-name"
                      value={activeRideForm?.fahrzeugId ?? ''}
                      onChange={(event) => autofillFahrzeug(Number(event.target.value))}
                      className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-700 outline-none transition focus:border-[#0053a0] focus:ring-4 focus:ring-[#0053a0]/15"
                    >
                      <option value="">Fahrzeug auswählen</option>
                      {visibleFahrzeuge.map((vehicle) => (
                        <option key={vehicle.id} value={vehicle.id}>
                          {vehicle.kennzeichen} – {vehicle.bezeichnung} – {vehicle.kapazitaet} Plätze
                        </option>
                      ))}
                    </select>
                    {visibleFahrzeuge.length === 0 ? (
                      <p className="mt-2 text-sm text-amber-700">Kein Fahrzeug verfügbar.</p>
                    ) : visibleFahrzeuge.length === 1 ? (
                      <p className="mt-2 text-sm text-emerald-700">Ein Fahrzeug wurde automatisch vorausgewählt.</p>
                    ) : null}
                  </div>

                  <div className="mt-6">
                    <label htmlFor="driver-name" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
                      <UserRound className="h-4 w-4 text-[#0053a0]" aria-hidden="true" />
                      Fahrer (max. 1)
                    </label>
                    <input
                      id="driver-name"
                      type="text"
                      value={activeRideForm?.driverName ?? ''}
                      onChange={(event) => updateRideField('driverName', event.target.value)}
                      placeholder="Name des Fahrers"
                      className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#0053a0] focus:ring-4 focus:ring-[#0053a0]/15"
                    />
                    {(activeRideForm?.driverName ?? '').trim().length > 0 ? (
                      <div className="mt-1 max-h-44 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-sm">
                        {fahrerListe
                          .filter((driver) => {
                            const query = activeRideForm.driverName.trim().toLowerCase()

                            const searchable =
                              `${driver.name} ${driver.telefonnummer ?? ''}`.toLowerCase()

                            return searchable.includes(query)
                          })
                          .slice(0, 6)
                          .map((driver) => (
                            <button
                              key={driver.fahrerId}
                              type="button"
                              onClick={() => autofillFahrer(driver.fahrerId)}
                              className="flex w-full flex-col items-start border-b border-slate-100 px-3 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-50 last:border-b-0"
                            >
                              <span className="font-semibold text-slate-800">
                                {driver.name}
                              </span>

                              <span className="text-xs text-slate-500">
                                {driver.telefonnummer ?? 'Keine Telefonnummer'}
                              </span>
                            </button>
                          ))}
                      </div>
                    ) : null}
                  </div>

                  <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50/50 p-3">
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                      <p className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
                        <Users className="h-4 w-4 text-[#0053a0]" aria-hidden="true" />
                        {rideType === 'theme'
                          ? `Fahrgäste Themenfahrt (max. ${maxPassengersForActiveRide || 'Fahrzeugkapazität'})`
                          : `Fahrgäste (max. ${maxPassengersForActiveRide || 'Fahrzeugkapazität'})`}
                      </p>
                    </div>

                    <div className="space-y-3">
                      {activeRideForm?.passengers.map((passenger, passengerIndex) => (
                        <div key={passenger.id} className="rounded-xl border border-slate-200 bg-white p-3">
                          <div className="mb-2 flex items-center justify-between gap-2">
                            <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                              Fahrgast {passengerIndex + 1}
                            </div>
                            <button
                              type="button"
                              onClick={() => removePassengerField(passenger.id)}
                              className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2 py-1 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
                            >
                              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                              Entfernen
                            </button>
                          </div>
                          <div className="grid gap-2 sm:grid-cols-2">
                            <div className="relative sm:col-span-2">
                              <input
                                type="text"
                                value={passenger.name ?? ''}
                                onChange={(event) => updatePassengerField(passenger.id, 'name', event.target.value)}
                                placeholder="Name des Fahrgasts (z. B. Max)"
                                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#0053a0] focus:ring-2 focus:ring-[#0053a0]/15"
                              />

                              {(passenger.name ?? '').trim().length > 0 ? (
                                <div className="mt-1 max-h-44 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-sm">
                                  {knownGuests
                                    .filter((guest) => guest.aktiv)
                                    .filter((guest) => {
                                      const query = (passenger.name ?? '').trim().toLowerCase()
                                      const searchable = `${guest.vorname ?? ''} ${guest.nachname ?? ''} ${guest.adresse ?? ''} ${guest.telefonnummer ?? ''}`.toLowerCase()
                                      return searchable.includes(query)
                                    })
                                    .slice(0, 6)
                                    .map((guest) => (
                                      <button
                                        key={guest.id}
                                        type="button"
                                        onClick={() => autofillPassengerFromKnownGuest(passenger.id, guest.id)}
                                        className="flex w-full flex-col items-start border-b border-slate-100 px-3 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-50 last:border-b-0"
                                      >
                                        <span className="font-semibold text-slate-800">{`${guest.vorname ?? ''} ${guest.nachname ?? ''}`.trim()}</span>
                                        <span className="text-xs text-slate-500">{guest.adresse ?? ''}</span>
                                      </button>
                                    ))}
                                </div>
                              ) : null}
                            </div>
                            {passenger.sourceGuestId == null ? (
                              <label className="sm:col-span-2 flex items-center gap-3 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-600">
                                <input
                                  type="checkbox"
                                  checked={Boolean(passenger.saveAsGuest)}
                                  onChange={(event) => updatePassengerSaveAsGuest(passenger.id, event.target.checked)}
                                  className="h-4 w-4 rounded border-slate-300"
                                />
                                Als Stammgast speichern
                              </label>
                            ) : (
                              <div className="sm:col-span-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-medium text-emerald-700">
                                Stammgast ausgewählt
                              </div>
                            )}
                            <input
                              type="text"
                              value={passenger.phone ?? ''}
                              onChange={(event) => updatePassengerField(passenger.id, 'phone', event.target.value)}
                              placeholder="Telefonnummer"
                              className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#0053a0] focus:ring-2 focus:ring-[#0053a0]/15"
                            />
                            <label className="flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-500">
                              <MapPin className="h-4 w-4 text-[#0053a0]" aria-hidden="true" />
                              <input
                                type="text"
                                value={passenger.pickupAddress ?? ''}
                                onChange={(event) => updatePassengerField(passenger.id, 'pickupAddress', event.target.value)}
                                placeholder="Abholadresse"
                                className="w-full bg-transparent text-slate-700 outline-none placeholder:text-slate-400"
                              />
                            </label>
                            {rideType === 'theme' ? null : (
                              <label className="flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-500">
                                <MapPin className="h-4 w-4 text-[#2f73b3]" aria-hidden="true" />
                                <input
                                  type="text"
                                  value={passenger.destinationAddress ?? ''}
                                  onChange={(event) => updatePassengerField(passenger.id, 'destinationAddress', event.target.value)}
                                  placeholder="Zieladresse"
                                  className="w-full bg-transparent text-slate-700 outline-none placeholder:text-slate-400"
                                />
                              </label>
                            )}
                            <label className="sm:col-span-2 flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-500">
                              <FiveMinuteTimeField
                                value={passenger.time ?? ''}
                                onChange={(nextValue) => updatePassengerField(passenger.id, 'time', nextValue)}
                                wrapperClassName="grid w-full grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2"
                                fieldClassName="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-700 outline-none"
                              />
                            </label>
                          </div>
                        </div>
                      ))}

                      {(activeRideForm?.passengers.length ?? 0) === 0 ? (
                        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-500">
                          Noch keine Fahrgäste hinzugefügt.
                        </div>
                      ) : null}
                    </div>

                    <div className="mt-3 flex justify-start">
                      <button
                        type="button"
                        onClick={addPassengerField}
                        disabled={selectedRideVehicle == null || isPassengerLimitReached}
                        className="rounded-xl bg-[#0053a0]/12 px-3 py-1.5 text-sm font-semibold text-[#0053a0] transition hover:bg-[#0053a0]/20 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        + Fahrgast hinzufügen
                      </button>
                    </div>
                  </div>
                </>
              )}

              <div className="mt-6">
                <label htmlFor="ride-remarks" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <span className="inline-block h-3 w-3 rounded-sm border border-[#0053a0]" />
                  Bemerkungen
                </label>
                <textarea
                  id="ride-remarks"
                  rows={4}
                  value={rideType === 'rental' ? rentalRemarks : activeRideForm?.remarks ?? ''}
                  onChange={(event) => {
                    if (rideType === 'rental') {
                      setRentalRemarks(event.target.value)
                      return
                    }

                    updateRideField('remarks', event.target.value)
                  }}
                  placeholder={remarksPlaceholder}
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#0053a0] focus:ring-4 focus:ring-[#0053a0]/15"
                />
              </div>
            </div>

            <footer className="flex flex-wrap items-center justify-end gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4 sm:px-8">
              <button
                type="button"
                onClick={closeRideDialog}
                className="rounded-2xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-500 transition hover:bg-slate-100"
              >
                Abbrechen
              </button>
              <button
                type="button"
                onClick={() => saveRide('saved')}
                disabled={isRideCrudRestricted}
                className="rounded-2xl border border-[#0053a0]/30 bg-[#0053a0]/8 px-5 py-2.5 text-sm font-semibold text-[#0053a0] transition hover:bg-[#0053a0]/15"
              >
                {rideInEditId !== null ? 'Änderung speichern' : 'Fahrt Speichern'}
              </button>
              <button
                type="button"
                onClick={() => saveRide()}
                disabled={isRideCrudRestricted}
                className="rounded-2xl bg-[#0053a0] px-5 py-2.5 text-sm font-semibold text-white transition hover:brightness-105"
              >
                {rideInEditId !== null ? 'Änderungen übernehmen' : 'Fahrt erstellen'}
              </button>
            </footer>
          </section>
        </div>
      ) : null}
    </main>
  )
}

export default DashboardPage
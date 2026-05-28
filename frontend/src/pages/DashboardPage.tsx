import { useEffect, useMemo, useState } from 'react'
import {
  Bus,
  Clock3,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  CircleUserRound,
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
import { loadDashboardState, saveDashboardState } from '../services/dashboardState'
import { getFahrgaeste } from '../services/fahrgastApi'
import type { CalendarRide, PassengerForm, RideStatus, RideType } from '../types/DashboardRide'
import type { Fahrgast } from '../types/Fahrgast'

type RideFormType = 'standard' | 'theme'
type DayRole = 'dispo' | 'fahrer'
type CalendarView = 'Monat' | 'Woche' | 'Tag'

type RideFormState = {
  driverName: string
  themeTitle: string
  remarks: string
  passengers: PassengerForm[]
}

type CalendarDay = {
  date: Date
  isCurrentMonth: boolean
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

const dateInputFormatter = new Intl.DateTimeFormat('en-CA')

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

  return driverName.trim() ? 'assigned' : 'open'
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
    name: '',
    phone: '',
    pickupAddress: '',
    destinationAddress: '',
    time: '',
  }
}

function createInitialRideForms() {
  return {
    standard: {
      driverName: '',
      themeTitle: '',
      remarks: '',
      passengers: [createEmptyPassenger(1)],
    },
    theme: {
      driverName: '',
      themeTitle: '',
      remarks: '',
      passengers: [createEmptyPassenger(1)],
    },
  } satisfies Record<RideFormType, RideFormState>
}

function DashboardPage() {
  const navigate = useNavigate()
  const { currentUser } = useAuth()
  const { canManageDataCrud, isDisponent, isFahrer, isGast } = useRoleVisibility()
  const isRideCrudRestricted = !canManageDataCrud
  const visibleTopFilters = isDisponent
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
  const [calendarRides, setCalendarRides] = useState<CalendarRide[]>([])
  const [rideInEditId, setRideInEditId] = useState<number | null>(null)
  const [ridePendingDelete, setRidePendingDelete] = useState<CalendarRide | null>(null)
  const [expandedRideIds, setExpandedRideIds] = useState<number[]>([])
  const [collapsedDriverRideIds, setCollapsedDriverRideIds] = useState<number[]>([])
  const [completedPassengerKeys, setCompletedPassengerKeys] = useState<string[]>([])
  const [nextRideId, setNextRideId] = useState(1)
  const [nextPassengerId, setNextPassengerId] = useState(2)
  const [isDashboardHydrated, setIsDashboardHydrated] = useState(false)
  const [knownGuests, setKnownGuests] = useState<Fahrgast[]>([])

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

  useEffect(() => {
    let isCancelled = false

    async function hydrateDashboard() {
      const snapshot = await loadDashboardState()

      if (isCancelled) {
        return
      }

      setCalendarRides(snapshot.rides)
      setCompletedPassengerKeys(snapshot.completedPassengerKeys)
      setNextRideId(snapshot.nextRideId)
      setIsDashboardHydrated(true)
    }

    void hydrateDashboard()

    return () => {
      isCancelled = true
    }
  }, [])

  useEffect(() => {
    let isCancelled = false

    async function loadKnownGuests() {
      try {
        const guests = await getFahrgaeste()

        if (!isCancelled) {
          setKnownGuests(guests)
        }
      } catch {
        if (!isCancelled) {
          setKnownGuests([])
        }
      }
    }

    void loadKnownGuests()

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
      completedPassengerKeys,
      nextRideId,
    })
  }, [calendarRides, completedPassengerKeys, isDashboardHydrated, nextRideId])

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
    setNextPassengerId(2)
    setIsRideDialogOpen(true)
  }

  function closeRideDialog() {
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

  function toggleDriverSelfAssignment(rideId: number) {
    const driverIdentity = currentDriverDisplayName || currentUser?.username || currentUser?.email || ''

    if (!driverIdentity) {
      return
    }

    setCalendarRides((currentRides) =>
      currentRides.map((ride) => {
        if (ride.id !== rideId) {
          return ride
        }

        const isAssignedToCurrentDriver = ride.status === 'assigned'
          && normalizeName(ride.driverName) === normalizeName(driverIdentity)

        if (isAssignedToCurrentDriver) {
          return {
            ...ride,
            driverName: '',
            status: getDefaultRideStatusForOpenRide(ride),
          }
        }

        return {
          ...ride,
          driverName: driverIdentity,
          status: ride.type === 'rental' ? 'rental' : ride.type === 'theme' ? 'theme' : 'assigned',
        }
      }),
    )
  }

  function canToggleDriverAssignment(ride: CalendarRide) {
    const driverIdentity = currentDriverDisplayName || currentUser?.username || currentUser?.email || ''
    const isAssignedToCurrentDriver = Boolean(driverIdentity)
      && ride.status === 'assigned'
      && normalizeName(ride.driverName) === normalizeName(driverIdentity)

    return ride.status === 'open' || isAssignedToCurrentDriver
  }

  function buildPassengerKey(rideId: number, passengerId: number) {
    return `${rideId}:${passengerId}`
  }

  function togglePassengerCompleted(rideId: number, passengerId: number) {
    const key = buildPassengerKey(rideId, passengerId)

    setCompletedPassengerKeys((current) => {
      const next = current.includes(key)
        ? current.filter((entry) => entry !== key)
        : [...current, key]

      setCalendarRides((currentRides) =>
        currentRides.map((ride) => {
          if (ride.id !== rideId || ride.passengers.length === 0) {
            return ride
          }

          const allPassengersCompleted = ride.passengers.every((passenger) =>
            next.includes(buildPassengerKey(ride.id, passenger.id)),
          )

          if (allPassengersCompleted) {
            return {
              ...ride,
              status: 'completed',
            }
          }

          if (ride.status === 'completed') {
            return {
              ...ride,
              status: getDefaultRideStatusForOpenRide(ride),
            }
          }

          return ride
        }),
      )

      return next
    })
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
      const [timeFrom, timeTo] = ride.time.split('-')
      setRentalName(ride.title)
      setRentalRemarks(ride.remarks)
      setRentalDateFrom(rideDateValue)
      setRentalDateTo(rideDateValue)
      setRentalTimeFrom((timeFrom ?? '').trim())
      setRentalTimeTo((timeTo ?? '').trim())
      setRideFormsByType(createInitialRideForms())
      setNextPassengerId(2)
      setIsRideDialogOpen(true)
      return
    }

    const seededForms = createInitialRideForms()
    const passengersForEdit = ride.passengers.length > 0
      ? ride.passengers
      : [createEmptyPassenger(1)]

    seededForms[ride.type] = {
      driverName: ride.driverName,
      themeTitle: ride.type === 'theme' ? ride.title : '',
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
    setNextPassengerId(passengersForEdit.reduce((maxId, passenger) => Math.max(maxId, passenger.id), 0) + 1)
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

  function confirmDeleteRide() {
    if (isRideCrudRestricted) {
      return
    }

    if (!ridePendingDelete) {
      return
    }

    const rideId = ridePendingDelete.id

    setCalendarRides((currentRides) => currentRides.filter((ride) => ride.id !== rideId))
    setCompletedPassengerKeys((current) => current.filter((entry) => !entry.startsWith(`${rideId}:`)))

    if (rideInEditId === rideId) {
      setRideInEditId(null)
    }

    setRidePendingDelete(null)
  }

  function addPassengerField() {
    if (rideType === 'rental') {
      return
    }

    const currentPassengers = rideFormsByType[rideType].passengers

    if (currentPassengers.length >= 8) {
      return
    }

    setRideFormsByType((currentState) => ({
      ...currentState,
      [rideType]: {
        ...currentState[rideType],
        passengers: [...currentState[rideType].passengers, createEmptyPassenger(nextPassengerId)],
      },
    }))
    setNextPassengerId((currentNextPassengerId) => currentNextPassengerId + 1)
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
      },
    }))
  }

  function updatePassengerField(
    passengerId: number,
    field: keyof Omit<PassengerForm, 'id' | 'sourceGuestId'>,
    value: string,
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
                [field]: value,
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
            }
          }

          return {
            ...passenger,
            sourceGuestId: selectedGuestId,
            name: `${selectedGuest.vorname} ${selectedGuest.nachname}`.trim(),
            phone: selectedGuest.telefonnummer || '',
            pickupAddress: selectedGuest.adresse || '',
          }
        }),
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

  function saveRide(statusOverride?: RideStatus) {
    if (isRideCrudRestricted) {
      return
    }

    if (rideType === 'rental') {
      const rideTime = rentalTimeFrom && rentalTimeTo ? `${rentalTimeFrom}-${rentalTimeTo}` : rentalTimeFrom || rentalTimeTo

      if (rideInEditId !== null) {
        const editedDate = normalizeDate(new Date(rentalDateFrom || toDateInputValue(selectedDate)))
        setCalendarRides((currentRides) =>
          currentRides.map((ride) =>
            ride.id === rideInEditId
              ? {
                  ...ride,
                  date: editedDate,
                  type: 'rental',
                  status: statusOverride ?? 'rental',
                  title: rentalName.trim() || 'Vermietung',
                  time: rideTime,
                  driverName: '',
                  passengers: [],
                  remarks: rentalRemarks.trim(),
                }
              : ride,
          ),
        )
        setCompletedPassengerKeys((current) => current.filter((entry) => !entry.startsWith(`${rideInEditId}:`)))
        setExpandedRideIds((current) => current.filter((id) => id !== rideInEditId))
        setCurrentMonth(new Date(editedDate.getFullYear(), editedDate.getMonth(), 1))
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

      const nextRides: CalendarRide[] = []
      let currentDate = startDate
      let currentRideId = nextRideId

      while (currentDate.getTime() <= endDate.getTime()) {
        nextRides.push({
          id: currentRideId,
          date: normalizeDate(currentDate),
          type: 'rental',
          status: statusOverride ?? 'rental',
          title: rentalName.trim() || 'Vermietung',
          time: rideTime,
          driverName: '',
          passengers: [],
          remarks: rentalRemarks.trim(),
        })
        currentDate = addDays(currentDate, 1)
        currentRideId += 1
      }

      if (nextRides.length > 0) {
        setCalendarRides((current) => [...current, ...nextRides])
        setNextRideId(currentRideId)
      }

      setSelectedDate(startDate)
      setCurrentMonth(new Date(startDate.getFullYear(), startDate.getMonth(), 1))
      setRideInEditId(null)
      setIsRideDialogOpen(false)
      return
    }

    const activeForm = rideFormsByType[rideType]
    const firstPassenger = activeForm.passengers[0]
    const driverName = activeForm.driverName.trim()
    const passengers = activeForm.passengers.map((passenger, index) => ({
      ...passenger,
      id: index + 1,
    }))

    if (rideInEditId !== null) {
      setCalendarRides((currentRides) =>
        currentRides.map((ride) => {
          if (ride.id !== rideInEditId) {
            return ride
          }

          const baseStatus =
            statusOverride
            ?? (ride.type === 'theme' ? 'theme' : getRideStatusByType(rideType, driverName))

          return {
            ...ride,
            date: normalizeDate(selectedDate),
            type: rideType,
            status: baseStatus,
            title:
              rideType === 'theme'
                ? activeForm.themeTitle.trim() || 'Themenfahrt'
                : 'Standardfahrt',
            time: firstPassenger?.time ?? '',
            driverName,
            passengers,
            remarks: activeForm.remarks.trim(),
          }
        }),
      )
      setCompletedPassengerKeys((current) => current.filter((entry) => !entry.startsWith(`${rideInEditId}:`)))

      setRideInEditId(null)
      setIsRideDialogOpen(false)
      return
    }

    const baseStatus = statusOverride ?? getRideStatusByType(rideType, driverName)

    const nextRide: CalendarRide = {
      id: nextRideId,
      date: normalizeDate(selectedDate),
      type: rideType,
      status: baseStatus,
      title:
        rideType === 'theme'
          ? activeForm.themeTitle.trim() || 'Themenfahrt'
          : 'Standardfahrt',
      time: firstPassenger?.time ?? '',
      driverName,
      passengers,
      remarks: activeForm.remarks.trim(),
    }

    setCalendarRides((current) => [...current, nextRide])
    setNextRideId((currentId) => currentId + 1)
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
    if (isDisponent && selectedFilter === 'Meine Fahrten') {
      setSelectedFilter('Alle Fahrten')
    }
  }, [isDisponent, selectedFilter])

  useEffect(() => {
    if (isFahrer) {
      setDayRole('fahrer')
    }
  }, [isFahrer])

  const ridesByDay = useMemo(() => {
    return filteredCalendarRides.reduce<Map<string, CalendarRide[]>>((accumulator, ride) => {
      const rideDateKey = toDateKey(ride.date)
      const currentRidesForDay = accumulator.get(rideDateKey) ?? []
      accumulator.set(rideDateKey, [...currentRidesForDay, ride])
      return accumulator
    }, new Map())
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
  const activeRideForm = rideType === 'rental' ? null : rideFormsByType[rideType]
  const selectedDayRides = ridesByDay.get(toDateKey(selectedDate)) ?? []

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
            <div className="mt-5 grid grid-cols-1 gap-2 text-center text-sm font-semibold text-slate-500">
              <div className="py-2 capitalize">{dayHeaderLabel}</div>
            </div>
          ) : (
            <div className="mt-5 grid grid-cols-7 gap-2 text-center text-sm font-semibold text-slate-500">
              {weekDays.map((day) => (
                <div key={day} className="py-2">
                  {day}
                </div>
              ))}
            </div>
          )}

          <div className={`grid gap-2 ${selectedView === 'Tag' ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-7'}`}>
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
                  className={`flex h-20 flex-col justify-between rounded-xl border px-3 py-2 text-left transition sm:h-22 lg:h-24 ${
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
                    {visibleMarkers.map((ride) => (
                      <span
                        key={ride.id}
                        className={`block h-1.5 rounded-full ${statusMetadata[ride.status].color}`}
                        title={`${ride.title} (${statusMetadata[ride.status].label})`}
                      />
                    ))}
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

              {!isFahrer && !isGast ? (
                <button
                  type="button"
                  onClick={() => goToPage('/initiativen')}
                  className="flex w-full items-center gap-3 rounded-2xl bg-[#0053a0]/12 px-4 py-3 text-left text-lg font-medium text-[#0053a0]"
                >
                  <MapPin className="h-5 w-5" aria-hidden="true" />
                  Initiativen
                </button>
              ) : null}


              {!isDisponent && !isFahrer && !isGast ? (
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
                  {isFahrer ? (
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
                      {dayRole === 'fahrer' ? (
                        <>
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <h3 className="text-3xl font-semibold tracking-tight text-slate-800">{ride.title}</h3>
                              <p className="mt-1 text-lg text-slate-500">
                                {ride.time ? `${ride.time} Uhr` : 'Keine Uhrzeit'}
                                <span className="mx-2 text-slate-300">•</span>
                                {ride.passengers.length} Fahrgäste
                                {ride.driverName ? (
                                  <>
                                    <span className="mx-2 text-slate-300">•</span>
                                    {ride.driverName}
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
                                  onClick={() => toggleDriverSelfAssignment(ride.id)}
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
                              {ride.passengers.length > 0 ? (
                                ride.passengers.map((passenger) => (
                                  <div key={passenger.id} className={`rounded-2xl border border-slate-200 bg-white p-3 transition ${completedPassengerKeys.includes(buildPassengerKey(ride.id, passenger.id)) ? 'opacity-70' : ''}`}>
                                    <div className="flex flex-wrap items-start justify-between gap-2">
                                      <label className="inline-flex items-center gap-2 text-2xl font-semibold text-slate-800">
                                        <input
                                          type="checkbox"
                                          checked={completedPassengerKeys.includes(buildPassengerKey(ride.id, passenger.id))}
                                          onChange={() => togglePassengerCompleted(ride.id, passenger.id)}
                                          className="h-6 w-6 rounded-md border-slate-300"
                                        />
                                        <span className={completedPassengerKeys.includes(buildPassengerKey(ride.id, passenger.id)) ? 'line-through text-slate-400' : ''}>
                                          {passenger.name || `Fahrgast ${passenger.id}`}
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
                                ))
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
                                {ride.time ? `${ride.time} Uhr` : 'Keine Uhrzeit'}
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
                            <div>
                              <span className="font-semibold text-slate-700">Fahrgäste:</span> {ride.passengers.length}
                            </div>
                            <div>
                              <span className="font-semibold text-slate-700">Fahrer:</span> {ride.driverName || '-'}
                            </div>
                            <div>
                              <span className="font-semibold text-slate-700">Bemerkungen:</span> {ride.remarks || '-'}
                            </div>
                          </div>

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
                                    {ride.passengers.map((passenger) => (
                                      <li key={passenger.id} className="rounded-lg border border-slate-200 bg-white p-2 text-sm text-slate-700">
                                        <div className="font-semibold text-slate-800">{passenger.name || `Fahrgast ${passenger.id}`}</div>
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
          onClick={closeRideDialog}
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
                      <input
                        type="time"
                        value={rentalTimeFrom}
                        onChange={(event) => setRentalTimeFrom(event.target.value)}
                        className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-700 outline-none"
                      />
                    </label>
                    <label className="text-sm font-semibold text-slate-700">
                      Uhrzeit bis
                      <input
                        type="time"
                        value={rentalTimeTo}
                        onChange={(event) => setRentalTimeTo(event.target.value)}
                        className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-700 outline-none"
                      />
                    </label>
                  </div>
                </div>
              ) : (
                <>
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
                  </div>

                  <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50/50 p-3">
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                      <p className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
                        <Users className="h-4 w-4 text-[#0053a0]" aria-hidden="true" />
                        {rideType === 'theme' ? 'Fahrgäste Themenfahrt (max. 8)' : 'Fahrgäste (max. 8)'}
                      </p>
                      <button
                        type="button"
                        onClick={addPassengerField}
                        disabled={(activeRideForm?.passengers.length ?? 0) >= 8}
                        className="rounded-xl bg-[#0053a0]/12 px-3 py-1.5 text-sm font-semibold text-[#0053a0] transition hover:bg-[#0053a0]/20 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        + Fahrgast hinzufügen
                      </button>
                    </div>

                    <div className="space-y-3">
                      {activeRideForm?.passengers.map((passenger) => (
                        <div key={passenger.id} className="rounded-xl border border-slate-200 bg-white p-3">
                          <div className="mb-2 flex items-center justify-between gap-2">
                            <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                              Fahrgast {passenger.id}
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
                                value={passenger.name}
                                onChange={(event) => updatePassengerField(passenger.id, 'name', event.target.value)}
                                placeholder="Name des Fahrgasts (z. B. Max)"
                                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#0053a0] focus:ring-2 focus:ring-[#0053a0]/15"
                              />

                              {passenger.name.trim().length > 0 ? (
                                <div className="mt-1 max-h-44 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-sm">
                                  {knownGuests
                                    .filter((guest) => {
                                      const query = passenger.name.trim().toLowerCase()
                                      const searchable = `${guest.vorname} ${guest.nachname} ${guest.adresse} ${guest.telefonnummer}`.toLowerCase()
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
                                        <span className="font-semibold text-slate-800">{`${guest.vorname} ${guest.nachname}`.trim()}</span>
                                        <span className="text-xs text-slate-500">{guest.adresse}</span>
                                      </button>
                                    ))}
                                </div>
                              ) : null}
                            </div>
                            <input
                              type="text"
                              value={passenger.phone}
                              onChange={(event) => updatePassengerField(passenger.id, 'phone', event.target.value)}
                              placeholder="Telefonnummer"
                              className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#0053a0] focus:ring-2 focus:ring-[#0053a0]/15"
                            />
                            <label className="flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-500">
                              <MapPin className="h-4 w-4 text-[#0053a0]" aria-hidden="true" />
                              <input
                                type="text"
                                value={passenger.pickupAddress}
                                onChange={(event) => updatePassengerField(passenger.id, 'pickupAddress', event.target.value)}
                                placeholder="Abholadresse"
                                className="w-full bg-transparent text-slate-700 outline-none placeholder:text-slate-400"
                              />
                            </label>
                            <label className="flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-500">
                              <MapPin className="h-4 w-4 text-[#2f73b3]" aria-hidden="true" />
                              <input
                                type="text"
                                value={passenger.destinationAddress}
                                onChange={(event) => updatePassengerField(passenger.id, 'destinationAddress', event.target.value)}
                                placeholder="Zieladresse"
                                className="w-full bg-transparent text-slate-700 outline-none placeholder:text-slate-400"
                              />
                            </label>
                            <label className="sm:col-span-2 flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-500">
                              <input
                                type="time"
                                value={passenger.time}
                                onChange={(event) => updatePassengerField(passenger.id, 'time', event.target.value)}
                                className="w-full bg-transparent text-slate-700 outline-none"
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
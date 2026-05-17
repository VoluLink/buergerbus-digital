import { useMemo, useState } from 'react'
import {
  Bus,
  ChevronLeft,
  ChevronRight,
  CircleUserRound,
  MapPin,
  Menu,
  Plus,
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

type RideType = 'standard' | 'theme' | 'rental'
type RideFormType = 'standard' | 'theme'
type DayRole = 'dispo' | 'fahrer'
type CalendarView = 'Monat' | 'Woche' | 'Tag'

type PassengerForm = {
  id: number
  name: string
  phone: string
  pickupAddress: string
  destinationAddress: string
  time: string
}

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
  { label: 'Offene Fahrten', color: 'bg-amber-500' },
  { label: 'Zugewiesen', color: 'bg-blue-500' },
  { label: 'Abgeschlossen', color: 'bg-emerald-500' },
  { label: 'Themenfahrt', color: 'bg-fuchsia-500' },
  { label: 'Vermietung', color: 'bg-cyan-600' },
  { label: 'Nur gespeichert', color: 'bg-sky-400' },
]

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
  const [nextPassengerId, setNextPassengerId] = useState(2)

  const remarksPlaceholder = useMemo(() => {
    if (rideType === 'theme') {
      return 'Zusätzliche Informationen zur Themenfahrt...'
    }

    if (rideType === 'rental') {
      return 'Bemerkungen zur Vermietung...'
    }

    return 'Zusätzliche Informationen zur Fahrt...'
  }, [rideType])

  function openDayDialog(date: Date) {
    setSelectedDate(normalizeDate(date))
    setIsDayDialogOpen(true)
  }

  function closeDayDialog() {
    setIsDayDialogOpen(false)
  }

  function openRideDialog() {
    setIsDayDialogOpen(false)
    setRideFormsByType(createInitialRideForms())
    setRentalRemarks('')
    setNextPassengerId(2)
    setIsRideDialogOpen(true)
  }

  function closeRideDialog() {
    setIsRideDialogOpen(false)
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

  function updatePassengerField(passengerId: number, field: keyof Omit<PassengerForm, 'id'>, value: string) {
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
                [field]: value,
              }
            : passenger,
        ),
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
              {topFilters.map((filter) => (
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
            onClick={() => navigate('/profil')}
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

              <button
                type="button"
                onClick={openRideDialog}
                className="inline-flex items-center gap-2 rounded-2xl bg-[#0053a0] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(0,83,160,0.35)] transition hover:brightness-105"
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                Fahrt
              </button>
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

              return (
                <button
                  key={day.date.toISOString()}
                  type="button"
                  onClick={() => openDayDialog(day.date)}
                  className={`h-20 rounded-xl border px-3 py-2 text-left transition sm:h-22 lg:h-24 ${
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

              <button
                type="button"
                onClick={() => goToPage('/fahrerinfos')}
                className="flex w-full items-center gap-3 rounded-2xl bg-[#0053a0]/12 px-4 py-3 text-left text-lg font-medium text-[#0053a0]"
              >
                <UserRound className="h-5 w-5" aria-hidden="true" />
                Fahrerinfos
              </button>

              <button
                type="button"
                onClick={() => goToPage('/fahrzeuginfos')}
                className="flex w-full items-center gap-3 rounded-2xl bg-[#0053a0]/12 px-4 py-3 text-left text-lg font-medium text-[#0053a0]"
              >
                <Bus className="h-5 w-5" aria-hidden="true" />
                Fahrzeuginfos
              </button>

              <button
                type="button"
                onClick={() => goToPage('/fahrgastinfos')}
                className="flex w-full items-center gap-3 rounded-2xl bg-[#0053a0]/12 px-4 py-3 text-left text-lg font-medium text-[#0053a0]"
              >
                <UserRoundPlus className="h-5 w-5" aria-hidden="true" />
                Fahrgastinfos
              </button>

              <button
                type="button"
                onClick={() => goToPage('/rollenverteilung')}
                className="flex w-full items-center gap-3 rounded-2xl bg-[#0053a0]/12 px-4 py-3 text-left text-lg font-medium text-[#0053a0]"
              >
                <Settings className="h-5 w-5" aria-hidden="true" />
                Rollenverteilung
              </button>
            </div>
          </aside>
        </div>
      ) : null}

      {isDayDialogOpen ? (
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
                  <p className="mt-1 text-base text-white/80">0 Fahrten</p>
                </div>

                <div className="flex items-center gap-4">
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

            <div className="relative flex h-[320px] items-center justify-center text-center text-slate-400">
              <p className="text-4xl font-medium text-slate-400">
                Keine Fahrten an diesem Tag
              </p>

              <button
                type="button"
                onClick={openRideDialog}
                className="absolute bottom-6 right-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-[#0053a0] text-white shadow-[0_14px_30px_rgba(0,83,160,0.45)] transition hover:brightness-110"
                aria-label="Neue Fahrt erstellen"
              >
                <Plus className="h-7 w-7" aria-hidden="true" />
              </button>
            </div>
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
                  <h2 className="text-4xl font-semibold tracking-tight">Neue Fahrt erstellen</h2>
                  <p className="mt-2 text-base text-white/80">14. Mai 2026</p>
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
                    placeholder="Name der Vermietung"
                    className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#0053a0] focus:ring-4 focus:ring-[#0053a0]/15"
                  />

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <label className="text-sm font-semibold text-slate-700">
                      Datum von
                      <input type="date" defaultValue="2026-05-14" className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-700 outline-none" />
                    </label>
                    <label className="text-sm font-semibold text-slate-700">
                      Datum bis
                      <input type="date" defaultValue="2026-05-14" className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-700 outline-none" />
                    </label>
                    <label className="text-sm font-semibold text-slate-700">
                      Uhrzeit von
                      <input type="time" className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-700 outline-none" />
                    </label>
                    <label className="text-sm font-semibold text-slate-700">
                      Uhrzeit bis
                      <input type="time" className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-700 outline-none" />
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
                            <input
                              type="text"
                              value={passenger.name}
                              onChange={(event) => updatePassengerField(passenger.id, 'name', event.target.value)}
                              placeholder="Name des Fahrgasts"
                              className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#0053a0] focus:ring-2 focus:ring-[#0053a0]/15"
                            />
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
                className="rounded-2xl border border-[#0053a0]/30 bg-[#0053a0]/8 px-5 py-2.5 text-sm font-semibold text-[#0053a0] transition hover:bg-[#0053a0]/15"
              >
                Fahrt Speichern
              </button>
              <button
                type="button"
                onClick={closeRideDialog}
                className="rounded-2xl bg-[#0053a0] px-5 py-2.5 text-sm font-semibold text-white transition hover:brightness-105"
              >
                Fahrt erstellen
              </button>
            </footer>
          </section>
        </div>
      ) : null}
    </main>
  )
}

export default DashboardPage
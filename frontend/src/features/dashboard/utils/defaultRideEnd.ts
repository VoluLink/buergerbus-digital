export type DefaultRideEnd = {
  date: string
  time: string
}

function isDateInputValue(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value)
}

function isTimeInputValue(value: string) {
  const match = value.match(/^(\d{2}):(\d{2})$/)
  if (!match) return false

  const hours = Number(match[1])
  const minutes = Number(match[2])
  return hours >= 0 && hours < 24 && minutes >= 0 && minutes < 60
}

function toDateInputValue(value: Date) {
  const year = value.getFullYear()
  const month = String(value.getMonth() + 1).padStart(2, '0')
  const day = String(value.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function toTimeInputValue(value: Date) {
  return `${String(value.getHours()).padStart(2, '0')}:${String(value.getMinutes()).padStart(2, '0')}`
}

/** Calculates the end from complete local date-time values, preserving day changes. */
export function calculateDefaultRideEnd(startDate: string, startTime: string, durationMinutes: number): DefaultRideEnd | null {
  if (!isDateInputValue(startDate) || !isTimeInputValue(startTime) || !Number.isInteger(durationMinutes) || durationMinutes < 0) {
    return null
  }

  const [year, month, day] = startDate.split('-').map(Number)
  const [hours, minutes] = startTime.split(':').map(Number)
  const start = new Date(year, month - 1, day, hours, minutes, 0, 0)

  if (start.getFullYear() !== year || start.getMonth() !== month - 1 || start.getDate() !== day) {
    return null
  }

  const end = new Date(start.getTime() + durationMinutes * 60_000)
  return { date: toDateInputValue(end), time: toTimeInputValue(end) }
}

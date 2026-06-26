export function normalizeDate(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

export function addDays(date: Date, amount: number) {
  const nextDate = new Date(date)
  nextDate.setDate(nextDate.getDate() + amount)
  return normalizeDate(nextDate)
}

export function addMonths(date: Date, amount: number) {
  const nextDate = new Date(date)
  nextDate.setMonth(nextDate.getMonth() + amount)
  return normalizeDate(nextDate)
}

export function startOfWeek(date: Date) {
  const nextDate = normalizeDate(date)
  const weekday = nextDate.getDay()
  const mondayOffset = weekday === 0 ? -6 : 1 - weekday
  nextDate.setDate(nextDate.getDate() + mondayOffset)
  return normalizeDate(nextDate)
}

export function isSameDay(left: Date, right: Date) {
  return left.getFullYear() === right.getFullYear()
    && left.getMonth() === right.getMonth()
    && left.getDate() === right.getDate()
}

export function toDateKey(date: Date) {
  return date.toISOString().slice(0, 10)
}

const dateInputFormatter = new Intl.DateTimeFormat('en-CA')

export function toDateInputValue(date: Date) {
  return dateInputFormatter.format(date)
}

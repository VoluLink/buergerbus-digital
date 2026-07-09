function normalizePassengerText(value?: string | null) {
  return value ?? ''
}

export function parseTimeToMinutes(value?: string | null) {
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

export function formatMinutesAsTime(totalMinutes: number) {
  const clampedMinutes = Math.max(0, Math.min(totalMinutes, 24 * 60))
  const hours = Math.floor(clampedMinutes / 60)
  const minutes = clampedMinutes % 60

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
}

export function snapTimeToFiveMinuteStep(value?: string | null) {
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

export function buildTimeFromParts(hours: string, minutes: string) {
  if (!hours) {
    return ''
  }

  return snapTimeToFiveMinuteStep(`${hours}:${minutes || '00'}`)
}

export function getRentalStartTime(time?: string | null) {
  const normalizedTime = normalizePassengerText(time).trim()

  if (!normalizedTime) {
    return ''
  }

  return normalizedTime.split('-')[0]?.trim() ?? ''
}

export function getRentalEndTime(time?: string | null) {
  const normalizedTime = normalizePassengerText(time).trim()

  if (!normalizedTime) {
    return ''
  }

  return normalizedTime.split('-')[1]?.trim() ?? ''
}

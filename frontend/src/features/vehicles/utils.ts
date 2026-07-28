import type { Fahrzeug, FahrzeugFormData } from '../../types/Fahrzeug'
import type { SchadenFormData } from '../../types/Schaden'
import type { WartungFormData } from '../../types/Wartung'

export function createEmptyVehicleForm(): FahrzeugFormData {
  return {
    kennzeichen: '',
    bezeichnung: '',
    kapazitaet: '',
    kilometerstand: '',
    betriebsaufnahme: '',
    initiativeId: '',
    bemerkung: '',
    status: '',
  }
}

export function toVehicleFormData(vehicle: Fahrzeug): FahrzeugFormData {
  return {
    kennzeichen: vehicle.kennzeichen,
    bezeichnung: vehicle.bezeichnung,
    kapazitaet: String(vehicle.kapazitaet),
    kilometerstand: String(vehicle.kilometerstand),
    betriebsaufnahme: toDateInputValue(vehicle.betriebsaufnahme),
    initiativeId: String(vehicle.initiativeId),
    bemerkung: vehicle.bemerkung ?? '',
    status: vehicle.status,
  }
}

export function formatDisplayDate(value: string) {
  if (!value) {
    return '-'
  }

  const parsedDate = new Date(value)
  if (Number.isNaN(parsedDate.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('de-DE').format(parsedDate)
}

export function toDateInputValue(value?: string | Date | null): string {
  if (!value) {
    return ''
  }

  if (typeof value === 'string') {
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return value
    }

    const dateTimeMatch = value.match(/^(\d{4}-\d{2}-\d{2})\s/)
    if (dateTimeMatch) {
      return dateTimeMatch[1]
    }

    const germanDate = value.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/)
    if (germanDate) {
      const [, day, month, year] = germanDate
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
    }

    const parsedDate = new Date(value)
    if (!Number.isNaN(parsedDate.getTime())) {
      const year = parsedDate.getFullYear()
      const month = String(parsedDate.getMonth() + 1).padStart(2, '0')
      const day = String(parsedDate.getDate()).padStart(2, '0')

      return `${year}-${month}-${day}`
    }

    return ''
  }

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    const year = value.getFullYear()
    const month = String(value.getMonth() + 1).padStart(2, '0')
    const day = String(value.getDate()).padStart(2, '0')

    return `${year}-${month}-${day}`
  }

  return ''
}

export function formatKilometerstand(value: number | null | undefined) {
  if (value === null || value === undefined) {
    return '-'
  }

  return `${new Intl.NumberFormat('de-DE').format(value)} km`
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
  }).format(value)
}

export function getWartungBadgeClass(value?: string | Date | null): string {
  if (!value) {
    return ''
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  let wartungDate: Date

  if (value instanceof Date) {
    wartungDate = new Date(value.getFullYear(), value.getMonth(), value.getDate())
  } else {
    const text = value.trim()

    if (/^\d{4}-\d{2}-\d{2}/.test(text)) {
      const [year, month, day] = text.substring(0, 10).split('-').map(Number)
      wartungDate = new Date(year, month - 1, day)
    } else {
      const match = text.match(/^(\d{1,2})\.(\d{1,2})\.(\d{2}|\d{4})$/)
      if (!match) {
        return ''
      }

      const day = Number(match[1])
      const month = Number(match[2])
      let year = Number(match[3])

      if (year < 100) {
        year += 2000
      }

      wartungDate = new Date(year, month - 1, day)
    }
  }

  if (Number.isNaN(wartungDate.getTime())) {
    return ''
  }

  wartungDate.setHours(0, 0, 0, 0)

  const diffMs = wartungDate.getTime() - today.getTime()
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays <= 0) {
    return 'badge bg-danger'
  }

  if (diffDays <= 30) {
    return 'badge bg-warning text-dark'
  }

  return ''
}

export function getStatusBadgeClasses(status: string) {
  const base = 'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold'

  switch (status) {
    case 'Einsatzbereit':
      return `${base} bg-emerald-100 text-emerald-700`
    case 'Wartung fällig':
    case 'Wartung faellig':
      return `${base} bg-amber-100 text-amber-700`
    case 'Werkstatt':
      return `${base} bg-amber-100 text-amber-800`
    case 'Außer Betrieb':
    case 'Ausser Betrieb':
      return `${base} bg-rose-100 text-rose-700`
    default:
      return `${base} bg-slate-100 text-slate-600`
  }
}

export function getAktivBadgeClasses(isAktiv: boolean) {
  return isAktiv
    ? 'inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700'
    : 'inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600'
}

export function createEmptyWartungForm(): WartungFormData {
  return {
    letzterTermin: '',
    naechsterTermin: '',
    grund: '',
    ort: '',
    kosten: '',
  }
}

export function createEmptySchadenForm(): SchadenFormData {
  return {
    beschreibung: '',
    entstandenAm: '',
    behobenAm: '',
    status: 'Offen',
  }
}

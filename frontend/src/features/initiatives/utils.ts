import type { Initiative } from '../../types/Initiative'
import type { InitiativeFormState } from './types'

export function formatDateDisplay(value: string | null | undefined) {
  if (!value) {
    return '—'
  }

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('de-DE', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(parsed)
}

export function createEmptyForm(): InitiativeFormState {
  return {
    name: '',
    beschreibung: '',
  }
}

export function isDefaultInitiative(initiative: Initiative | null | undefined) {
  return (initiative?.name ?? '').trim().toLowerCase() === 'default'
}

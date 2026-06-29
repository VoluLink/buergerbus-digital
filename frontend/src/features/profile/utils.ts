export function formatDateInput(value?: string | null) {
  if (!value) {
    return ''
  }

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return ''
  }

  return parsed.toISOString().slice(0, 10)
}

export function formatRoleLabel(role: string) {
  const normalized = role.toLowerCase()
  if (normalized === 'admin') {
    return 'Admin'
  }
  if (normalized === 'disponent') {
    return 'Disponent'
  }
  if (normalized === 'fahrer') {
    return 'Fahrer'
  }

  return role
}

import { apiFetch } from './httpClient'

export type AuditLog = {
  id: number
  timestampUtc: string
  userId?: number
  userDisplayName?: string
  action: string
  entityType: string
  entityId?: string
  initiativeId?: number
  initiativeName?: string
  result: string
  correlationId?: string
}

export type AuditLogDetail = AuditLog & { metadata: Record<string, string> }
export type PagedAuditLogs = { items: AuditLog[]; page: number; pageSize: number; totalCount: number }

export async function getAuditLogs(params: URLSearchParams): Promise<PagedAuditLogs> {
  const response = await apiFetch(`/api/v1/admin/audit-logs?${params}`)
  if (!response.ok) throw new Error(response.status === 403 ? 'Sie haben keine Berechtigung für diesen Bereich.' : 'Die Daten konnten nicht geladen werden.')
  return response.json()
}

export async function getAuditLog(id: number): Promise<AuditLogDetail> {
  const response = await apiFetch(`/api/v1/admin/audit-logs/${id}`)
  if (!response.ok) throw new Error('Die Details konnten nicht geladen werden.')
  return response.json()
}

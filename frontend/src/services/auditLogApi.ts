import { apiFetch } from './httpClient'
export type AuditLog = { id:number; timestampUtc:string; userDisplayName?:string; action:string; entityType:string; entityId?:string; initiativeName?:string; result:string; correlationId?:string }
export type PagedAuditLogs = { items:AuditLog[]; page:number; pageSize:number; totalCount:number }
export async function getAuditLogs(params: URLSearchParams): Promise<PagedAuditLogs> { const r=await apiFetch(`/api/v1/admin/audit-logs?${params}`); if(!r.ok) throw new Error(r.status===403?'Sie haben keine Berechtigung für diesen Bereich.':'Die Daten konnten nicht geladen werden.'); return r.json() }

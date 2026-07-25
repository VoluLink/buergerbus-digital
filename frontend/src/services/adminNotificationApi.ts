import { API_BASE_URL } from '../config/apiConfig'
import { apiFetch } from './httpClient'

export type Audience = 'All' | 'Admin' | 'Dispatcher' | 'Driver' | 'Guest'
export type Priority = 'Info' | 'Warning' | 'Critical'
export type AdminNotification = { id:string; title:string; message:string; audience:Audience; initiativeId:number|null; initiativeName:string|null; priority:Priority; validFromUtc:string; validUntilUtc:string|null; isActive:boolean; createdAtUtc:string; updatedAtUtc:string|null }
export type AdminNotificationInput = Omit<AdminNotification, 'id' | 'initiativeName' | 'createdAtUtc' | 'updatedAtUtc'>
type ProblemDetails = { title?:string; detail?:string; errors?:Record<string,string[]> }

function isoOrNull(value:string|null|undefined) { if (!value) return null; const date = new Date(value); return Number.isNaN(date.getTime()) ? null : date.toISOString() }

export function mapAdminNotificationFormToRequest(input:AdminNotificationInput):AdminNotificationInput {
  return { title:input.title.trim(), message:input.message.trim(), audience:input.audience, initiativeId:typeof input.initiativeId === 'number' && Number.isInteger(input.initiativeId) && input.initiativeId > 0 ? input.initiativeId : null, priority:input.priority, validFromUtc:isoOrNull(input.validFromUtc) ?? new Date().toISOString(), validUntilUtc:isoOrNull(input.validUntilUtc), isActive:input.isActive === true }
}

async function responseMessage(response:Response) { try { const problem = await response.json() as ProblemDetails; return problem.errors ? Object.values(problem.errors).flat().join(' ') : problem.detail ?? problem.title ?? '' } catch { return '' } }
async function request<T>(url:string, init?:RequestInit) { const response = await apiFetch(`${API_BASE_URL}${url}`, init); if (!response.ok) { const generic:Record<number,string>={400:'Die Eingaben sind ungültig.',401:'Ihre Sitzung ist abgelaufen.',403:'Sie haben keine Berechtigung für diesen Bereich.',404:'Die Mitteilung wurde nicht gefunden.',409:'Die Mitteilung konnte wegen eines Konflikts nicht gespeichert werden.'}; throw new Error((await responseMessage(response)) || generic[response.status] || 'Die Mitteilung konnte nicht gespeichert werden.') } return response.json() as Promise<T> }

export const getAdminNotifications = () => request<AdminNotification[]>('/api/v1/admin/notifications')
export const getAdminNotification = (id:string) => request<AdminNotification>(`/api/v1/admin/notifications/${id}`)
export const createAdminNotification = (input:AdminNotificationInput) => request<AdminNotification>('/api/v1/admin/notifications', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(mapAdminNotificationFormToRequest(input)) })
export const updateAdminNotification = (id:string, input:AdminNotificationInput) => request<AdminNotification>(`/api/v1/admin/notifications/${id}`, { method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify(mapAdminNotificationFormToRequest(input)) })
export const setAdminNotificationActive = (id:string, active:boolean) => request<AdminNotification>(`/api/v1/admin/notifications/${id}/${active ? 'activate' : 'deactivate'}`, { method:'PATCH' })

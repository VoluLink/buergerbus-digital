import { API_BASE_URL } from '../config/apiConfig'
import { apiFetch } from './httpClient'
export type Audience='All'|'Admin'|'Dispatcher'|'Driver'|'Guest'; export type Priority='Info'|'Warning'|'Critical'
export type AdminNotification={id:string;title:string;message:string;audience:Audience;initiativeId:number|null;initiativeName:string|null;priority:Priority;validFromUtc:string;validUntilUtc:string|null;isActive:boolean;createdAtUtc:string;updatedAtUtc:string|null}
export type AdminNotificationInput=Omit<AdminNotification,'id'|'initiativeName'|'createdAtUtc'|'updatedAtUtc'>
async function request<T>(url:string, init?:RequestInit){const r=await apiFetch(`${API_BASE_URL}${url}`,init);if(!r.ok){const messages:Record<number,string>={400:'Die Eingaben sind ungültig.',401:'Ihre Sitzung ist abgelaufen.',403:'Sie haben keine Berechtigung für diesen Bereich.',404:'Die Mitteilung wurde nicht gefunden.',409:'Die Mitteilung konnte wegen eines Konflikts nicht gespeichert werden.'};throw new Error(messages[r.status]??'Die Mitteilung konnte nicht gespeichert werden.')}return r.json() as Promise<T>}
export const getAdminNotifications=()=>request<AdminNotification[]>('/api/v1/admin/notifications')
export const getAdminNotification=(id:string)=>request<AdminNotification>(`/api/v1/admin/notifications/${id}`)
export const createAdminNotification=(x:AdminNotificationInput)=>request<AdminNotification>('/api/v1/admin/notifications',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(x)})
export const updateAdminNotification=(id:string,x:AdminNotificationInput)=>request<AdminNotification>(`/api/v1/admin/notifications/${id}`,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(x)})
export const setAdminNotificationActive=(id:string,active:boolean)=>request<AdminNotification>(`/api/v1/admin/notifications/${id}/${active?'activate':'deactivate'}`,{method:'PATCH'})

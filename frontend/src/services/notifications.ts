import { API_BASE_URL } from '../config/apiConfig'
import { apiFetch } from './httpClient'
import type {
  NotificationDetails,
  NotificationSendResult,
  NotificationSummary,
  SendNotificationRequest,
} from '../types/Notifications'

export async function sendNotification(
  payload: SendNotificationRequest,
): Promise<NotificationSendResult> {
  const response = await apiFetch(`${API_BASE_URL}/api/v1/admin/broadcast-emails`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(errorText || 'Benachrichtigung konnte nicht versendet werden.')
  }

  return response.json()
}

export async function getNotifications(): Promise<NotificationSummary[]> {
  const response = await apiFetch(`${API_BASE_URL}/api/v1/admin/broadcast-emails`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    if (response.status === 403) {
      throw new Error('Keine Berechtigung.')
    }

    const errorText = await response.text()
    throw new Error(errorText || 'Benachrichtigungen konnten nicht geladen werden.')
  }

  return response.json()
}

export async function getNotificationDetails(id: string): Promise<NotificationDetails> {
  const response = await apiFetch(`${API_BASE_URL}/api/v1/admin/broadcast-emails/${id}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    if (response.status === 403) {
      throw new Error('Keine Berechtigung.')
    }
    if (response.status === 404) {
      throw new Error('Benachrichtigung wurde nicht gefunden.')
    }

    const errorText = await response.text()
    throw new Error(errorText || 'Benachrichtigungsdetails konnten nicht geladen werden.')
  }

  return response.json()
}

export type NotificationType = 'GeneralInfo' | 'SystemMaintenance' | 'VehicleMaintenance' | 'UserCreated'

export type NotificationRecipientGroup = 'All' | 'Admins' | 'Disponents' | 'Drivers'

export type NotificationRecipientRole = 'Admin' | 'Disponent' | 'Fahrer'

export interface SendNotificationRequest {
  subject: string
  message: string
  type: NotificationType
  initiativeIds: number[]
  roles: string[]
  recipientGroup?: NotificationRecipientGroup
}

export interface NotificationSendResult {
  notificationId: string
  sentCount: number
  failedCount: number
  status: string
}

export interface NotificationSummary {
  id: string
  type: string
  subject: string
  recipientGroup: string
  status: string
  createdAt: string
  sentAt?: string | null
  sentCount: number
  failedCount: number
}

export interface NotificationRecipient {
  id: string
  userId: number
  email: string
  displayName: string
  status: string
  errorMessage?: string | null
  sentAt?: string | null
  createdAt: string
}

export interface NotificationDetails {
  id: string
  type: string
  subject: string
  message: string
  recipientGroup: string
  status: string
  createdByUserId: number
  createdAt: string
  sentAt?: string | null
  recipients: NotificationRecipient[]
}

export interface PagedNotifications { items: NotificationSummary[]; page: number; pageSize: number; totalCount: number }

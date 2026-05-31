export type Initiative = {
  id: number
  name: string
  beschreibung: string | null
  angelegtAm: string
  geaendertAm: string | null
}

export type CreateInitiativeRequest = {
  name: string
  beschreibung: string
}

export type UpdateInitiativeRequest = {
  name: string
  beschreibung: string
}

export type InitiativeDeletePreviewAffected = {
  users: number
  vehicles: number
  maintenanceRecords: number
  damageReports: number
  rides: number
  passengers: number
  rideSegments: number
  notifications: number
  deletionDeadlines: number
  driverVehicleAssignments: number
}

export type InitiativeDeletePreview = {
  initiativeId: number
  initiativeName: string
  canDelete: boolean
  isDefault: boolean
  reason: string | null
  affected: InitiativeDeletePreviewAffected
}

import type { PassengerForm } from '../../../types/DashboardRide'

export type RideFormType = 'standard' | 'theme'

export type RideFormState = {
  date: string
  fahrerId: number | null
  fahrzeugId: number | null
  driverName: string
  endTime: string
  themeTitle: string
  themeDestination: string
  remarks: string
  passengers: PassengerForm[]
}

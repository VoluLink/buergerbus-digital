export type RideType = 'standard' | 'theme' | 'rental'

export type RideStatus =
  | 'open'
  | 'assigned'
  | 'completed'
  | 'theme'
  | 'rental'
  | 'saved'

export type PassengerForm = {
  id: number
  sourceGuestId?: number | null
  saveAsGuest?: boolean
  name: string
  phone: string
  pickupAddress: string
  destinationAddress: string
  time: string
}

export type CalendarRide = {
  id: number
  date: Date
  type: RideType
  status: RideStatus
  title: string
  time: string
  fahrerId: number | null
  fahrzeugId: number | null
  driverName: string
  passengers: PassengerForm[]
  remarks: string
}

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
  driverName: string
  passengers: PassengerForm[]
  remarks: string
}

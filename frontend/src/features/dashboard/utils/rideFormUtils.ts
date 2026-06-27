import type { PassengerForm } from '../../../types/DashboardRide'
import { type RideFormState, type RideFormType } from '../types/rideFormTypes'

export function createEmptyPassenger(id: number): PassengerForm {
  return {
    id,
    sourceGuestId: null,
    saveAsGuest: false,
    name: '',
    phone: '',
    pickupAddress: '',
    destinationAddress: '',
    time: '',
    istAbgehakt: false,
    abgehaktAm: null,
  }
}

export function applyThemeDestinationToPassengers(passengers: PassengerForm[], destination: string) {
  return passengers.map((passenger) => ({
    ...passenger,
    destinationAddress: destination,
  }))
}

function createRideFormState(): RideFormState {
  return {
    fahrerId: null,
    fahrzeugId: null,
    driverName: '',
    endTime: '',
    themeTitle: '',
    themeDestination: '',
    remarks: '',
    passengers: [createEmptyPassenger(1)],
  }
}

export function createInitialRideForms(): Record<RideFormType, RideFormState> {
  return {
    standard: createRideFormState(),
    theme: createRideFormState(),
  }
}
import type { Fahrzeug } from '../types/Fahrzeug'

const fahrzeugSpeicher: Fahrzeug[] = [
  {
    id: 1,
    kennzeichen: 'B-AB 1234',
    bezeichnung: 'Stadtfahrzeug 1',
    markeTyp: 'VW Golf 8',
    fahrzeugart: 'PKW',
    kapazitaet: 5,
    kilometerstand: 45320,
    betriebsaufnahme: '2021-04-12',
    bemerkung: 'Firmenwagen',
    status: 'Einsatzbereit',
    aktiv: true,
    initiativeId: 1,
    letzteWartung: '2026-01-15',
    naechsteWartung: '2026-07-15',
    schaeden: 'Keine',
    reparaturtermin: null,
  },
]

function cloneVehicle(vehicle: Fahrzeug): Fahrzeug {
  return { ...vehicle }
}

export async function getFahrzeuge(): Promise<Fahrzeug[]> {
  return fahrzeugSpeicher.map(cloneVehicle)
}

export async function createFahrzeug(vehicle: Fahrzeug): Promise<Fahrzeug> {
  const newVehicle = cloneVehicle(vehicle)
  fahrzeugSpeicher.push(newVehicle)
  return newVehicle
}

export async function updateFahrzeug(vehicleId: number, vehicle: Fahrzeug): Promise<Fahrzeug> {
  const updatedVehicle = cloneVehicle(vehicle)

  const index = fahrzeugSpeicher.findIndex((entry) => entry.id === vehicleId)
  if (index !== -1) {
    fahrzeugSpeicher[index] = updatedVehicle
  }

  return updatedVehicle
}

export async function deleteFahrzeug(vehicleId: number): Promise<void> {
  const index = fahrzeugSpeicher.findIndex((entry) => entry.id === vehicleId)
  if (index !== -1) {
    fahrzeugSpeicher.splice(index, 1)
  }
}
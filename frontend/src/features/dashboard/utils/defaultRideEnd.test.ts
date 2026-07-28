import { calculateDefaultRideEnd } from './defaultRideEnd.ts'

function assertEqual(actual: unknown, expected: unknown, label: string) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`${label}: expected ${JSON.stringify(expected)}, received ${JSON.stringify(actual)}`)
  }
}

assertEqual(calculateDefaultRideEnd('2026-07-16', '10:00', 60), { date: '2026-07-16', time: '11:00' }, '60 Minuten am selben Tag')
assertEqual(calculateDefaultRideEnd('2026-07-16', '10:00', 90), { date: '2026-07-16', time: '11:30' }, '90 Minuten am selben Tag')
assertEqual(calculateDefaultRideEnd('2026-07-16', '23:00', 60), { date: '2026-07-17', time: '00:00' }, 'Mitternacht')
assertEqual(calculateDefaultRideEnd('2026-07-16', '23:30', 90), { date: '2026-07-17', time: '01:00' }, '90 Minuten über Mitternacht')
assertEqual(calculateDefaultRideEnd('2026-07-16', '22:00', 180), { date: '2026-07-17', time: '01:00' }, '180 Minuten über Mitternacht')
assertEqual(calculateDefaultRideEnd('2026-07-16', '23:59', 15), { date: '2026-07-17', time: '00:14' }, '15 Minuten über Mitternacht')
assertEqual(calculateDefaultRideEnd('2026-07-16', '10:00', 1440), { date: '2026-07-17', time: '10:00' }, 'ein voller Tag')
assertEqual(calculateDefaultRideEnd('invalid', '10:00', 60), null, 'ungültiges Datum')
assertEqual(calculateDefaultRideEnd('2026-07-16', '24:00', 60), null, 'ungültige Uhrzeit')
assertEqual(calculateDefaultRideEnd('2026-07-16', '10:00', -1), null, 'ungültige Dauer')

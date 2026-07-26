import type { RideStatus } from '../types/DashboardRide'

export const rideStatusMetadata = {
  open: { label: 'Offene Fahrten', color: 'bg-amber-500' },
  assigned: { label: 'Zugewiesen', color: 'bg-[#0053a0]' },
  completed: { label: 'Abgeschlossen', color: 'bg-emerald-500' },
  theme: { label: 'Themenfahrt', color: 'bg-slate-500' },
  rental: { label: 'Vermietung', color: 'bg-slate-500' },
  saved: { label: 'Nur gespeichert', color: 'bg-slate-400' },
} satisfies Record<RideStatus, { label: string; color: string }>

export const rideStatusLegend = Object.entries(rideStatusMetadata).map(([key, value]) => ({
  key: key as RideStatus,
  label: value.label,
  color: value.color,
}))

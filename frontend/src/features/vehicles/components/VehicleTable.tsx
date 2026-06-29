import type { Fahrzeug } from '../../../types/Fahrzeug'
import {
  formatDisplayDate,
  formatKilometerstand,
  getAktivBadgeClasses,
  getStatusBadgeClasses,
  getWartungBadgeClass,
} from '../utils'

interface VehicleTableProps {
  isLoading: boolean
  vehicles: Fahrzeug[]
  searchQuery: string
  selectedVehicleId: number | null
  onVehicleSelection: (vehicleId: number, isChecked: boolean) => void
}

function VehicleTable({
  isLoading,
  vehicles,
  searchQuery,
  selectedVehicleId,
  onVehicleSelection,
}: VehicleTableProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-12 text-sm text-slate-500">
        Fahrzeugdaten werden geladen...
      </div>
    )
  }

  if (vehicles.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-12 text-center text-sm text-slate-500">
        {searchQuery.trim() ? 'Keine passenden Fahrzeuge gefunden.' : 'Noch keine Fahrzeuge vorhanden.'}
      </div>
    )
  }

  return (
    <table className="w-full min-w-[1200px] border-collapse text-sm">
      <thead>
        <tr className="border-b border-slate-200">
          <th className="px-3 py-3 text-left font-semibold text-slate-700">Auswahl</th>
          <th className="px-3 py-3 text-left font-semibold text-slate-700">Fahrzeug-ID</th>
          <th className="px-3 py-3 text-left font-semibold text-slate-700">Kennzeichen</th>
          <th className="px-3 py-3 text-left font-semibold text-slate-700">Bezeichnung</th>
          <th className="px-3 py-3 text-left font-semibold text-slate-700">Initiative</th>
          <th className="px-3 py-3 text-left font-semibold text-slate-700">Kapazität</th>
          <th className="px-3 py-3 text-left font-semibold text-slate-700">Kilometerstand</th>
          <th className="px-3 py-3 text-left font-semibold text-slate-700">Betriebsaufnahme</th>
          <th className="px-3 py-3 text-left font-semibold text-slate-700">Letzte Wartung</th>
          <th className="px-3 py-3 text-left font-semibold text-slate-700">Nächste Wartung</th>
          <th className="px-3 py-3 text-left font-semibold text-slate-700">Offene Schäden</th>
          <th className="px-3 py-3 text-left font-semibold text-slate-700">Fahrzeugstatus</th>
          <th className="px-3 py-3 text-left font-semibold text-slate-700">Aktiv</th>
        </tr>
      </thead>
      <tbody>
        {vehicles.map((vehicle) => {
          const isSelected = selectedVehicleId === vehicle.id
          const hasOffeneSchaeden = vehicle.offeneSchaeden > 0

          return (
            <tr
              key={vehicle.id}
              className={`border-b border-slate-100 transition hover:bg-slate-50 ${
                isSelected ? 'bg-[#0053a0]/5' : ''
              }`}
            >
              <td className="px-3 py-3 text-slate-700">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={(event) => onVehicleSelection(vehicle.id, event.target.checked)}
                />
              </td>
              <td className="px-3 py-3 text-slate-700 tabular-nums whitespace-nowrap">
                {vehicle.id}
              </td>
              <td className="px-3 py-3 text-slate-700 font-medium whitespace-nowrap">
                {vehicle.kennzeichen}
              </td>
              <td className="px-3 py-3 text-slate-700 max-w-[200px] truncate">
                {vehicle.bezeichnung}
              </td>
              <td className="px-3 py-3 text-slate-700 max-w-[180px] truncate">
                {vehicle.initiativeName ?? '-'}
              </td>
              <td className="px-3 py-3 text-start text-slate-700 tabular-nums whitespace-nowrap">
                {vehicle.kapazitaet}
              </td>
              <td className="px-3 py-3 text-start text-slate-700 tabular-nums whitespace-nowrap">
                {formatKilometerstand(vehicle.kilometerstand)}
              </td>
              <td className="px-3 py-3 text-slate-700 tabular-nums whitespace-nowrap">
                {formatDisplayDate(vehicle.betriebsaufnahme)}
              </td>
              <td className="px-3 py-3 text-slate-700 tabular-nums whitespace-nowrap">
                {formatDisplayDate(vehicle.letzteWartung ?? '')}
              </td>
              <td className="px-3 py-3 text-slate-700 tabular-nums whitespace-nowrap">
                {vehicle.naechsteWartung ? (
                  (() => {
                    const badgeClass = getWartungBadgeClass(vehicle.naechsteWartung)
                    const formattedDate = formatDisplayDate(vehicle.naechsteWartung)

                    return badgeClass ? (
                      <span className={badgeClass}>{formattedDate}</span>
                    ) : (
                      formattedDate
                    )
                  })()
                ) : (
                  '-'
                )}
              </td>
              <td className="px-3 py-3 text-slate-700 tabular-nums whitespace-nowrap">
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                    hasOffeneSchaeden
                      ? 'bg-rose-100 text-rose-700'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {vehicle.offeneSchaeden}
                </span>
              </td>
              <td className="px-3 py-3 text-slate-700 whitespace-nowrap">
                <span className={getStatusBadgeClasses(vehicle.status)}>{vehicle.status}</span>
              </td>
              <td className="px-3 py-3 text-slate-700 whitespace-nowrap">
                <span className={getAktivBadgeClasses(vehicle.aktiv)}>
                  {vehicle.aktiv ? 'Ja' : 'Nein'}
                </span>
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

export default VehicleTable

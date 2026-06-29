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

  const renderNaechsteWartung = (value: string | null | undefined) => {
    if (!value) {
      return '-'
    }

    const badgeClass = getWartungBadgeClass(value)
    const formattedDate = formatDisplayDate(value)

    return badgeClass ? <span className={badgeClass}>{formattedDate}</span> : formattedDate
  }

  return (
    <>
      <div className="space-y-3 md:hidden">
        {vehicles.map((vehicle) => {
          const isSelected = selectedVehicleId === vehicle.id
          const hasOffeneSchaeden = vehicle.offeneSchaeden > 0

          return (
            <article
              key={vehicle.id}
              className={`rounded-lg border bg-white p-4 shadow-sm transition ${
                isSelected ? 'border-[#0053a0] ring-2 ring-[#0053a0]/15' : 'border-slate-200'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="break-words text-base font-semibold text-slate-900">
                    {vehicle.bezeichnung}
                  </h3>
                  <p className="mt-1 break-words text-sm font-medium text-slate-600">
                    {vehicle.kennzeichen}
                  </p>
                </div>
                <span className={getStatusBadgeClasses(vehicle.status)}>{vehicle.status}</span>
              </div>

              <dl className="mt-4 grid grid-cols-1 gap-3 text-sm">
                <div>
                  <dt className="text-xs font-semibold uppercase text-slate-500">Initiative</dt>
                  <dd className="mt-1 break-words text-slate-800">{vehicle.initiativeName ?? '-'}</dd>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <dt className="text-xs font-semibold uppercase text-slate-500">
                      Kilometerstand
                    </dt>
                    <dd className="mt-1 tabular-nums text-slate-800">
                      {formatKilometerstand(vehicle.kilometerstand)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold uppercase text-slate-500">Aktiv</dt>
                    <dd className="mt-1">
                      <span className={getAktivBadgeClasses(vehicle.aktiv)}>
                        {vehicle.aktiv ? 'Ja' : 'Nein'}
                      </span>
                    </dd>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <dt className="text-xs font-semibold uppercase text-slate-500">
                      Nächste Wartung
                    </dt>
                    <dd className="mt-1 tabular-nums text-slate-800">
                      {renderNaechsteWartung(vehicle.naechsteWartung)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold uppercase text-slate-500">
                      Offene Schäden
                    </dt>
                    <dd className="mt-1">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                          hasOffeneSchaeden
                            ? 'bg-rose-100 text-rose-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {vehicle.offeneSchaeden}
                      </span>
                    </dd>
                  </div>
                </div>
              </dl>

              <label className="mt-4 flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={(event) => onVehicleSelection(vehicle.id, event.target.checked)}
                  className="h-4 w-4"
                />
                {isSelected ? 'Ausgewählt' : 'Fahrzeug auswählen'}
              </label>
            </article>
          )
        })}
      </div>

      <table className="hidden w-full min-w-[1200px] border-collapse text-sm md:table">
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
                  {renderNaechsteWartung(vehicle.naechsteWartung)}
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
    </>
  )
}

export default VehicleTable

import type { Fahrgast } from '../../../types/Fahrgast'

type PassengerTableProps = {
  filteredGuests: Fahrgast[]
  isLoading: boolean
  loadError: string
  selectedGuestId: number | null
  onSelectedGuestIdChange: (guestId: number | null) => void
}

export function PassengerTable({
  filteredGuests,
  isLoading,
  loadError,
  selectedGuestId,
  onSelectedGuestIdChange,
}: PassengerTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50">
            <th className="px-4 py-3 text-left font-semibold text-slate-700">Auswahl</th>
            <th className="px-4 py-3 text-left font-semibold text-slate-700">Vorname</th>
            <th className="px-4 py-3 text-left font-semibold text-slate-700">Nachname</th>
            <th className="px-4 py-3 text-left font-semibold text-slate-700">Adresse</th>
            <th className="px-4 py-3 text-left font-semibold text-slate-700">Telefonnummer</th>
            <th className="px-4 py-3 text-left font-semibold text-slate-700">Bemerkungen</th>
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            <tr>
              <td className="px-4 py-6 text-center text-sm text-slate-500" colSpan={6}>
                Fahrgäste werden geladen...
              </td>
            </tr>
          ) : filteredGuests.length > 0 ? (
            filteredGuests.map((guest) => (
              <tr
                key={guest.id}
                className={`border-b border-slate-100 transition ${
                  guest.aktiv ? '' : 'bg-red-50 text-red-700'
                }`}
              >
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selectedGuestId === guest.id}
                    onChange={(event) =>
                      onSelectedGuestIdChange(event.target.checked ? guest.id : null)
                    }
                  />
                </td>
                <td className="px-4 py-3">{guest.vorname}</td>
                <td className="px-4 py-3">{guest.nachname}</td>
                <td className="px-4 py-3">{guest.adresse}</td>
                <td className="px-4 py-3">{guest.telefonnummer || '-'}</td>
                <td className="px-4 py-3">{guest.bemerkung || '-'}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td className="px-4 py-6 text-center text-sm text-slate-500" colSpan={6}>
                {loadError || 'Kein Fahrgast vorhanden.'}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

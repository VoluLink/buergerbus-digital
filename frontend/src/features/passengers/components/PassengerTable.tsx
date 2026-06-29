import type { ReactNode } from 'react'
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
  function renderPhoneLink(phoneNumber: string): ReactNode {
    if (!phoneNumber) {
      return '-'
    }

    return (
      <a className="font-medium text-[#0053a0] underline-offset-2 hover:underline" href={`tel:${phoneNumber}`}>
        {phoneNumber}
      </a>
    )
  }

  function renderEmailLink(email: string): ReactNode {
    if (!email) {
      return '-'
    }

    return (
      <a className="break-all font-medium text-[#0053a0] underline-offset-2 hover:underline" href={`mailto:${email}`}>
        {email}
      </a>
    )
  }

  return (
    <>
      <div className="space-y-3 p-3 md:hidden">
        {isLoading ? (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
            {'Fahrg\u00e4ste werden geladen...'}
          </div>
        ) : filteredGuests.length > 0 ? (
          filteredGuests.map((guest) => {
            const isSelected = selectedGuestId === guest.id
            const initiativeName = guest.initiativeName || '-'

            return (
              <article
                key={guest.id}
                className={`rounded-2xl border p-4 shadow-sm transition ${
                  isSelected
                    ? 'border-[#0053a0] bg-[#0053a0]/5'
                    : guest.aktiv
                      ? 'border-slate-200 bg-white'
                      : 'border-red-200 bg-red-50 text-red-700'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="break-words text-lg font-semibold text-slate-900">
                      {guest.vorname} {guest.nachname}
                    </h2>
                    <p className="mt-1 break-words text-sm leading-5 text-slate-600">{guest.adresse || '-'}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onSelectedGuestIdChange(isSelected ? null : guest.id)}
                    className={`min-h-11 shrink-0 rounded-xl px-3 py-2 text-sm font-semibold transition ${
                      isSelected
                        ? 'bg-[#0053a0] text-white'
                        : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {isSelected ? 'Ausgew\u00e4hlt' : 'Details'}
                  </button>
                </div>

                <dl className="mt-4 grid grid-cols-1 gap-3 text-sm">
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Telefon</dt>
                    <dd className="mt-1 break-words text-slate-800">{renderPhoneLink(guest.telefonnummer)}</dd>
                  </div>

                  {guest.email ? (
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">E-Mail</dt>
                      <dd className="mt-1 text-slate-800">{renderEmailLink(guest.email)}</dd>
                    </div>
                  ) : null}

                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Initiative</dt>
                    <dd className="mt-1 break-words text-slate-800">{initiativeName}</dd>
                  </div>

                  {guest.bemerkung ? (
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Bemerkungen</dt>
                      <dd className="mt-1 break-words text-slate-800">{guest.bemerkung}</dd>
                    </div>
                  ) : null}
                </dl>
              </article>
            )
          })
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
            {loadError || 'Kein Fahrgast vorhanden.'}
          </div>
        )}
      </div>

      <div className="hidden overflow-x-auto md:block">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="px-4 py-3 text-left font-semibold text-slate-700">Auswahl</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700">Vorname</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700">Nachname</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700">Adresse</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700">Telefonnummer</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700">E-Mail</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700">Initiative</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700">Bemerkungen</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td className="px-4 py-6 text-center text-sm text-slate-500" colSpan={8}>
                  {'Fahrg\u00e4ste werden geladen...'}
                </td>
              </tr>
            ) : filteredGuests.length > 0 ? (
              filteredGuests.map((guest) => (
                <tr
                  key={guest.id}
                  className={`border-b border-slate-100 transition ${guest.aktiv ? '' : 'bg-red-50 text-red-700'}`}
                >
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedGuestId === guest.id}
                      onChange={(event) => onSelectedGuestIdChange(event.target.checked ? guest.id : null)}
                    />
                  </td>
                  <td className="px-4 py-3">{guest.vorname}</td>
                  <td className="px-4 py-3">{guest.nachname}</td>
                  <td className="px-4 py-3">{guest.adresse}</td>
                  <td className="px-4 py-3">{renderPhoneLink(guest.telefonnummer)}</td>
                  <td className="px-4 py-3">{renderEmailLink(guest.email)}</td>
                  <td className="px-4 py-3">{guest.initiativeName || '-'}</td>
                  <td className="px-4 py-3">{guest.bemerkung || '-'}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="px-4 py-6 text-center text-sm text-slate-500" colSpan={8}>
                  {loadError || 'Kein Fahrgast vorhanden.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  )
}

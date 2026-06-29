import type { FormEvent } from 'react'
import type { Wartung, WartungFormData } from '../../../types/Wartung'
import { formatCurrency, formatDisplayDate, getWartungBadgeClass } from '../utils'

interface MaintenanceSectionProps {
  detailsError: string
  detailsLoading: boolean
  editingWartungId: number | null
  formData: WartungFormData
  formError: string
  isCrudRestricted: boolean
  isSaving: boolean
  successMessage: string
  wartungen: Wartung[]
  onCancelEdit: () => void
  onFieldChange: (fieldName: keyof WartungFormData, value: string) => void
  onSave: (event: FormEvent<HTMLFormElement>) => void
  onStartEdit: (wartung: Wartung) => void
}

function MaintenanceSection({
  detailsError,
  detailsLoading,
  editingWartungId,
  formData,
  formError,
  isCrudRestricted,
  isSaving,
  successMessage,
  wartungen,
  onCancelEdit,
  onFieldChange,
  onSave,
  onStartEdit,
}: MaintenanceSectionProps) {
  const renderNaechsterTermin = (value?: string | null) => {
    const formattedDate = formatDisplayDate(value ?? '')
    const badgeClass = getWartungBadgeClass(value)

    return badgeClass ? <span className={badgeClass}>{formattedDate}</span> : formattedDate
  }

  return (
    <>
      {detailsError ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {detailsError}
        </div>
      ) : null}

      {successMessage ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {successMessage}
        </div>
      ) : null}

      <div className="rounded-lg border border-slate-200">
        {detailsLoading ? (
          <div className="px-4 py-6 text-sm text-slate-500">Wartungen werden geladen...</div>
        ) : wartungen.length === 0 ? (
          <div className="px-4 py-6 text-sm text-slate-500">Noch keine Wartungen vorhanden.</div>
        ) : (
          <div className="max-h-[350px] overflow-y-auto">
            <div className="space-y-3 p-3 md:hidden">
              {wartungen.map((wartung) => (
                <article
                  key={wartung.id}
                  className={`rounded-lg border bg-white p-4 ${
                    editingWartungId === wartung.id
                      ? 'border-[#0053a0] ring-2 ring-[#0053a0]/15'
                      : 'border-slate-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase text-slate-500">
                        Letzter Termin
                      </p>
                      <p className="mt-1 text-base font-semibold tabular-nums text-slate-900">
                        {formatDisplayDate(wartung.letzterTermin)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onStartEdit(wartung)}
                      className="min-h-11 shrink-0 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                    >
                      Bearbeiten
                    </button>
                  </div>

                  <dl className="mt-4 grid grid-cols-1 gap-3 text-sm">
                    <div>
                      <dt className="text-xs font-semibold uppercase text-slate-500">
                        Nächster Termin
                      </dt>
                      <dd className="mt-1 tabular-nums text-slate-800">
                        {renderNaechsterTermin(wartung.naechsterTermin)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs font-semibold uppercase text-slate-500">Grund</dt>
                      <dd className="mt-1 break-words text-slate-800">{wartung.grund ?? '-'}</dd>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <dt className="text-xs font-semibold uppercase text-slate-500">Ort</dt>
                        <dd className="mt-1 break-words text-slate-800">{wartung.ort}</dd>
                      </div>
                      <div>
                        <dt className="text-xs font-semibold uppercase text-slate-500">Kosten</dt>
                        <dd className="mt-1 text-slate-800">
                          {wartung.kosten === null ? '-' : formatCurrency(wartung.kosten)}
                        </dd>
                      </div>
                    </div>
                  </dl>
                </article>
              ))}
            </div>

            <table className="hidden w-full border-collapse text-sm md:table">
              <thead className="bg-slate-50">
                <tr className="border-b border-slate-200">
                  <th className="sticky top-0 z-10 bg-slate-50 px-4 py-2 text-left font-semibold text-slate-700">
                    Letzter Termin
                  </th>
                  <th className="sticky top-0 z-10 bg-slate-50 px-4 py-2 text-left font-semibold text-slate-700">
                    Nächster Termin
                  </th>
                  <th className="sticky top-0 z-10 bg-slate-50 px-4 py-2 text-left font-semibold text-slate-700">
                    Grund
                  </th>
                  <th className="sticky top-0 z-10 bg-slate-50 px-4 py-2 text-left font-semibold text-slate-700">
                    Ort
                  </th>
                  <th className="sticky top-0 z-10 bg-slate-50 px-4 py-2 text-left font-semibold text-slate-700">
                    Kosten
                  </th>
                </tr>
              </thead>
              <tbody>
                {wartungen.map((wartung) => (
                  <tr
                    key={wartung.id}
                    onClick={() => onStartEdit(wartung)}
                    className={`border-b border-slate-100 transition hover:bg-slate-50 ${
                      editingWartungId === wartung.id ? 'table-primary' : ''
                    }`}
                    style={{ cursor: 'pointer' }}
                  >
                    <td className="px-4 py-2 text-slate-700">
                      {formatDisplayDate(wartung.letzterTermin)}
                    </td>
                    <td className="px-4 py-2 text-slate-700">
                      {renderNaechsterTermin(wartung.naechsterTermin)}
                    </td>
                    <td className="px-4 py-2 text-slate-700">{wartung.grund ?? '-'}</td>
                    <td className="px-4 py-2 text-slate-700">{wartung.ort}</td>
                    <td className="px-4 py-2 text-slate-700">
                      {wartung.kosten === null ? '-' : formatCurrency(wartung.kosten)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <form
        onSubmit={onSave}
        className="grid grid-cols-1 gap-4 rounded-lg border border-slate-200 bg-slate-50 p-4 sm:grid-cols-2"
      >
        <div>
          <label className="block text-sm font-medium text-slate-700">Letzter Termin</label>
          <input
            type="date"
            value={formData.letzterTermin}
            onChange={(event) => onFieldChange('letzterTermin', event.target.value)}
            className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Nächster Termin</label>
          <input
            type="date"
            value={formData.naechsterTermin}
            onChange={(event) => onFieldChange('naechsterTermin', event.target.value)}
            className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Grund</label>
          <input
            type="text"
            value={formData.grund}
            onChange={(event) => onFieldChange('grund', event.target.value)}
            className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Ort</label>
          <input
            type="text"
            value={formData.ort}
            onChange={(event) => onFieldChange('ort', event.target.value)}
            className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Kosten</label>
          <input
            type="number"
            step="0.01"
            value={formData.kosten}
            onChange={(event) => onFieldChange('kosten', event.target.value)}
            className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
          />
        </div>

        {formError ? <p className="text-sm text-red-600 sm:col-span-2">{formError}</p> : null}

        <div className="sticky bottom-0 -mx-4 grid grid-cols-1 gap-2 bg-slate-50/95 px-4 py-3 sm:col-span-2 sm:mx-0 sm:flex sm:justify-end sm:px-0">
          {editingWartungId ? (
            <button
              type="button"
              onClick={onCancelEdit}
              className="min-h-11 rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
            >
              Neue Wartung
            </button>
          ) : null}
          <button
            type="submit"
            disabled={isCrudRestricted || isSaving}
            className={`min-h-11 rounded-lg px-4 py-2 text-sm font-semibold text-white ${
              isCrudRestricted || isSaving
                ? 'cursor-not-allowed bg-blue-400'
                : 'bg-blue-500 hover:bg-blue-600'
            }`}
          >
            {isSaving ? 'Speichern...' : editingWartungId ? 'Änderungen speichern' : 'Wartung anlegen'}
          </button>
        </div>
      </form>
    </>
  )
}

export default MaintenanceSection

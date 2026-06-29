import type { FormEvent } from 'react'
import type { Wartung, WartungFormData } from '../../../types/Wartung'
import { formatCurrency, formatDisplayDate } from '../utils'

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
          <div className="max-h-[350px] overflow-x-hidden overflow-y-auto">
            <table className="w-full border-collapse text-sm">
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
                      {formatDisplayDate(wartung.naechsterTermin ?? '')}
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
            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Nächster Termin</label>
          <input
            type="date"
            value={formData.naechsterTermin}
            onChange={(event) => onFieldChange('naechsterTermin', event.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Grund</label>
          <input
            type="text"
            value={formData.grund}
            onChange={(event) => onFieldChange('grund', event.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Ort</label>
          <input
            type="text"
            value={formData.ort}
            onChange={(event) => onFieldChange('ort', event.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Kosten</label>
          <input
            type="number"
            step="0.01"
            value={formData.kosten}
            onChange={(event) => onFieldChange('kosten', event.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
          />
        </div>

        {formError ? <p className="text-sm text-red-600 sm:col-span-2">{formError}</p> : null}

        <div className="flex flex-wrap justify-end gap-2 sm:col-span-2">
          {editingWartungId ? (
            <button
              type="button"
              onClick={onCancelEdit}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
            >
              Neue Wartung
            </button>
          ) : null}
          <button
            type="submit"
            disabled={isCrudRestricted || isSaving}
            className={`rounded-lg px-4 py-2 text-sm font-semibold text-white ${
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

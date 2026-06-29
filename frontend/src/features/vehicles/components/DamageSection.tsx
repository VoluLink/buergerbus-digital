import type { FormEvent } from 'react'
import type { Schaden, SchadenFormData } from '../../../types/Schaden'
import { formatDisplayDate } from '../utils'

interface DamageSectionProps {
  detailsError: string
  detailsLoading: boolean
  editingSchadenId: number | null
  formData: SchadenFormData
  formError: string
  isCrudRestricted: boolean
  isSaving: boolean
  schaeden: Schaden[]
  schadenStatusOptions: string[]
  successMessage: string
  onCancelEdit: () => void
  onFieldChange: (fieldName: keyof SchadenFormData, value: string) => void
  onSave: (event: FormEvent<HTMLFormElement>) => void
  onStartEdit: (schaden: Schaden) => void
}

function DamageSection({
  detailsError,
  detailsLoading,
  editingSchadenId,
  formData,
  formError,
  isCrudRestricted,
  isSaving,
  schaeden,
  schadenStatusOptions,
  successMessage,
  onCancelEdit,
  onFieldChange,
  onSave,
  onStartEdit,
}: DamageSectionProps) {
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
          <div className="px-4 py-6 text-sm text-slate-500">Schäden werden geladen...</div>
        ) : schaeden.length === 0 ? (
          <div className="px-4 py-6 text-sm text-slate-500">Noch keine Schäden vorhanden.</div>
        ) : (
          <div className="max-h-[350px] overflow-x-hidden overflow-y-auto">
            <table className="w-full border-collapse text-sm">
              <thead className="bg-slate-50">
                <tr className="border-b border-slate-200">
                  <th className="sticky top-0 z-10 bg-slate-50 px-4 py-2 text-left font-semibold text-slate-700">
                    Beschreibung
                  </th>
                  <th className="sticky top-0 z-10 bg-slate-50 px-4 py-2 text-left font-semibold text-slate-700">
                    Entstanden am
                  </th>
                  <th className="sticky top-0 z-10 bg-slate-50 px-4 py-2 text-left font-semibold text-slate-700">
                    Behoben am
                  </th>
                  <th className="sticky top-0 z-10 bg-slate-50 px-4 py-2 text-left font-semibold text-slate-700">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {schaeden.map((schaden) => (
                  <tr
                    key={schaden.id}
                    onClick={() => onStartEdit(schaden)}
                    className={`cursor-pointer border-b border-slate-100 transition hover:bg-slate-50 ${
                      editingSchadenId === schaden.id ? 'bg-[#0053a0]/10' : ''
                    }`}
                  >
                    <td className="px-4 py-2 text-slate-700 max-w-[220px] truncate">
                      {schaden.beschreibung}
                    </td>
                    <td className="px-4 py-2 text-slate-700">
                      {formatDisplayDate(schaden.entstandenAm)}
                    </td>
                    <td className="px-4 py-2 text-slate-700">
                      {formatDisplayDate(schaden.behobenAm ?? '')}
                    </td>
                    <td className="px-4 py-2 text-slate-700">{schaden.status}</td>
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
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-slate-700">Beschreibung</label>
          <textarea
            value={formData.beschreibung}
            onChange={(event) => onFieldChange('beschreibung', event.target.value)}
            rows={3}
            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Entstanden am</label>
          <input
            type="date"
            value={formData.entstandenAm}
            onChange={(event) => onFieldChange('entstandenAm', event.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Behoben am</label>
          <input
            type="date"
            value={formData.behobenAm}
            onChange={(event) => onFieldChange('behobenAm', event.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Status</label>
          <select
            value={formData.status}
            onChange={(event) => onFieldChange('status', event.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
          >
            {schadenStatusOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        {formError ? <p className="text-sm text-red-600 sm:col-span-2">{formError}</p> : null}

        <div className="flex flex-wrap justify-end gap-2 sm:col-span-2">
          {editingSchadenId ? (
            <button
              type="button"
              onClick={onCancelEdit}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
            >
              Neuer Schaden
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
            {isSaving ? 'Speichern...' : editingSchadenId ? 'Änderungen speichern' : 'Schaden anlegen'}
          </button>
        </div>
      </form>
    </>
  )
}

export default DamageSection

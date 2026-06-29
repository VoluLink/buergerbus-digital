import { Pencil, Trash2 } from 'lucide-react'
import type { Initiative } from '../../../types/Initiative'
import { formatDateDisplay, isDefaultInitiative } from '../utils'

type InitiativeTableProps = {
  initiatives: Initiative[]
  canManageInitiatives: boolean
  onEdit: (initiative: Initiative) => void
  onDelete: (initiative: Initiative) => void
}

export function InitiativeTable({
  initiatives,
  canManageInitiatives,
  onEdit,
  onDelete,
}: InitiativeTableProps) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50">
            <th className="px-4 py-3 text-left font-semibold text-slate-700">ID</th>
            <th className="px-4 py-3 text-left font-semibold text-slate-700">Name</th>
            <th className="px-4 py-3 text-left font-semibold text-slate-700">Beschreibung</th>
            <th className="px-4 py-3 text-left font-semibold text-slate-700">Angelegt am</th>
            <th className="px-4 py-3 text-left font-semibold text-slate-700">Geändert am</th>
            <th className="px-4 py-3 text-right font-semibold text-slate-700">Aktionen</th>
          </tr>
        </thead>
        <tbody>
          {initiatives.map((initiative) => (
            <tr key={initiative.id} className="border-b border-slate-100">
              <td className="px-4 py-3 tabular-nums">{initiative.id}</td>
              <td className="px-4 py-3 font-medium text-slate-900">{initiative.name}</td>
              <td className="px-4 py-3 text-slate-700">{initiative.beschreibung || '—'}</td>
              <td className="px-4 py-3 text-slate-700">{formatDateDisplay(initiative.angelegtAm)}</td>
              <td className="px-4 py-3 text-slate-700">{formatDateDisplay(initiative.geaendertAm)}</td>
              <td className="px-4 py-3">
                {canManageInitiatives ? (
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => onEdit(initiative)}
                      className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      <Pencil className="h-4 w-4" aria-hidden="true" />
                      Bearbeiten
                    </button>

                    <button
                      type="button"
                      onClick={() => onDelete(initiative)}
                      disabled={isDefaultInitiative(initiative)}
                      title={
                        isDefaultInitiative(initiative)
                          ? 'Die Standard-Initiative kann nicht gelöscht werden.'
                          : undefined
                      }
                      className="inline-flex items-center justify-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                      Löschen
                    </button>
                  </div>
                ) : (
                  <span className="text-xs text-slate-400">Nur Ansicht</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

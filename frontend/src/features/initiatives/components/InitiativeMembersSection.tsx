import type { Initiative } from '../../../types/Initiative'
import { InitiativeTable } from './InitiativeTable'

type InitiativeMembersSectionProps = {
  initiatives: Initiative[]
  canManageInitiatives: boolean
  isLoading: boolean
  loadError: string | null
  successMessage: string | null
  onCreate: () => void
  onEdit: (initiative: Initiative) => void
  onDelete: (initiative: Initiative) => void
}

export function InitiativeMembersSection({
  initiatives,
  canManageInitiatives,
  isLoading,
  loadError,
  successMessage,
  onCreate,
  onEdit,
  onDelete,
}: InitiativeMembersSectionProps) {
  return (
    <div className="p-3 sm:p-4 lg:p-6">
      <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-5 sm:p-6">
          <div>
            <h2 className="text-4xl font-bold tracking-tight text-slate-800">Initiativen</h2>
            <p className="mt-2 text-sm text-slate-600">
              Übersicht aller vorhandenen Initiativen.
            </p>
          </div>

          {canManageInitiatives ? (
            <button
              type="button"
              onClick={onCreate}
              className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              + Initiative hinzufügen
            </button>
          ) : null}
        </div>

        <div className="p-5 sm:p-6">
          {successMessage ? (
            <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
              {successMessage}
            </div>
          ) : null}

          {isLoading ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
              Lade Initiativen ...
            </div>
          ) : loadError ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
              {loadError}
            </div>
          ) : initiatives.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
              Keine Initiativen vorhanden.
            </div>
          ) : (
            <InitiativeTable
              initiatives={initiatives}
              canManageInitiatives={canManageInitiatives}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          )}
        </div>
      </section>
    </div>
  )
}

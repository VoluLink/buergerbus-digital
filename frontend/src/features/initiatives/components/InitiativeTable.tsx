import { Pencil, Trash2 } from 'lucide-react'
import type { Initiative } from '../../../types/Initiative'
import { formatDateDisplay, isDefaultInitiative } from '../utils'

type InitiativeWithMemberCount = Initiative & {
  mitgliederAnzahl?: number
  memberCount?: number
  userCount?: number
  users?: unknown[]
}

type InitiativeTableProps = {
  initiatives: Initiative[]
  canManageInitiatives: boolean
  onEdit: (initiative: Initiative) => void
  onDelete: (initiative: Initiative) => void
}

function getMemberCountLabel(initiative: Initiative) {
  const entry = initiative as InitiativeWithMemberCount
  const count = entry.mitgliederAnzahl ?? entry.memberCount ?? entry.userCount

  if (typeof count === 'number') {
    return String(count)
  }

  if (Array.isArray(entry.users)) {
    return String(entry.users.length)
  }

  return '-'
}

export function InitiativeTable({
  initiatives,
  canManageInitiatives,
  onEdit,
  onDelete,
}: InitiativeTableProps) {
  return (
    <>
      <div className="space-y-3 md:hidden">
        {initiatives.map((initiative) => {
          const isDefault = isDefaultInitiative(initiative)

          return (
            <article key={initiative.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="min-w-0 break-words text-base font-semibold text-slate-900">
                      {initiative.name}
                    </h3>
                    {isDefault ? (
                      <span className="rounded-full bg-[#0053a0]/10 px-2.5 py-1 text-xs font-semibold text-[#0053a0]">
                        Default
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-xs font-semibold uppercase text-slate-500">ID {initiative.id}</p>
                </div>
              </div>

              <p className="mt-3 break-words text-sm leading-6 text-slate-700">
                {initiative.beschreibung || 'Keine Beschreibung hinterlegt.'}
              </p>

              <dl className="mt-4 grid grid-cols-1 gap-3 text-sm">
                <div className="rounded-xl bg-slate-50 px-3 py-2">
                  <dt className="text-xs font-semibold uppercase text-slate-500">Mitglieder</dt>
                  <dd className="mt-1 break-words font-semibold text-slate-800">
                    {getMemberCountLabel(initiative)}
                  </dd>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="rounded-xl bg-slate-50 px-3 py-2">
                    <dt className="text-xs font-semibold uppercase text-slate-500">Angelegt am</dt>
                    <dd className="mt-1 break-words text-slate-700">{formatDateDisplay(initiative.angelegtAm)}</dd>
                  </div>
                  <div className="rounded-xl bg-slate-50 px-3 py-2">
                    <dt className="text-xs font-semibold uppercase text-slate-500">Geändert am</dt>
                    <dd className="mt-1 break-words text-slate-700">{formatDateDisplay(initiative.geaendertAm)}</dd>
                  </div>
                </div>
              </dl>

              <div className="mt-4">
                {canManageInitiatives ? (
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => onEdit(initiative)}
                      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      <Pencil className="h-4 w-4" aria-hidden="true" />
                      Bearbeiten
                    </button>

                    <button
                      type="button"
                      onClick={() => onDelete(initiative)}
                      disabled={isDefault}
                      title={isDefault ? 'Die Standard-Initiative kann nicht gelöscht werden.' : undefined}
                      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                      Löschen
                    </button>
                  </div>
                ) : (
                  <span className="text-xs text-slate-400">Nur Ansicht</span>
                )}
              </div>
            </article>
          )
        })}
      </div>

      <div className="hidden overflow-x-auto rounded-2xl border border-slate-200 md:block">
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
                <td className="px-4 py-3 text-slate-700">{initiative.beschreibung || '-'}</td>
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
    </>
  )
}

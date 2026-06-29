import type { Dispatch, FormEvent, SetStateAction } from 'react'
import { X } from 'lucide-react'
import type { InitiativeSummary, RoleSummary } from '../../../types/UserProfile'
import type { CreateUserForm } from '../types'

type CreateUserModalProps = {
  canManageRoleAssignments: boolean
  createError: string
  createFieldErrors: Record<string, string>
  createForm: CreateUserForm
  createRoleOptions: RoleSummary[]
  initiatives: InitiativeSummary[]
  isCreating: boolean
  isDisponent: boolean
  onClose: () => void
  onSubmit: () => void
  setCreateForm: Dispatch<SetStateAction<CreateUserForm>>
}

function CreateUserModal({
  canManageRoleAssignments,
  createError,
  createFieldErrors,
  createForm,
  createRoleOptions,
  initiatives,
  isCreating,
  isDisponent,
  onClose,
  onSubmit,
  setCreateForm,
}: CreateUserModalProps) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onSubmit()
  }

  return (
    <div className="fixed inset-0 z-40 flex items-start justify-center overflow-y-auto bg-slate-900/50 p-2 backdrop-blur-sm sm:items-center sm:p-4">
      <section
        className="flex max-h-[calc(100vh-1rem)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl sm:max-h-[90vh]"
        onClick={(event) => event.stopPropagation()}
        aria-label="Benutzer anlegen"
      >
        <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-4 sm:px-6">
          <h2 className="text-lg font-bold text-slate-800 sm:text-xl">Benutzer anlegen</h2>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label="Benutzer anlegen schließen"
            disabled={isCreating}
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        {createError ? (
          <p className="mx-4 mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 sm:mx-6">
            {createError}
          </p>
        ) : null}

        <form className="flex min-h-0 flex-1 flex-col" onSubmit={handleSubmit}>
          <div className="grid min-h-0 grid-cols-1 gap-4 overflow-y-auto px-4 py-5 sm:grid-cols-2 sm:px-6">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600">Rolle</label>
              <select
                value={createForm.roleId}
                onChange={(event) => setCreateForm((prev) => ({ ...prev, roleId: event.target.value }))}
                className="mt-1 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
                disabled={!canManageRoleAssignments || createRoleOptions.length === 0 || isCreating}
              >
                <option value="">Bitte wählen...</option>
                {createRoleOptions.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))}
              </select>
              {createFieldErrors.roleId ? (
                <p className="mt-1 text-xs text-rose-600">{createFieldErrors.roleId}</p>
              ) : null}
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600">Initiative</label>
              <select
                value={createForm.initiativeId}
                onChange={(event) => setCreateForm((prev) => ({ ...prev, initiativeId: event.target.value }))}
                className="mt-1 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
                disabled={!canManageRoleAssignments || initiatives.length === 0 || isCreating || isDisponent}
              >
                <option value="">Bitte wählen...</option>
                {initiatives.map((initiative) => (
                  <option key={initiative.id} value={initiative.id}>
                    {initiative.name}
                  </option>
                ))}
              </select>
              {createFieldErrors.initiativeId ? (
                <p className="mt-1 text-xs text-rose-600">{createFieldErrors.initiativeId}</p>
              ) : null}
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600">Name</label>
              <input
                type="text"
                value={createForm.name}
                onChange={(event) => setCreateForm((prev) => ({ ...prev, name: event.target.value }))}
                className="mt-1 min-h-11 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                disabled={!canManageRoleAssignments || isCreating}
              />
              {createFieldErrors.name ? (
                <p className="mt-1 text-xs text-rose-600">{createFieldErrors.name}</p>
              ) : null}
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600">E-Mail</label>
              <input
                type="email"
                value={createForm.email}
                onChange={(event) => setCreateForm((prev) => ({ ...prev, email: event.target.value }))}
                className="mt-1 min-h-11 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                disabled={!canManageRoleAssignments || isCreating}
              />
              {createFieldErrors.email ? (
                <p className="mt-1 text-xs text-rose-600">{createFieldErrors.email}</p>
              ) : null}
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600">Passwort</label>
              <input
                type="password"
                value={createForm.password}
                onChange={(event) => setCreateForm((prev) => ({ ...prev, password: event.target.value }))}
                className="mt-1 min-h-11 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                disabled={!canManageRoleAssignments || isCreating}
              />
              {createFieldErrors.password ? (
                <p className="mt-1 text-xs text-rose-600">{createFieldErrors.password}</p>
              ) : null}
            </div>
          </div>

          <div className="flex shrink-0 flex-col-reverse gap-3 border-t border-slate-200 px-4 py-4 sm:flex-row sm:justify-end sm:px-6">
            <button
              type="button"
              onClick={onClose}
              className="min-h-11 rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
              disabled={isCreating}
            >
              Schließen
            </button>
            <button
              type="submit"
              className="min-h-11 rounded-xl bg-[#0053a0] px-5 py-2.5 text-sm font-semibold text-white hover:brightness-110 disabled:opacity-60"
              disabled={!canManageRoleAssignments || isCreating}
            >
              {isCreating ? 'Wird angelegt...' : 'Benutzer anlegen'}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}

export default CreateUserModal

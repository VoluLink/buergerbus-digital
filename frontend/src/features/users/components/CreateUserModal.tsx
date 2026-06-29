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
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
    >
      <section
        className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl"
        onClick={(event) => event.stopPropagation()}
        aria-label="Benutzer anlegen"
      >
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <h2 className="text-xl font-bold text-slate-800">Benutzer anlegen</h2>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label="Benutzer anlegen schließen"
            disabled={isCreating}
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        {createError ? (
          <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {createError}
          </p>
        ) : null}

        <form
          className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2"
          onSubmit={handleSubmit}
        >
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600">Rolle</label>
            <select
              value={createForm.roleId}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, roleId: event.target.value }))}
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
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
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
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
              className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
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
              className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
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
              className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
              disabled={!canManageRoleAssignments || isCreating}
            />
            {createFieldErrors.password ? (
              <p className="mt-1 text-xs text-rose-600">{createFieldErrors.password}</p>
            ) : null}
          </div>

          <div className="sm:col-span-2 mt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
              disabled={isCreating}
            >
              Schließen
            </button>
            <button
              type="submit"
              className="rounded-xl bg-[#0053a0] px-5 py-2.5 text-sm font-semibold text-white hover:brightness-110 disabled:opacity-60"
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

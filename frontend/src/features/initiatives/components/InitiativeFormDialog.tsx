import { X } from 'lucide-react'
import type { Initiative } from '../../../types/Initiative'
import type { InitiativeFormState } from '../types'
import { formatDateDisplay } from '../utils'

type InitiativeFormDialogProps = {
  mode: 'create' | 'edit'
  form: InitiativeFormState
  initiative?: Initiative
  error: string | null
  isSaving: boolean
  onClose: () => void
  onSubmit: () => void
  onFieldChange: (field: keyof InitiativeFormState, value: string) => void
}

export function InitiativeFormDialog({
  mode,
  form,
  initiative,
  error,
  isSaving,
  onClose,
  onSubmit,
  onFieldChange,
}: InitiativeFormDialogProps) {
  const isCreate = mode === 'create'

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/50 p-2 backdrop-blur-sm sm:p-4">
      <section
        className="relative flex h-[calc(100dvh-1rem)] w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-white shadow-[0_35px_80px_rgba(15,23,42,0.4)] sm:h-auto sm:max-h-[calc(100dvh-2rem)]"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="shrink-0 bg-[#0053a0] px-5 py-4 text-white sm:px-8 sm:py-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h2 className="break-words text-2xl font-semibold tracking-tight sm:text-4xl">
                {isCreate ? 'Initiative hinzufügen' : 'Initiative bearbeiten'}
              </h2>
              <p className="mt-1 break-words text-sm text-white/80">
                {isCreate ? 'Name und Beschreibung angeben.' : 'Name und Beschreibung anpassen.'}
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
              aria-label="Modal schließen"
              disabled={isSaving}
            >
              <X className="h-7 w-7" aria-hidden="true" />
            </button>
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-8 sm:py-6">
          <div className="space-y-5">
            {error ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                {error}
              </div>
            ) : null}

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-semibold text-slate-700">
                Name
                <input
                  type="text"
                  value={form.name}
                  onChange={(event) => onFieldChange('name', event.target.value)}
                  className="mt-1 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#0053a0] focus:ring-2 focus:ring-[#0053a0]/15"
                  placeholder="z.B. Neue Initiative"
                  disabled={!isCreate && isSaving}
                />
              </label>

              <label className="block text-sm font-semibold text-slate-700">
                Beschreibung
                <input
                  type="text"
                  value={form.beschreibung}
                  onChange={(event) => onFieldChange('beschreibung', event.target.value)}
                  className="mt-1 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#0053a0] focus:ring-2 focus:ring-[#0053a0]/15"
                  placeholder="Beschreibung der Initiative"
                  disabled={!isCreate && isSaving}
                />
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <label className="block text-sm font-semibold text-slate-700">
                ID
                <input
                  type="text"
                  disabled
                  value={isCreate ? 'Wird automatisch vergeben' : initiative?.id}
                  className="mt-1 min-h-11 w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500"
                />
              </label>

              <label className="block text-sm font-semibold text-slate-700">
                Angelegt am
                <input
                  type="text"
                  disabled
                  value={isCreate ? 'Wird automatisch gesetzt' : formatDateDisplay(initiative?.angelegtAm)}
                  className="mt-1 min-h-11 w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500"
                />
              </label>

              <label className="block text-sm font-semibold text-slate-700">
                Geändert am
                <input
                  type="text"
                  disabled
                  value={isCreate ? 'Wird automatisch gesetzt' : formatDateDisplay(initiative?.geaendertAm)}
                  className="mt-1 min-h-11 w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500"
                />
              </label>
            </div>
          </div>
        </div>

        <footer className="flex shrink-0 flex-col-reverse gap-3 border-t border-slate-200 bg-white px-5 py-4 pb-[calc(env(safe-area-inset-bottom)+12px)] sm:flex-row sm:items-center sm:justify-end sm:px-8 sm:pb-4">
          <button
            type="button"
            onClick={onClose}
            className="min-h-11 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isSaving}
          >
            Abbrechen
          </button>

          <button
            type="button"
            onClick={onSubmit}
            className="min-h-11 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isSaving}
          >
            {isSaving ? 'Speichere...' : 'Speichern'}
          </button>
        </footer>
      </section>
    </div>
  )
}

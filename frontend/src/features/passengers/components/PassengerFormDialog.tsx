import type { FormEvent } from 'react'
import { X } from 'lucide-react'
import type { FahrgastFormData } from '../../../types/Fahrgast'
import type { Initiative } from '../../../types/Initiative'

type PassengerFormDialogProps = {
  error: string
  form: FahrgastFormData
  initiatives: Initiative[]
  initiativesError?: string
  isAdmin: boolean
  nonAdminInitiativeName: string
  submitLabel: string
  title: string
  closeLabel: string
  submitClassName: string
  onClose: () => void
  onFieldChange: (field: keyof FahrgastFormData, value: string) => void
  onSubmit: () => void
}

export function PassengerFormDialog({
  error,
  form,
  initiatives,
  initiativesError = '',
  isAdmin,
  nonAdminInitiativeName,
  submitLabel,
  title,
  closeLabel,
  submitClassName,
  onClose,
  onFieldChange,
  onSubmit,
}: PassengerFormDialogProps) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onSubmit()
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <section
        className="w-full max-w-3xl rounded-2xl bg-white p-6 shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <h2 className="text-xl font-bold text-slate-800">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label={closeLabel}
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <form className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2" onSubmit={handleSubmit}>
          {error ? (
            <p className="sm:col-span-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
              {error}
            </p>
          ) : null}

          {initiativesError && isAdmin ? (
            <p className="sm:col-span-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              {initiativesError}
            </p>
          ) : null}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600">Vorname</label>
            <input
              type="text"
              value={form.vorname ?? ''}
              onChange={(event) => onFieldChange('vorname', event.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600">Nachname</label>
            <input
              type="text"
              value={form.nachname ?? ''}
              onChange={(event) => onFieldChange('nachname', event.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600">Adresse</label>
            <input
              type="text"
              value={form.adresse ?? ''}
              onChange={(event) => onFieldChange('adresse', event.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600">E-Mail</label>
            <input
              type="email"
              value={form.email ?? ''}
              onChange={(event) => onFieldChange('email', event.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600">Telefonnummer</label>
            <input
              type="text"
              value={form.telefonnummer ?? ''}
              onChange={(event) => onFieldChange('telefonnummer', event.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600">Letzte Nutzung</label>
            <input
              type="date"
              value={form.letzteNutzung ?? ''}
              readOnly
              className="mt-1 w-full rounded-xl border border-slate-300 bg-slate-100 px-3 py-2 text-sm text-slate-500"
            />
            <p className="mt-1 text-xs text-slate-500">Wird automatisch durch Fahrten aktualisiert.</p>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600">Aktiv</label>
            <select
              value={form.aktiv ?? 'true'}
              onChange={(event) => onFieldChange('aktiv', event.target.value as 'true' | 'false')}
              className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="true">Ja</option>
              <option value="false">Nein</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600">Initiative</label>
            {isAdmin ? (
              <select
                value={form.initiativeId ?? ''}
                onChange={(event) => onFieldChange('initiativeId', event.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="" disabled>
                  Bitte wählen
                </option>
                {initiatives.map((initiative) => (
                  <option key={initiative.id} value={String(initiative.id)}>
                    {initiative.name}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={nonAdminInitiativeName}
                disabled
                className="mt-1 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-700"
              />
            )}
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600">Bemerkungen</label>
            <textarea
              value={form.bemerkung ?? ''}
              onChange={(event) => onFieldChange('bemerkung', event.target.value)}
              rows={3}
              className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
            />
          </div>

          <div className="sm:col-span-2 mt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Abbrechen
            </button>
            <button type="submit" className={submitClassName}>
              {submitLabel}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}

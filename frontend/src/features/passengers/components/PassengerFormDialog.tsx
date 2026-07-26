import type { FormEvent } from 'react'
import { X } from 'lucide-react'
import type { FahrgastFormData } from '../../../types/Fahrgast'
import type { Initiative } from '../../../types/Initiative'
import { useDialogAccessibility } from '../../../components/dialogs/useDialogAccessibility'
import { ui } from '../../../design/ui'

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
  const { dialogRef, handleKeyDown } = useDialogAccessibility<HTMLElement>(onClose)
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onSubmit()
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/50 p-2 backdrop-blur-sm sm:p-4">
      <section
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="passenger-dialog-title"
        tabIndex={-1}
        onKeyDown={handleKeyDown}
        className="flex h-[calc(100dvh-1rem)] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl sm:h-auto sm:max-h-[calc(100dvh-2rem)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-4 py-4 sm:px-6">
          <h2 id="passenger-dialog-title" className="text-xl font-bold text-slate-800">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label={closeLabel}
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <form className="flex min-h-0 flex-1 flex-col" onSubmit={handleSubmit}>
          <div className="grid min-h-0 grid-cols-1 gap-4 overflow-y-auto px-4 py-5 sm:grid-cols-2 sm:px-6">
            {error ? (
              <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 sm:col-span-2">
                {error}
              </p>
            ) : null}

            {initiativesError && isAdmin ? (
              <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 sm:col-span-2">
                {initiativesError}
              </p>
            ) : null}

            <div>
              <label className={ui.label}>Vorname <span className="text-rose-700" aria-label="Pflichtfeld">*</span></label>
              <input
                type="text"
                required
                value={form.vorname ?? ''}
                onChange={(event) => onFieldChange('vorname', event.target.value)}
                className={ui.field}
              />
            </div>

            <div>
              <label className={ui.label}>Nachname <span className="text-rose-700" aria-label="Pflichtfeld">*</span></label>
              <input
                type="text"
                required
                value={form.nachname ?? ''}
                onChange={(event) => onFieldChange('nachname', event.target.value)}
                className={ui.field}
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600">Adresse</label>
              <input
                type="text"
                value={form.adresse ?? ''}
                onChange={(event) => onFieldChange('adresse', event.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-3 text-sm sm:py-2"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600">E-Mail</label>
              <input
                type="email"
                value={form.email ?? ''}
                onChange={(event) => onFieldChange('email', event.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-3 text-sm sm:py-2"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600">Telefonnummer</label>
              <input
                type="text"
                value={form.telefonnummer ?? ''}
                onChange={(event) => onFieldChange('telefonnummer', event.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-3 text-sm sm:py-2"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600">Letzte Nutzung</label>
              <input
                type="date"
                value={form.letzteNutzung ?? ''}
                readOnly
                className="mt-1 w-full rounded-xl border border-slate-300 bg-slate-100 px-3 py-3 text-sm text-slate-500 sm:py-2"
              />
              <p className="mt-1 text-xs text-slate-500">Wird automatisch durch Fahrten aktualisiert.</p>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600">Aktiv</label>
              <select
                value={form.aktiv ?? 'true'}
                onChange={(event) => onFieldChange('aktiv', event.target.value as 'true' | 'false')}
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-3 text-sm sm:py-2"
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
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-3 text-sm sm:py-2"
                >
                  <option value="" disabled>
                    {'Bitte w\u00e4hlen'}
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
                  className="mt-1 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-3 text-sm text-slate-700 sm:py-2"
                />
              )}
            </div>

            <div className="sm:col-span-2">
              <label className={ui.label}>Bemerkungen</label>
              <textarea
                value={form.bemerkung ?? ''}
                onChange={(event) => onFieldChange('bemerkung', event.target.value)}
                rows={3}
                maxLength={1000}
                aria-describedby="passenger-remarks-counter"
                className={ui.field}
              />
              <p id="passenger-remarks-counter" className="mt-1 text-right text-xs text-slate-500">{(form.bemerkung ?? '').length}/1000 Zeichen</p>
            </div>
          </div>

          <div className="flex shrink-0 flex-col-reverse gap-3 border-t border-slate-200 bg-white px-4 py-4 pb-[calc(env(safe-area-inset-bottom)+12px)] sm:flex-row sm:justify-end sm:px-6 sm:pb-4">
            <button
              type="button"
              onClick={onClose}
              className={ui.secondaryButton}
            >
              Abbrechen
            </button>
            <button type="submit" className={`${ui.primaryButton} ${submitClassName}`}>
              {submitLabel}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}

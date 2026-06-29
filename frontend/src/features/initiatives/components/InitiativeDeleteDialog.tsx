import { X } from 'lucide-react'
import type { Initiative, InitiativeDeletePreview as InitiativeDeletePreviewType } from '../../../types/Initiative'
import { isDefaultInitiative } from '../utils'
import { InitiativeDeletePreview } from './InitiativeDeletePreview'

type InitiativeDeleteDialogProps = {
  initiative: Initiative
  deleteError: string | null
  deletePreviewError: string | null
  deletePreview: InitiativeDeletePreviewType | null
  isDeleting: boolean
  isDeletePreviewLoading: boolean
  onClose: () => void
  onDelete: () => void
}

export function InitiativeDeleteDialog({
  initiative,
  deleteError,
  deletePreviewError,
  deletePreview,
  isDeleting,
  isDeletePreviewLoading,
  onClose,
  onDelete,
}: InitiativeDeleteDialogProps) {
  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <section
        className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-[0_35px_80px_rgba(15,23,42,0.4)]"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="bg-rose-600 px-6 py-5 text-white sm:px-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-3xl font-semibold tracking-tight">Initiative löschen</h2>
              <p className="mt-1 text-sm text-white/80">
                Möchtest du diese Initiative wirklich löschen?
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-11 w-11 items-center justify-center rounded-xl text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
              aria-label="Modal schließen"
              disabled={isDeleting}
            >
              <X className="h-7 w-7" aria-hidden="true" />
            </button>
          </div>
        </header>

        <div className="space-y-5 px-6 py-6 sm:px-8">
          {deleteError ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
              {deleteError}
            </div>
          ) : null}

          {deletePreviewError ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
              {deletePreviewError}
            </div>
          ) : null}

          <InitiativeDeletePreview
            initiative={initiative}
            deletePreview={deletePreview}
            isDeletePreviewLoading={isDeletePreviewLoading}
          />

          <div className="flex flex-wrap items-center justify-end gap-3 border-t border-slate-200 pt-5">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isDeleting}
            >
              Abbrechen
            </button>

            <button
              type="button"
              onClick={onDelete}
              className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={
                isDeleting ||
                isDefaultInitiative(initiative) ||
                isDeletePreviewLoading
              }
            >
              {isDeleting ? 'Lösche...' : 'Löschen'}
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}

import { X } from 'lucide-react'
import type { Initiative, InitiativeDeletePreview as InitiativeDeletePreviewType } from '../../../types/Initiative'
import { isDefaultInitiative } from '../utils'
import { InitiativeDeletePreview } from './InitiativeDeletePreview'
import { useDialogAccessibility } from '../../../components/dialogs/useDialogAccessibility'

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
  const { dialogRef, handleKeyDown } = useDialogAccessibility<HTMLElement>(onClose)
  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/50 p-2 backdrop-blur-sm sm:p-4"
      onClick={onClose}
    >
      <section
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="initiative-delete-dialog-title"
        tabIndex={-1}
        onKeyDown={handleKeyDown}
        className="relative flex max-h-[calc(100dvh-1rem)] w-full max-w-lg flex-col overflow-hidden rounded-3xl bg-white shadow-[0_35px_80px_rgba(15,23,42,0.4)] sm:max-h-[calc(100dvh-2rem)]"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="shrink-0 bg-rose-600 px-5 py-4 text-white sm:px-8 sm:py-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h2 id="initiative-delete-dialog-title" className="break-words text-2xl font-semibold tracking-tight sm:text-3xl">Initiative löschen</h2>
              <p className="mt-1 break-words text-sm text-white/80">
                Möchtest du diese Initiative wirklich löschen?
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
              aria-label="Modal schließen"
              disabled={isDeleting}
            >
              <X className="h-7 w-7" aria-hidden="true" />
            </button>
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-8 sm:py-6">
          <div className="space-y-5">
            {deleteError ? (
              <div className="break-words rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                {deleteError}
              </div>
            ) : null}

            {deletePreviewError ? (
              <div className="break-words rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
                {deletePreviewError}
              </div>
            ) : null}

            <InitiativeDeletePreview
              initiative={initiative}
              deletePreview={deletePreview}
              isDeletePreviewLoading={isDeletePreviewLoading}
            />
          </div>
        </div>

        <footer className="flex shrink-0 flex-col-reverse gap-3 border-t border-slate-200 bg-white px-5 py-4 pb-[calc(env(safe-area-inset-bottom)+12px)] sm:flex-row sm:items-center sm:justify-end sm:px-8 sm:pb-4">
          <button
            type="button"
            onClick={onClose}
            className="min-h-11 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isDeleting}
          >
            Abbrechen
          </button>

          <button
            type="button"
            onClick={onDelete}
            className="min-h-11 rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={
              isDeleting ||
              isDefaultInitiative(initiative) ||
              isDeletePreviewLoading
            }
          >
            {isDeleting ? 'Lösche...' : 'Löschen'}
          </button>
        </footer>
      </section>
    </div>
  )
}

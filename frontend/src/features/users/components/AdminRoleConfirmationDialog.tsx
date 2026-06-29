import { AlertTriangle } from 'lucide-react'
import type { PendingAdminConfirmation } from '../types'

type AdminRoleConfirmationDialogProps = {
  isCreating: boolean
  onCancel: () => void
  onConfirm: () => void
  pendingAdminConfirmation: PendingAdminConfirmation
  savingUserId: number | null
}

function AdminRoleConfirmationDialog({
  isCreating,
  onCancel,
  onConfirm,
  pendingAdminConfirmation,
  savingUserId,
}: AdminRoleConfirmationDialogProps) {
  const isExistingUserUpdatePending =
    pendingAdminConfirmation.kind === 'existing-user'
    && savingUserId === pendingAdminConfirmation.userId

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/55 p-4 backdrop-blur-sm"
      onClick={onCancel}
    >
      <section
        className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl"
        onClick={(event) => event.stopPropagation()}
        aria-label="Admin-Rolle bestätigen"
      >
        <div className="flex items-start gap-4">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
            <AlertTriangle className="h-6 w-6" aria-hidden="true" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-slate-800">Admin-Rolle bestätigen</h2>
            <p className="mt-2 text-sm text-slate-600">
              {pendingAdminConfirmation.kind === 'existing-user'
                ? `Sind Sie sicher, dass Sie ${pendingAdminConfirmation.userName} die Rolle Admin zuweisen möchten?`
                : `Sind Sie sicher, dass Sie den neuen Benutzer ${pendingAdminConfirmation.userName} mit der Rolle Admin anlegen möchten?`}
            </p>
            <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Die Rolle Admin vergibt weitreichende Berechtigungen. Bitte bestätigen Sie diese Zuweisung ausdrücklich.
            </p>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
            disabled={isCreating || isExistingUserUpdatePending}
          >
            Abbrechen
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-xl bg-amber-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-700 disabled:opacity-60"
            disabled={isCreating || isExistingUserUpdatePending}
          >
            Bestätigen
          </button>
        </div>
      </section>
    </div>
  )
}

export default AdminRoleConfirmationDialog

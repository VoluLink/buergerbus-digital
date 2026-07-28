import { useId } from 'react'
import { useDialogAccessibility } from './useDialogAccessibility'

type ConfirmationDialogProps = {
  isOpen: boolean
  title: string
  description: string
  confirmLabel?: string
  onCancel: () => void
  onConfirm: () => void
  isConfirming?: boolean
  tone?: 'danger' | 'primary'
}

export function ConfirmationDialog({
  isOpen,
  title,
  description,
  confirmLabel = 'Bestätigen',
  onCancel,
  onConfirm,
  isConfirming = false,
  tone = 'danger',
}: ConfirmationDialogProps) {
  const titleId = useId()
  const { dialogRef, handleKeyDown } = useDialogAccessibility<HTMLElement>(onCancel, isOpen)

  if (!isOpen) return null

  const confirmClassName = tone === 'danger'
    ? 'bg-rose-600 hover:bg-rose-700'
    : 'bg-[#0053a0] hover:bg-[#004783]'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm" onMouseDown={onCancel}>
      <section
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onKeyDown={handleKeyDown}
        onMouseDown={(event) => event.stopPropagation()}
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
      >
        <h2 id={titleId} className="text-xl font-bold text-slate-900">{title}</h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">{description}</p>
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button type="button" onClick={onCancel} disabled={isConfirming} className="min-h-11 rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">
            Abbrechen
          </button>
          <button type="button" onClick={onConfirm} disabled={isConfirming} className={`min-h-11 rounded-xl px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 ${confirmClassName}`}>
            {isConfirming ? 'Wird verarbeitet …' : confirmLabel}
          </button>
        </div>
      </section>
    </div>
  )
}

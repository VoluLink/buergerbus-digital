import { Trash2 } from 'lucide-react'

type AccountDeleteSectionProps = {
  onDeleteProfile: () => void
}

export function AccountDeleteSection({ onDeleteProfile }: AccountDeleteSectionProps) {
  return (
    <button
      type="button"
      onClick={onDeleteProfile}
      className="inline-flex items-center gap-2 rounded-lg border border-red-300 bg-white px-4 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50"
    >
      <Trash2 className="h-3 w-3" aria-hidden="true" />
      Löschen
    </button>
  )
}

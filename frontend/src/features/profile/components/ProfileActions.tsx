import { LogOut } from 'lucide-react'
import { AccountDeleteSection } from './AccountDeleteSection'

type ProfileActionsProps = {
  isSaving: boolean
  onLogout: () => void
  onDeleteProfile: () => void
  onSaveProfile: () => void
}

export function ProfileActions({
  isSaving,
  onLogout,
  onDeleteProfile,
  onSaveProfile,
}: ProfileActionsProps) {
  return (
    <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-200 pt-4">
      <button
        type="button"
        onClick={onLogout}
        className="inline-flex items-center gap-2 rounded-lg border border-rose-200 bg-white px-4 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-50"
      >
        <LogOut className="h-3 w-3" aria-hidden="true" />
        Abmelden
      </button>

      <AccountDeleteSection onDeleteProfile={onDeleteProfile} />

      <button
        type="button"
        onClick={onSaveProfile}
        disabled={isSaving}
        className={`ml-auto inline-flex items-center gap-2 rounded-lg bg-[#0053a0] px-4 py-2 text-xs font-semibold text-white shadow-md transition hover:brightness-105 ${
          isSaving ? 'opacity-60 cursor-not-allowed' : ''
        }`}
      >
        {isSaving ? 'Speichere...' : 'Speichern'}
      </button>
    </div>
  )
}

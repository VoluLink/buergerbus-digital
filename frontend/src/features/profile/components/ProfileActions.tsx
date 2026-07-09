type ProfileActionsProps = {
  isSaving: boolean
  onSaveProfile: () => void
}

export function ProfileActions({
  isSaving,
  onSaveProfile,
}: ProfileActionsProps) {
  return (
    <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-200 pt-4">
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

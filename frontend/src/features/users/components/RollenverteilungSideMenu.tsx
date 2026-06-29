import { Bus, Settings, UserRound, UserRoundPlus, X } from 'lucide-react'

type RollenverteilungSideMenuProps = {
  canManageInitiatives: boolean
  isFahrer: boolean
  onClose: () => void
  onNavigate: (path: string) => void
}

function RollenverteilungSideMenu({
  canManageInitiatives,
  isFahrer,
  onClose,
  onNavigate,
}: RollenverteilungSideMenuProps) {
  return (
    <div className="fixed inset-0 z-30 bg-slate-900/45 backdrop-blur-[2px]" onClick={onClose}>
      <aside
        className="h-full w-full max-w-sm bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
        aria-label="Seitliche Navigation"
      >
        <div className="flex items-center justify-between bg-[#0053a0] px-6 py-5 text-white">
          <h2 className="text-4xl font-semibold tracking-tight">Navigation</h2>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl text-white transition hover:bg-white/10"
            aria-label="Navigation schließen"
          >
            <X className="h-7 w-7" aria-hidden="true" />
          </button>
        </div>

        <div className="space-y-3 p-4">
          <button
            type="button"
            onClick={() => onNavigate('/dashboard')}
            className="flex w-full items-center gap-3 rounded-2xl bg-[#0053a0]/12 px-4 py-3 text-left text-lg font-medium text-[#0053a0]"
          >
            <Bus className="h-5 w-5" aria-hidden="true" />
            Dashboard
          </button>

          {!isFahrer ? (
            <button
              type="button"
              onClick={() => onNavigate('/fahrerinfos')}
              className="flex w-full items-center gap-3 rounded-2xl bg-[#0053a0]/12 px-4 py-3 text-left text-lg font-medium text-[#0053a0]"
            >
              <UserRound className="h-5 w-5" aria-hidden="true" />
              Fahrerinfos
            </button>
          ) : null}

          <button
            type="button"
            onClick={() => onNavigate('/fahrzeuginfos')}
            className="flex w-full items-center gap-3 rounded-2xl bg-[#0053a0]/12 px-4 py-3 text-left text-lg font-medium text-[#0053a0]"
          >
            <Bus className="h-5 w-5" aria-hidden="true" />
            Fahrzeuginfos
          </button>

          {!isFahrer ? (
            <button
              type="button"
              onClick={() => onNavigate('/fahrgastinfos')}
              className="flex w-full items-center gap-3 rounded-2xl bg-[#0053a0]/12 px-4 py-3 text-left text-lg font-medium text-[#0053a0]"
            >
              <UserRoundPlus className="h-5 w-5" aria-hidden="true" />
              Fahrgastinfos
            </button>
          ) : null}

          {canManageInitiatives ? (
            <button
              type="button"
              onClick={() => onNavigate('/initiativen')}
              className="flex w-full items-center gap-3 rounded-2xl bg-[#0053a0]/12 px-4 py-3 text-left text-lg font-medium text-[#0053a0]"
            >
              <Bus className="h-5 w-5" aria-hidden="true" />
              Initiativen
            </button>
          ) : null}

          {!isFahrer ? (
            <button
              type="button"
              onClick={() => onNavigate('/rollenverteilung')}
              className="flex w-full items-center gap-3 rounded-2xl bg-[#0053a0] px-4 py-3 text-left text-lg font-medium text-white"
            >
              <Settings className="h-5 w-5" aria-hidden="true" />
              Rollenverteilung
            </button>
          ) : null}
        </div>
      </aside>
    </div>
  )
}

export default RollenverteilungSideMenu

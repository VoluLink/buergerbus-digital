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
  const itemClass = 'flex min-h-11 w-full items-center gap-3 rounded-xl bg-[#0053a0]/12 px-4 py-3 text-left text-base font-medium text-[#0053a0] sm:rounded-2xl sm:text-lg'

  return (
    <div className="fixed inset-0 z-30 overflow-hidden bg-slate-900/45 backdrop-blur-[2px]" onClick={onClose}>
      <aside
        className="h-full w-full max-w-sm overflow-y-auto bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
        aria-label="Seitliche Navigation"
      >
        <div className="flex items-center justify-between gap-3 bg-[#0053a0] px-4 py-4 text-white sm:px-6 sm:py-5">
          <h2 className="min-w-0 break-words text-2xl font-semibold tracking-tight sm:text-4xl">Navigation</h2>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white transition hover:bg-white/10"
            aria-label="Navigation schließen"
          >
            <X className="h-7 w-7" aria-hidden="true" />
          </button>
        </div>

        <div className="space-y-3 p-4">
          <button
            type="button"
            onClick={() => onNavigate('/dashboard')}
            className={itemClass}
          >
            <Bus className="h-5 w-5 shrink-0" aria-hidden="true" />
            <span className="min-w-0 break-words">Dashboard</span>
          </button>

          {!isFahrer ? (
            <button
              type="button"
              onClick={() => onNavigate('/fahrerinfos')}
              className={itemClass}
            >
              <UserRound className="h-5 w-5 shrink-0" aria-hidden="true" />
              <span className="min-w-0 break-words">Fahrerinfos</span>
            </button>
          ) : null}

          <button
            type="button"
            onClick={() => onNavigate('/fahrzeuginfos')}
            className={itemClass}
          >
            <Bus className="h-5 w-5 shrink-0" aria-hidden="true" />
            <span className="min-w-0 break-words">Fahrzeuginfos</span>
          </button>

          {!isFahrer ? (
            <button
              type="button"
              onClick={() => onNavigate('/fahrgastinfos')}
              className={itemClass}
            >
              <UserRoundPlus className="h-5 w-5 shrink-0" aria-hidden="true" />
              <span className="min-w-0 break-words">Fahrgastinfos</span>
            </button>
          ) : null}

          {canManageInitiatives ? (
            <button
              type="button"
              onClick={() => onNavigate('/initiativen')}
              className={itemClass}
            >
              <Bus className="h-5 w-5 shrink-0" aria-hidden="true" />
              <span className="min-w-0 break-words">Initiativen</span>
            </button>
          ) : null}

          {!isFahrer ? (
            <button
              type="button"
              onClick={() => onNavigate('/rollenverteilung')}
              className="flex min-h-11 w-full items-center gap-3 rounded-xl bg-[#0053a0] px-4 py-3 text-left text-base font-medium text-white sm:rounded-2xl sm:text-lg"
            >
              <Settings className="h-5 w-5 shrink-0" aria-hidden="true" />
              <span className="min-w-0 break-words">Rollenverteilung</span>
            </button>
          ) : null}
        </div>
      </aside>
    </div>
  )
}

export default RollenverteilungSideMenu

import { Bus, CircleUserRound, Menu, Settings, UserRound, UserRoundPlus, X } from 'lucide-react'
import UserMenuButton from '../../../components/UserMenuButton'

type PassengerHeaderProps = {
  canManageInitiatives: boolean
  isFahrer: boolean
  isSideMenuOpen: boolean
  onCloseSideMenu: () => void
  onGoToPage: (path: string) => void
  onOpenProfile: () => void
  onOpenSideMenu: () => void
}

export function PassengerHeader({
  canManageInitiatives,
  isFahrer,
  isSideMenuOpen,
  onCloseSideMenu,
  onGoToPage,
  onOpenProfile,
  onOpenSideMenu,
}: PassengerHeaderProps) {
  return (
    <>
      <header className="border-b border-slate-200 bg-white/95 px-4 py-3 shadow-sm backdrop-blur sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onOpenSideMenu}
              className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0053a0]/40"
              aria-label="Navigation öffnen"
            >
              <Menu className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>

          <UserMenuButton
            onClick={onOpenProfile}
            icon={<CircleUserRound className="h-6 w-6" aria-hidden="true" />}
          />
        </div>
      </header>

      {isSideMenuOpen ? (
        <div className="fixed inset-0 z-30 bg-slate-900/45 backdrop-blur-[2px]" onClick={onCloseSideMenu}>
          <aside
            className="h-full w-full max-w-sm bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
            aria-label="Seitliche Navigation"
          >
            <div className="flex items-center justify-between bg-[#0053a0] px-5 py-4 text-white sm:px-6 sm:py-5">
              <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Navigation</h2>
              <button
                type="button"
                onClick={onCloseSideMenu}
                className="inline-flex h-11 w-11 items-center justify-center rounded-xl text-white transition hover:bg-white/10"
                aria-label="Navigation schließen"
              >
                <X className="h-7 w-7" aria-hidden="true" />
              </button>
            </div>

            <div className="space-y-3 p-3 sm:p-4">
              <button
                type="button"
                onClick={() => onGoToPage('/dashboard')}
                className="flex w-full items-center gap-3 rounded-2xl bg-[#0053a0]/12 px-4 py-3 text-left text-lg font-medium text-[#0053a0]"
              >
                <Bus className="h-5 w-5" aria-hidden="true" />
                Dashboard
              </button>

              {!isFahrer ? (
                <button
                  type="button"
                  onClick={() => onGoToPage('/fahrerinfos')}
                  className="flex w-full items-center gap-3 rounded-2xl bg-[#0053a0]/12 px-4 py-3 text-left text-lg font-medium text-[#0053a0]"
                >
                  <UserRound className="h-5 w-5" aria-hidden="true" />
                  Fahrerinfos
                </button>
              ) : null}

              <button
                type="button"
                onClick={() => onGoToPage('/fahrzeuginfos')}
                className="flex w-full items-center gap-3 rounded-2xl bg-[#0053a0]/12 px-4 py-3 text-left text-lg font-medium text-[#0053a0]"
              >
                <Bus className="h-5 w-5" aria-hidden="true" />
                Fahrzeuginfos
              </button>

              {!isFahrer ? (
                <button
                  type="button"
                  onClick={() => onGoToPage('/fahrgastinfos')}
                  className="flex w-full items-center gap-3 rounded-2xl bg-[#0053a0] px-4 py-3 text-left text-lg font-medium text-white"
                >
                  <UserRoundPlus className="h-5 w-5" aria-hidden="true" />
                  Fahrgastinfos
                </button>
              ) : null}

              {canManageInitiatives ? (
                <button
                  type="button"
                  onClick={() => onGoToPage('/initiativen')}
                  className="flex w-full items-center gap-3 rounded-2xl bg-[#0053a0]/12 px-4 py-3 text-left text-lg font-medium text-[#0053a0]"
                >
                  <Bus className="h-5 w-5" aria-hidden="true" />
                  Initiativen
                </button>
              ) : null}

              {!isFahrer ? (
                <button
                  type="button"
                  onClick={() => onGoToPage('/rollenverteilung')}
                  className="flex w-full items-center gap-3 rounded-2xl bg-[#0053a0]/12 px-4 py-3 text-left text-lg font-medium text-[#0053a0]"
                >
                  <Settings className="h-5 w-5" aria-hidden="true" />
                  Rollenverteilung
                </button>
              ) : null}
            </div>
          </aside>
        </div>
      ) : null}
    </>
  )
}

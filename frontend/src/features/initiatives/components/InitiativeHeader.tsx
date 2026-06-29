import { Bus, CircleUserRound, Menu, Settings, UserRound, UserRoundPlus, X } from 'lucide-react'
import UserMenuButton from '../../../components/UserMenuButton'

type InitiativeHeaderProps = {
  isSideMenuOpen: boolean
  canManageInitiatives: boolean
  isDisponent: boolean
  isFahrer: boolean
  onOpenSideMenu: () => void
  onCloseSideMenu: () => void
  onNavigateToProfile: () => void
  onNavigateToPage: (path: string) => void
}

export function InitiativeHeader({
  isSideMenuOpen,
  canManageInitiatives,
  isDisponent,
  isFahrer,
  onOpenSideMenu,
  onCloseSideMenu,
  onNavigateToProfile,
  onNavigateToPage,
}: InitiativeHeaderProps) {
  return (
    <>
      <header className="border-b border-slate-200 bg-white/95 px-4 py-3 shadow-sm backdrop-blur sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onOpenSideMenu}
              className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0053a0]/40"
              aria-label="Navigation öffnen"
            >
              <Menu className="h-5 w-5" aria-hidden="true" />
            </button>

            <h1 className="text-2xl font-bold text-slate-800">Initiativen</h1>
          </div>

          <UserMenuButton
            onClick={onNavigateToProfile}
            icon={<CircleUserRound className="h-6 w-6" aria-hidden="true" />}
          />
        </div>
      </header>

      {isSideMenuOpen ? (
        <div
          className="fixed inset-0 z-30 bg-slate-900/45 backdrop-blur-[2px]"
          onClick={onCloseSideMenu}
        >
          <aside
            className="h-full w-full max-w-sm bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
            aria-label="Seitliche Navigation"
          >
            <div className="flex items-center justify-between bg-[#0053a0] px-6 py-5 text-white">
              <h2 className="text-4xl font-semibold tracking-tight">Navigation</h2>
              <button
                type="button"
                onClick={onCloseSideMenu}
                className="inline-flex h-11 w-11 items-center justify-center rounded-xl text-white transition hover:bg-white/10"
                aria-label="Navigation schließen"
              >
                <X className="h-7 w-7" aria-hidden="true" />
              </button>
            </div>

            <div className="space-y-3 p-4">
              <button
                type="button"
                onClick={() => onNavigateToPage('/dashboard')}
                className="flex w-full items-center gap-3 rounded-2xl bg-[#0053a0]/12 px-4 py-3 text-left text-lg font-medium text-[#0053a0]"
              >
                <Bus className="h-5 w-5" aria-hidden="true" />
                Dashboard
              </button>

              {!isFahrer ? (
                <button
                  type="button"
                  onClick={() => onNavigateToPage('/fahrerinfos')}
                  className="flex w-full items-center gap-3 rounded-2xl bg-[#0053a0]/12 px-4 py-3 text-left text-lg font-medium text-[#0053a0]"
                >
                  <UserRound className="h-5 w-5" aria-hidden="true" />
                  Fahrerinfos
                </button>
              ) : null}

              <button
                type="button"
                onClick={() => onNavigateToPage('/fahrzeuginfos')}
                className="flex w-full items-center gap-3 rounded-2xl bg-[#0053a0]/12 px-4 py-3 text-left text-lg font-medium text-[#0053a0]"
              >
                <Bus className="h-5 w-5" aria-hidden="true" />
                Fahrzeuginfos
              </button>

              {!isFahrer ? (
                <button
                  type="button"
                  onClick={() => onNavigateToPage('/fahrgastinfos')}
                  className="flex w-full items-center gap-3 rounded-2xl bg-[#0053a0]/12 px-4 py-3 text-left text-lg font-medium text-[#0053a0]"
                >
                  <UserRoundPlus className="h-5 w-5" aria-hidden="true" />
                  Fahrgastinfos
                </button>
              ) : null}

              {canManageInitiatives ? (
                <button
                  type="button"
                  onClick={() => onNavigateToPage('/initiativen')}
                  className="flex w-full items-center gap-3 rounded-2xl bg-[#0053a0] px-4 py-3 text-left text-lg font-medium text-white"
                >
                  <Bus className="h-5 w-5" aria-hidden="true" />
                  Initiativen
                </button>
              ) : null}

              {!isDisponent && !isFahrer ? (
                <button
                  type="button"
                  onClick={() => onNavigateToPage('/rollenverteilung')}
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

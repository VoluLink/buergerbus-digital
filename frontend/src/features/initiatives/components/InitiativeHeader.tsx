import { CircleUserRound, Menu } from 'lucide-react'
import ProtectedSideMenu from '../../../components/ProtectedSideMenu'
import UserMenuButton from '../../../components/UserMenuButton'

type InitiativeHeaderProps = {
  isSideMenuOpen: boolean
  onOpenSideMenu: () => void
  onCloseSideMenu: () => void
  onNavigateToProfile: () => void
}

export function InitiativeHeader({
  isSideMenuOpen,
  onOpenSideMenu,
  onCloseSideMenu,
  onNavigateToProfile,
}: InitiativeHeaderProps) {
  return (
    <>
      <header className="border-b border-slate-200 bg-white/95 px-4 py-3 shadow-sm backdrop-blur sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={onOpenSideMenu}
              className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0053a0]/40"
              aria-label="Navigation öffnen"
            >
              <Menu className="h-5 w-5" aria-hidden="true" />
            </button>

            <h1 className="min-w-0 break-words text-xl font-bold leading-tight text-slate-800 sm:text-2xl">Initiativen</h1>
          </div>

          <UserMenuButton
            onClick={onNavigateToProfile}
            icon={<CircleUserRound className="h-6 w-6" aria-hidden="true" />}
          />
        </div>
      </header>

      <ProtectedSideMenu isOpen={isSideMenuOpen} onClose={onCloseSideMenu} />
    </>
  )
}

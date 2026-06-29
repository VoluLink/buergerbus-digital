import { Menu, UserRound } from 'lucide-react'
import UserMenuButton from '../../../components/UserMenuButton'

type RollenverteilungHeaderProps = {
  onOpenSideMenu: () => void
  onOpenProfile: () => void
}

function RollenverteilungHeader({ onOpenSideMenu, onOpenProfile }: RollenverteilungHeaderProps) {
  return (
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

          <h1 className="text-2xl font-bold text-slate-800">Nutzer & Rollenverteilung</h1>
        </div>

        <UserMenuButton
          onClick={onOpenProfile}
          icon={<UserRound className="h-6 w-6" aria-hidden="true" />}
        />
      </div>
    </header>
  )
}

export default RollenverteilungHeader

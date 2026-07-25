import {
  Bell,
  Bus,
  LogOut,
  MapPin,
  Settings,
  ScrollText,
  UserRound,
  UserRoundPlus,
  X,
} from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useRoleVisibility } from '../hooks/useRoleVisibility'

type ProtectedSideMenuProps = {
  isOpen: boolean
  onClose: () => void
}

type NavItem = {
  icon: typeof Bus
  label: string
  path: string
  visible: boolean
}

function ProtectedSideMenu({ isOpen, onClose }: ProtectedSideMenuProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const { logout } = useAuth()
  const {
    canManageInitiatives,
    canManageRoleAssignments,
    isAdmin,
    isFahrer,
    isGast,
  } = useRoleVisibility()

  if (!isOpen) {
    return null
  }

  const items: NavItem[] = [
    { icon: Bus, label: 'Dashboard', path: '/dashboard', visible: true },
    { icon: UserRound, label: 'Fahrerinfos', path: '/fahrerinfos', visible: !isFahrer && !isGast },
    { icon: Bus, label: 'Fahrzeuginfos', path: '/fahrzeuginfos', visible: !isGast },
    { icon: UserRoundPlus, label: 'Fahrgastinfos', path: '/fahrgastinfos', visible: !isFahrer && !isGast },
    { icon: MapPin, label: 'Initiativen', path: '/initiativen', visible: canManageInitiatives },
    { icon: Settings, label: 'Rollenverteilung', path: '/rollenverteilung', visible: canManageRoleAssignments },
    { icon: Bell, label: 'Benachrichtigungen', path: '/admin/benachrichtigungen', visible: isAdmin },
    { icon: ScrollText, label: 'Audit-Logs', path: '/admin/audit-logs', visible: isAdmin },
    { icon: Settings, label: 'Einstellungen', path: '/admin/einstellungen', visible: isAdmin },
  ]

  function navigateTo(path: string) {
    onClose()
    navigate(path)
  }

  function handleLogout() {
    onClose()
    logout()
    navigate('/', { replace: true })
  }

  return (
    <div
      className="fixed inset-0 z-30 overflow-hidden bg-slate-900/45 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <aside
        className="flex h-full w-full max-w-sm flex-col bg-white shadow-2xl"
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

        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          {items
            .filter((item) => item.visible)
            .map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.path

              return (
                <button
                  key={item.path}
                  type="button"
                  onClick={() => navigateTo(item.path)}
                  className={`flex min-h-11 w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-base font-medium sm:rounded-2xl sm:text-lg ${
                    isActive
                      ? 'bg-[#0053a0] text-white'
                      : 'bg-[#0053a0]/12 text-[#0053a0]'
                  }`}
                >
                  <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                  <span className="min-w-0 break-words">{item.label}</span>
                </button>
              )
            })}
        </div>

        <div className="mt-auto border-t border-slate-200 p-4">
          <button
            type="button"
            onClick={handleLogout}
            className="flex min-h-11 w-full items-center gap-3 rounded-xl border border-rose-200 bg-white px-4 py-3 text-left text-base font-medium text-rose-700 transition hover:bg-rose-50 sm:rounded-2xl sm:text-lg"
          >
            <LogOut className="h-5 w-5 shrink-0" aria-hidden="true" />
            <span className="min-w-0 break-words">Abmelden</span>
          </button>
        </div>
      </aside>
    </div>
  )
}

export default ProtectedSideMenu

import type { ReactNode } from 'react'
import { useMemo } from 'react'
import { useAuth } from '../context/AuthContext'

function buildDisplayName(username?: string, email?: string, firstName?: string, lastName?: string) {
  const nameParts = [firstName, lastName].filter(Boolean)
  if (nameParts.length > 0) {
    return nameParts.join(' ')
  }

  if (username) {
    return username
  }

  return email || 'Profil'
}

type UserMenuButtonProps = {
  onClick: () => void
  icon: ReactNode
  className?: string
}

function UserMenuButton({ onClick, icon, className }: UserMenuButtonProps) {
  const { currentUser, isLoading } = useAuth()

  const displayName = useMemo(() => {
    if (!currentUser) {
      return 'Profil'
    }

    return buildDisplayName(
      currentUser.username,
      currentUser.email,
      currentUser.fahrer?.vorname,
      currentUser.fahrer?.nachname,
    )
  }, [currentUser])

  return (
    <button
      type="button"
      onClick={onClick}
      className={className ?? 'ml-auto flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-left transition hover:bg-slate-50'}
    >
      <div className="min-w-0">
        <span className="block text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-slate-400">
          Profil
        </span>
        <span className="block truncate text-sm font-semibold text-slate-700">
          {isLoading ? 'Lade...' : displayName}
        </span>
      </div>

      <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#0053a0] text-white shadow-md">
        {icon}
      </div>
    </button>
  )
}

export default UserMenuButton

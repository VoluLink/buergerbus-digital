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
      currentUser.vorname ?? undefined,
      currentUser.nachname ?? undefined,
    )
  }, [currentUser])

  return (
    <button
      type="button"
      onClick={onClick}
      className={className ?? 'ml-auto flex min-w-0 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-2.5 py-1 text-left transition hover:bg-slate-50 sm:gap-3 sm:px-3 sm:py-2'}
    >
      <div className="min-w-0">
        <span className="block text-[0.6rem] font-semibold uppercase tracking-[0.16em] text-slate-400 sm:text-[0.65rem] sm:tracking-[0.2em]">
          Profil
        </span>
        <span className="block max-w-[8.5rem] truncate text-xs font-semibold text-slate-700 sm:max-w-none sm:text-sm">
          {isLoading ? 'Lade...' : displayName}
        </span>
      </div>

      <div className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#0053a0] text-white shadow-md sm:h-12 sm:w-12">
        {icon}
      </div>
    </button>
  )
}

export default UserMenuButton

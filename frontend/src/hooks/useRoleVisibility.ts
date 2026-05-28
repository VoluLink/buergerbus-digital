import { useMemo } from 'react'
import { useAuth } from '../context/AuthContext'

function normalizeRole(role: string) {
  return role.trim().toLowerCase()
}

function roleRank(role: string) {
  switch (role) {
    case 'admin':
      return 3
    case 'disponent':
      return 2
    case 'fahrer':
      return 1
    case 'gast':
      return 0
    default:
      return -1
  }
}

function resolveEffectiveRole(roles: string[]) {
  if (roles.length === 0) {
    return null
  }

  return [...roles].sort((a, b) => roleRank(b) - roleRank(a))[0]
}

export function useRoleVisibility() {
  const { currentUser } = useAuth()

  return useMemo(() => {
    const normalizedRoles = Array.from(new Set(
      (currentUser?.roles ?? [])
        .filter((role): role is string => typeof role === 'string')
        .map(normalizeRole),
    ))

    const effectiveRole = resolveEffectiveRole(normalizedRoles)
    const isGuestOnly = effectiveRole === 'gast'

    return {
      roles: normalizedRoles,
      activeRole: effectiveRole,
      isAdmin: effectiveRole === 'admin',
      isDisponent: effectiveRole === 'disponent',
      isFahrer: effectiveRole === 'fahrer',
      isGast: isGuestOnly,
      canManageDataCrud: effectiveRole === 'admin' || effectiveRole === 'disponent',
      canManageInitiatives: effectiveRole === 'admin',
      canManageRoleAssignments: effectiveRole === 'admin',
    }
  }, [currentUser?.roles])
}

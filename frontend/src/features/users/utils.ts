import type { RoleSummary } from '../../types/UserProfile'

const allowedRoleOrder = ['admin', 'disponent', 'fahrer', 'gast']

export function getRoleSelectedClass(roleName: string) {
  const normalized = roleName.toLowerCase()

  if (normalized === 'admin') {
    return 'border-[#0053a0] bg-[#0053a0] text-white'
  }

  if (normalized === 'disponent') {
    return 'border-amber-500 bg-amber-500 text-white'
  }

  if (normalized === 'fahrer') {
    return 'border-emerald-600 bg-emerald-600 text-white'
  }

  return 'border-slate-800 bg-slate-800 text-white'
}

export function getRoleInactiveClass(roleName: string) {
  const normalized = roleName.toLowerCase()

  if (normalized === 'admin') {
    return 'border-[#0053a0]/30 bg-white text-[#0053a0] hover:bg-[#0053a0]/5'
  }

  if (normalized === 'disponent') {
    return 'border-amber-300 bg-white text-amber-700 hover:bg-amber-50'
  }

  if (normalized === 'fahrer') {
    return 'border-emerald-300 bg-white text-emerald-700 hover:bg-emerald-50'
  }

  return 'border-slate-300 bg-white text-slate-600 hover:bg-slate-50'
}

export function getCreateRoleOptions(roles: RoleSummary[], isDisponent: boolean) {
  return roles
    .filter((role) => allowedRoleOrder.includes(role.name.toLowerCase()))
    .filter((role) => !isDisponent || role.name.toLowerCase() !== 'admin')
    .sort((a, b) => {
      const left = allowedRoleOrder.indexOf(a.name.toLowerCase())
      const right = allowedRoleOrder.indexOf(b.name.toLowerCase())
      return left - right
    })
}

import { useEffect, useRef, useState } from 'react'
import { AlertTriangle, Bus, Menu, Settings, UserRound, UserRoundPlus, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import UserMenuButton from '../components/UserMenuButton'
import { useAuth } from '../context/AuthContext'
import { useRoleVisibility } from '../hooks/useRoleVisibility'
import { setStoredToken } from '../services/httpClient'
import {
  createBenutzer,
  fetchInitiatives,
  fetchRoles,
  getUsers,
  updateUserInitiative,
  updateUserRoles,
} from '../services/users'
import type { InitiativeSummary, RoleSummary, UserSummary } from '../types/UserProfile'

function getRoleSelectedClass(roleName: string) {
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

function getRoleInactiveClass(roleName: string) {
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

type PendingAdminConfirmation =
  | {
      kind: 'existing-user'
      userId: number
      userName: string
      nextRoles: string[]
      nextActiveRole: string
      previousRoles: string[]
      previousActiveRole: string | null
    }
  | {
      kind: 'new-user'
      userName: string
      email: string
      roleId: number
      initiativeId: number
      password: string
    }

function RollenverteilungPage() {
  const navigate = useNavigate()
  const { currentUser } = useAuth()
  const { canManageInitiatives, canManageRoleAssignments, isAdmin, isDisponent, isFahrer } = useRoleVisibility()
  const currentInitiativeId = currentUser?.initiative?.id ?? null
  const [isSideMenuOpen, setIsSideMenuOpen] = useState(false)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const [totalItems, setTotalItems] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [users, setUsers] = useState<UserSummary[]>([])
  const [roles, setRoles] = useState<RoleSummary[]>([])
  const [initiatives, setInitiatives] = useState<InitiativeSummary[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [saveError, setSaveError] = useState('')
  const [saveSuccess, setSaveSuccess] = useState('')
  const successTimerRef = useRef<number | null>(null)
  const [savingUserId, setSavingUserId] = useState<number | null>(null)
  const [pendingAdminConfirmation, setPendingAdminConfirmation] = useState<PendingAdminConfirmation | null>(null)

  const [createForm, setCreateForm] = useState({
    roleId: '',
    initiativeId: '',
    name: '',
    email: '',
    password: '',
  })
  const [createFieldErrors, setCreateFieldErrors] = useState<Record<string, string>>({})
  const [createError, setCreateError] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  useEffect(() => {
    return () => {
      if (successTimerRef.current) {
        window.clearTimeout(successTimerRef.current)
      }
    }
  }, [])

  useEffect(() => {
    let isActive = true

    async function loadMeta() {
      setLoadError('')

      try {
        const [loadedInitiatives, loadedRoles] = await Promise.all([
          fetchInitiatives(),
          fetchRoles(),
        ])

        if (!isActive) {
          return
        }

        setInitiatives(loadedInitiatives)
        setRoles(loadedRoles)
      } catch (err) {
        if (isActive) {
          setLoadError(err instanceof Error ? err.message : 'Stammdaten konnten nicht geladen werden.')
        }
      }
    }

    void loadMeta()

    return () => {
      isActive = false
    }
  }, [])

  useEffect(() => {
    let isActive = true

    async function loadUsers() {
      setIsLoading(true)
      setLoadError('')

      try {
        const response = await getUsers(page, pageSize, searchQuery)
        if (!isActive) {
          return
        }

        setUsers(response.items)
        setTotalItems(response.totalItems)
        setTotalPages(response.totalPages)
      } catch (err) {
        if (isActive) {
          setLoadError(err instanceof Error ? err.message : 'Nutzer konnten nicht geladen werden.')
        }
      } finally {
        if (isActive) {
          setIsLoading(false)
        }
      }
    }

    void loadUsers()

    return () => {
      isActive = false
    }
  }, [page, pageSize, searchQuery])

  function closeSideMenu() {
    setIsSideMenuOpen(false)
  }

  function openCreateModal() {
    if (!canManageRoleAssignments) {
      return
    }

    setCreateForm({
      roleId: '',
      initiativeId: isDisponent && currentInitiativeId != null ? String(currentInitiativeId) : '',
      name: '',
      email: '',
      password: '',
    })
    setCreateFieldErrors({})
    setCreateError('')
    setIsCreateModalOpen(true)
  }

  function closeCreateModal() {
    if (isCreating) {
      return
    }

    setIsCreateModalOpen(false)
  }

  function goToPage(path: string) {
    closeSideMenu()
    navigate(path)
  }

  function closeAdminConfirmation() {
    const isExistingUserUpdatePending =
      pendingAdminConfirmation?.kind === 'existing-user'
      && savingUserId === pendingAdminConfirmation.userId

    if (isCreating || isExistingUserUpdatePending) {
      return
    }

    setPendingAdminConfirmation(null)
  }

  function applyUserRoleUpdate(
    userId: number,
    nextRoles: string[],
    nextActiveRole: string,
    previousRoles: string[],
    previousActiveRole: string | null,
  ) {
    setUsers((prev) =>
      prev.map((entry) =>
        entry.id === userId
          ? { ...entry, roles: nextRoles, activeRole: nextActiveRole }
          : entry,
      ),
    )

    setSavingUserId(userId)

    void updateUserRoles(userId, nextRoles, nextActiveRole)
      .then((saved) => {
        if (saved.newToken) {
          setStoredToken(saved.newToken)
        }

        setUsers((prev) =>
          prev.map((entry) =>
            entry.id === userId ? { ...entry, roles: saved.roles, activeRole: saved.activeRole ?? nextActiveRole } : entry,
          ),
        )
      })
      .catch((err) => {
        setUsers((prev) =>
          prev.map((entry) =>
            entry.id === userId ? { ...entry, roles: previousRoles, activeRole: previousActiveRole } : entry,
          ),
        )
        setSaveError(err instanceof Error ? err.message : 'Rollen konnten nicht gespeichert werden.')
      })
      .finally(() => {
        setSavingUserId((current) => (current === userId ? null : current))
      })
  }

  async function submitCreateUser(payload: {
    name: string
    email: string
    password: string
    roleId: number
    initiativeId: number
  }) {
    setIsCreating(true)

    try {
      await createBenutzer(payload)

      setPage(1)
      setSearchQuery(payload.email)
      await reloadUsers({ page: 1, searchQuery: payload.email })

      showSuccess('Benutzer wurde erfolgreich angelegt.')
      closeCreateModal()
      setCreateForm({
        roleId: '',
        initiativeId: '',
        name: '',
        email: '',
        password: '',
      })
      setCreateFieldErrors({})
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Benutzer konnte nicht angelegt werden.')
    } finally {
      setIsCreating(false)
    }
  }

  function handleAdminConfirmation() {
    if (!pendingAdminConfirmation) {
      return
    }

    if (pendingAdminConfirmation.kind === 'existing-user') {
      const { userId, nextRoles, nextActiveRole, previousRoles, previousActiveRole } = pendingAdminConfirmation
      setPendingAdminConfirmation(null)
      applyUserRoleUpdate(userId, nextRoles, nextActiveRole, previousRoles, previousActiveRole)
      return
    }

    const { userName, email, roleId, initiativeId, password } = pendingAdminConfirmation
    setPendingAdminConfirmation(null)
    void submitCreateUser({
      name: userName,
      email,
      password,
      roleId,
      initiativeId,
    })
  }

  function toggleRole(userId: number, role: string) {
    if (!canManageRoleAssignments) {
      return
    }

    const user = users.find((entry) => entry.id === userId)
    if (!user) {
      return
    }

    setSaveError('')

    const normalizedClickedRole = role.toLowerCase()
    const hasRole = user.roles.some((entry) => entry.toLowerCase() === normalizedClickedRole)
    const nextRoles = hasRole
      ? user.roles.filter((entry) => entry.toLowerCase() !== normalizedClickedRole)
      : user.roles.length < 2
        ? [...user.roles, role]
        : user.roles
    const nextActiveRole = role

    if (!hasRole && user.roles.length >= 2) {
      setSaveError('Es können maximal zwei Rollen gleichzeitig ausgewählt werden.')
      return
    }

    if (hasRole && user.roles.length <= 1) {
      setSaveError('Benutzer müssen mindestens eine Rolle haben.')
      return
    }

    if (!hasRole && normalizedClickedRole === 'admin') {
      setPendingAdminConfirmation({
        kind: 'existing-user',
        userId,
        userName: user.username,
        nextRoles,
        nextActiveRole,
        previousRoles: user.roles,
        previousActiveRole: user.activeRole ?? null,
      })
      return
    }

    applyUserRoleUpdate(userId, nextRoles, nextActiveRole, user.roles, user.activeRole ?? null)
  }

  function handleInitiativeChange(userId: number, nextValue: string) {
    if (!canManageRoleAssignments) {
      return
    }

    const nextInitiativeId = Number(nextValue)
    if (!nextInitiativeId) {
      return
    }

    const previousUser = users.find((entry) => entry.id === userId)
    if (!previousUser) {
      return
    }

    const previousInitiative = previousUser.initiative ?? null
    const nextInitiative = initiatives.find((entry) => entry.id === nextInitiativeId) ?? null

    setSaveError('')

    setUsers((prev) =>
      prev.map((entry) =>
        entry.id === userId ? { ...entry, initiative: nextInitiative } : entry,
      ),
    )

    void updateUserInitiative(userId, nextInitiativeId)
      .then((savedInitiative) => {
        setUsers((prev) =>
          prev.map((entry) =>
            entry.id === userId ? { ...entry, initiative: savedInitiative } : entry,
          ),
        )
      })
      .catch((err) => {
        setUsers((prev) =>
          prev.map((entry) =>
            entry.id === userId ? { ...entry, initiative: previousInitiative } : entry,
          ),
        )
        setSaveError(err instanceof Error ? err.message : 'Initiative konnte nicht gespeichert werden.')
      })
  }

  const allowedRoleOrder = ['admin', 'disponent', 'fahrer', 'gast']
  const createRoleOptions = roles
    .filter((role) => allowedRoleOrder.includes(role.name.toLowerCase()))
    .filter((role) => !isDisponent || role.name.toLowerCase() !== 'admin')
    .sort((a, b) => {
      const left = allowedRoleOrder.indexOf(a.name.toLowerCase())
      const right = allowedRoleOrder.indexOf(b.name.toLowerCase())
      return left - right
    })

  async function reloadUsers(overrides?: { page?: number; pageSize?: number; searchQuery?: string }) {
    const nextPage = overrides?.page ?? page
    const nextPageSize = overrides?.pageSize ?? pageSize
    const nextSearch = overrides?.searchQuery ?? searchQuery
    const response = await getUsers(nextPage, nextPageSize, nextSearch)
    setUsers(response.items)
    setTotalItems(response.totalItems)
    setTotalPages(response.totalPages)
  }

  function showSuccess(message: string) {
    setSaveSuccess(message)
    if (successTimerRef.current) {
      window.clearTimeout(successTimerRef.current)
    }
    successTimerRef.current = window.setTimeout(() => {
      setSaveSuccess('')
      successTimerRef.current = null
    }, 2500)
  }

  async function handleCreateUserSubmit() {
    if (!canManageRoleAssignments) {
      return
    }

    setCreateError('')

    const nextErrors: Record<string, string> = {}
    const trimmedName = createForm.name.trim()
    const trimmedEmail = createForm.email.trim()
    const roleId = Number(createForm.roleId)
    const initiativeId = Number(createForm.initiativeId)

    if (!roleId) {
      nextErrors.roleId = 'Bitte eine Rolle auswählen.'
    }

    if (!initiativeId) {
      nextErrors.initiativeId = 'Bitte eine Initiative auswählen.'
    }

    if (!trimmedName) {
      nextErrors.name = 'Name ist erforderlich.'
    }

    if (!trimmedEmail) {
      nextErrors.email = 'E-Mail ist erforderlich.'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      nextErrors.email = 'E-Mail ist ungültig.'
    }

    if (!createForm.password.trim()) {
      nextErrors.password = 'Passwort ist erforderlich.'
    } else if (createForm.password.trim().length < 6) {
      nextErrors.password = 'Passwort muss mindestens 6 Zeichen lang sein.'
    }

    setCreateFieldErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) {
      return
    }

    const selectedRole = roles.find((entry) => entry.id === roleId)
    if (!selectedRole) {
      setCreateError('Die ausgewählte Rolle konnte nicht gefunden werden.')
      return
    }

    if (selectedRole.name.toLowerCase() === 'admin') {
      setPendingAdminConfirmation({
        kind: 'new-user',
        userName: trimmedName,
        email: trimmedEmail,
        roleId,
        initiativeId,
        password: createForm.password,
      })
      return
    }

    await submitCreateUser({
      name: trimmedName,
      email: trimmedEmail,
      password: createForm.password,
      roleId,
      initiativeId,
    })
  }

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">
      <header className="border-b border-slate-200 bg-white/95 px-4 py-3 shadow-sm backdrop-blur sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsSideMenuOpen(true)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0053a0]/40"
              aria-label="Navigation öffnen"
            >
              <Menu className="h-5 w-5" aria-hidden="true" />
            </button>

            <h1 className="text-2xl font-bold text-slate-800">Nutzer & Rollenverteilung</h1>
          </div>

          <UserMenuButton
            onClick={() => navigate('/profil')}
            icon={<UserRound className="h-6 w-6" aria-hidden="true" />}
          />
        </div>
      </header>

      <div className="p-2 sm:p-3 lg:p-4">
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            {canManageRoleAssignments ? (
              <button
                type="button"
                onClick={openCreateModal}
                className="rounded-xl bg-[#0053a0] px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-110"
              >
                + Benutzer anlegen
              </button>
            ) : null}
          </div>

          {saveSuccess ? (
            <p className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {saveSuccess}
            </p>
          ) : null}

          {loadError ? (
            <p className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {loadError}
            </p>
          ) : null}

          {saveError ? (
            <p className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
              {saveError}
            </p>
          ) : null}

          <div className="mb-4">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setPage(1)
              }}
              placeholder="Suche nach Nutzer oder E-Mail ..."
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#0053a0] focus:ring-2 focus:ring-[#0053a0]/15"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm table-fixed">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="px-2 py-3 text-left font-semibold text-slate-700 w-1/6">Benutzer-ID</th>
                  <th className="px-2 py-3 text-left font-semibold text-slate-700 w-1/5">Benutzername</th>
                  <th className="px-2 py-3 text-left font-semibold text-slate-700 w-1/4">E-Mail</th>
                  <th className="px-2 py-3 text-left font-semibold text-slate-700 w-1/6">Initiative</th>
                  <th className="px-2 py-3 text-left font-semibold text-slate-700 w-1/3">Rollen</th>
                  <th className="px-2 py-3 text-left font-semibold text-slate-700 w-1/6">Profil</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                      Nutzer werden geladen...
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                      Keine Nutzer gefunden
                    </td>
                  </tr>
                ) : (
                  users.map((user) => {
                    const canManageUser =
                      canManageRoleAssignments
                      && (
                        isAdmin
                        || (
                          isDisponent
                          && currentInitiativeId != null
                          && user.initiative?.id != null
                          && user.initiative.id === currentInitiativeId
                        )
                      )

                    const canViewProfile =
                      isAdmin
                      || (currentUser?.id != null && currentUser.id === user.id)
                      || (
                        isDisponent
                        && currentUser?.initiative?.id != null
                        && user.initiative?.id != null
                        && currentUser.initiative.id === user.initiative.id
                      )

                    return (
                      <tr
                        key={user.id}
                        className="border-b border-slate-100 hover:bg-slate-50"
                      >
                      <td className="px-2 py-3 text-slate-700 truncate">{user.id}</td>
                      <td className="px-2 py-3 text-slate-700 truncate">{user.username}</td>
                      <td className="px-2 py-3 text-slate-700 truncate">{user.email}</td>
                      <td className="px-2 py-3">
                        <select
                          value={user.initiative?.id ?? ''}
                          onChange={(event) => handleInitiativeChange(user.id, event.target.value)}
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-700 outline-none transition focus:border-[#0053a0] focus:ring-2 focus:ring-[#0053a0]/15"
                          disabled={!canManageUser || initiatives.length === 0 || isDisponent}
                        >
                          <option value="">Keine Initiative</option>
                          {initiatives.map((initiative) => (
                            <option key={initiative.id} value={initiative.id}>
                              {initiative.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-2 py-3">
                        <div className="flex flex-nowrap gap-2 overflow-x-auto">
                          {roles.length === 0 ? (
                            <span className="text-xs text-slate-400">Keine Rollen verfügbar</span>
                          ) : roles.map((role) => {
                                const normalizedRole = role.name.toLowerCase()
                                const selectedRoleNames = user.roles.map((entry) => entry.toLowerCase())
                                const isSelected = selectedRoleNames.includes(normalizedRole)
                                const isAdminRole = normalizedRole === 'admin'
                            return (
                              <button
                                key={role.id}
                                type="button"
                                onClick={() => toggleRole(user.id, role.name)}
                                disabled={!canManageUser || savingUserId === user.id || (isDisponent && isAdminRole)}
                                className={`shrink-0 rounded-full border px-3 py-1 text-xs font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0053a0]/20 disabled:opacity-60 ${
                                  isSelected
                                    ? getRoleSelectedClass(role.name)
                                    : getRoleInactiveClass(role.name)
                                }`}
                              >
                                {role.name}
                              </button>
                            )
                          })}
                        </div>
                      </td>
                      <td className="px-2 py-3">
                        <button
                          type="button"
                          onClick={() => navigate(`/users/${user.id}/profile`)}
                          disabled={!canViewProfile}
                          title={
                            canViewProfile
                              ? 'Profil öffnen'
                              : 'Keine Berechtigung: Fremde Profile nur für Admin oder Disponent gleicher Initiative.'
                          }
                          className="rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-600 transition enabled:hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Profil anzeigen
                        </button>
                      </td>
                    </tr>
                  )})
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span>Treffer: {totalItems}</span>
              <label htmlFor="pageSize" className="ml-2 text-xs font-semibold text-slate-600">
                Pro Seite
              </label>
              <select
                id="pageSize"
                value={pageSize}
                onChange={(event) => {
                  setPageSize(Number(event.target.value))
                  setPage(1)
                }}
                className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs text-slate-700 outline-none transition focus:border-[#0053a0] focus:ring-2 focus:ring-[#0053a0]/15"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={page <= 1}
                className="rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-600 transition enabled:hover:bg-slate-100 disabled:opacity-50"
              >
                Zurück
              </button>
              <span className="text-xs font-semibold text-slate-600">
                Seite {totalPages === 0 ? 0 : page} von {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((current) => current + 1)}
                disabled={totalPages === 0 || page >= totalPages}
                className="rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-600 transition enabled:hover:bg-slate-100 disabled:opacity-50"
              >
                Weiter
              </button>
            </div>
          </div>
        </section>
      </div>

      {isSideMenuOpen ? (
        <div className="fixed inset-0 z-30 bg-slate-900/45 backdrop-blur-[2px]" onClick={closeSideMenu}>
          <aside
            className="h-full w-full max-w-sm bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
            aria-label="Seitliche Navigation"
          >
            <div className="flex items-center justify-between bg-[#0053a0] px-6 py-5 text-white">
              <h2 className="text-4xl font-semibold tracking-tight">Navigation</h2>
              <button
                type="button"
                onClick={closeSideMenu}
                className="inline-flex h-11 w-11 items-center justify-center rounded-xl text-white transition hover:bg-white/10"
                aria-label="Navigation schließen"
              >
                <X className="h-7 w-7" aria-hidden="true" />
              </button>
            </div>

            <div className="space-y-3 p-4">
              <button
                type="button"
                onClick={() => goToPage('/dashboard')}
                className="flex w-full items-center gap-3 rounded-2xl bg-[#0053a0]/12 px-4 py-3 text-left text-lg font-medium text-[#0053a0]"
              >
                <Bus className="h-5 w-5" aria-hidden="true" />
                Dashboard
              </button>

              {!isFahrer ? (
                <button
                  type="button"
                  onClick={() => goToPage('/fahrerinfos')}
                  className="flex w-full items-center gap-3 rounded-2xl bg-[#0053a0]/12 px-4 py-3 text-left text-lg font-medium text-[#0053a0]"
                >
                  <UserRound className="h-5 w-5" aria-hidden="true" />
                  Fahrerinfos
                </button>
              ) : null}

              <button
                type="button"
                onClick={() => goToPage('/fahrzeuginfos')}
                className="flex w-full items-center gap-3 rounded-2xl bg-[#0053a0]/12 px-4 py-3 text-left text-lg font-medium text-[#0053a0]"
              >
                <Bus className="h-5 w-5" aria-hidden="true" />
                Fahrzeuginfos
              </button>

              {!isFahrer ? (
                <button
                  type="button"
                  onClick={() => goToPage('/fahrgastinfos')}
                  className="flex w-full items-center gap-3 rounded-2xl bg-[#0053a0]/12 px-4 py-3 text-left text-lg font-medium text-[#0053a0]"
                >
                  <UserRoundPlus className="h-5 w-5" aria-hidden="true" />
                  Fahrgastinfos
                </button>
              ) : null}

              {canManageInitiatives ? (
                <button
                  type="button"
                  onClick={() => goToPage('/initiativen')}
                  className="flex w-full items-center gap-3 rounded-2xl bg-[#0053a0]/12 px-4 py-3 text-left text-lg font-medium text-[#0053a0]"
                >
                  <Bus className="h-5 w-5" aria-hidden="true" />
                  Initiativen
                </button>
              ) : null}

              {!isFahrer ? (
                <button
                  type="button"
                  onClick={() => goToPage('/rollenverteilung')}
                  className="flex w-full items-center gap-3 rounded-2xl bg-[#0053a0] px-4 py-3 text-left text-lg font-medium text-white"
                >
                  <Settings className="h-5 w-5" aria-hidden="true" />
                  Rollenverteilung
                </button>
              ) : null}
            </div>
          </aside>
        </div>
      ) : null}

      {pendingAdminConfirmation ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/55 p-4 backdrop-blur-sm"
          onClick={closeAdminConfirmation}
        >
          <section
            className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl"
            onClick={(event) => event.stopPropagation()}
            aria-label="Admin-Rolle bestätigen"
          >
            <div className="flex items-start gap-4">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
                <AlertTriangle className="h-6 w-6" aria-hidden="true" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-slate-800">Admin-Rolle bestätigen</h2>
                <p className="mt-2 text-sm text-slate-600">
                  {pendingAdminConfirmation.kind === 'existing-user'
                    ? `Sind Sie sicher, dass Sie ${pendingAdminConfirmation.userName} die Rolle Admin zuweisen möchten?`
                    : `Sind Sie sicher, dass Sie den neuen Benutzer ${pendingAdminConfirmation.userName} mit der Rolle Admin anlegen möchten?`}
                </p>
                <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  Die Rolle Admin vergibt weitreichende Berechtigungen. Bitte bestätigen Sie diese Zuweisung ausdrücklich.
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={closeAdminConfirmation}
                className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
                disabled={isCreating || (pendingAdminConfirmation.kind === 'existing-user' && savingUserId === pendingAdminConfirmation.userId)}
              >
                Abbrechen
              </button>
              <button
                type="button"
                onClick={handleAdminConfirmation}
                className="rounded-xl bg-amber-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-700 disabled:opacity-60"
                disabled={isCreating || (pendingAdminConfirmation.kind === 'existing-user' && savingUserId === pendingAdminConfirmation.userId)}
              >
                Bestätigen
              </button>
            </div>
          </section>
        </div>
      ) : null}

      {isCreateModalOpen ? (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
          onClick={closeCreateModal}
        >
          <section
            className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl"
            onClick={(event) => event.stopPropagation()}
            aria-label="Benutzer anlegen"
          >
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <h2 className="text-xl font-bold text-slate-800">Benutzer anlegen</h2>
              <button
                type="button"
                onClick={closeCreateModal}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                aria-label="Benutzer anlegen schließen"
                disabled={isCreating}
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            {createError ? (
              <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {createError}
              </p>
            ) : null}

            <form
              className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2"
              onSubmit={(event) => {
                event.preventDefault()
                void handleCreateUserSubmit()
              }}
            >
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600">Rolle</label>
                <select
                  value={createForm.roleId}
                  onChange={(event) => setCreateForm((prev) => ({ ...prev, roleId: event.target.value }))}
                  className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
                  disabled={!canManageRoleAssignments || createRoleOptions.length === 0 || isCreating}
                >
                  <option value="">Bitte wählen...</option>
                  {createRoleOptions.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name}
                    </option>
                  ))}
                </select>
                {createFieldErrors.roleId ? (
                  <p className="mt-1 text-xs text-rose-600">{createFieldErrors.roleId}</p>
                ) : null}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600">Initiative</label>
                <select
                  value={createForm.initiativeId}
                  onChange={(event) => setCreateForm((prev) => ({ ...prev, initiativeId: event.target.value }))}
                  className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
                  disabled={!canManageRoleAssignments || initiatives.length === 0 || isCreating || isDisponent}
                >
                  <option value="">Bitte wählen...</option>
                  {initiatives.map((initiative) => (
                    <option key={initiative.id} value={initiative.id}>
                      {initiative.name}
                    </option>
                  ))}
                </select>
                {createFieldErrors.initiativeId ? (
                  <p className="mt-1 text-xs text-rose-600">{createFieldErrors.initiativeId}</p>
                ) : null}
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600">Name</label>
                <input
                  type="text"
                  value={createForm.name}
                  onChange={(event) => setCreateForm((prev) => ({ ...prev, name: event.target.value }))}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                  disabled={!canManageRoleAssignments || isCreating}
                />
                {createFieldErrors.name ? (
                  <p className="mt-1 text-xs text-rose-600">{createFieldErrors.name}</p>
                ) : null}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600">E-Mail</label>
                <input
                  type="email"
                  value={createForm.email}
                  onChange={(event) => setCreateForm((prev) => ({ ...prev, email: event.target.value }))}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                  disabled={!canManageRoleAssignments || isCreating}
                />
                {createFieldErrors.email ? (
                  <p className="mt-1 text-xs text-rose-600">{createFieldErrors.email}</p>
                ) : null}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600">Passwort</label>
                <input
                  type="password"
                  value={createForm.password}
                  onChange={(event) => setCreateForm((prev) => ({ ...prev, password: event.target.value }))}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                  disabled={!canManageRoleAssignments || isCreating}
                />
                {createFieldErrors.password ? (
                  <p className="mt-1 text-xs text-rose-600">{createFieldErrors.password}</p>
                ) : null}
              </div>

              <div className="sm:col-span-2 mt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeCreateModal}
                  className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                  disabled={isCreating}
                >
                  Schließen
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-[#0053a0] px-5 py-2.5 text-sm font-semibold text-white hover:brightness-110 disabled:opacity-60"
                  disabled={!canManageRoleAssignments || isCreating}
                >
                  {isCreating ? 'Wird angelegt...' : 'Benutzer anlegen'}
                </button>
              </div>
            </form>
          </section>
        </div>
      ) : null}
    </main>
  )
}

export default RollenverteilungPage

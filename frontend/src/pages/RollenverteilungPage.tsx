import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import AdminRoleConfirmationDialog from '../features/users/components/AdminRoleConfirmationDialog'
import CreateUserModal from '../features/users/components/CreateUserModal'
import RollenverteilungHeader from '../features/users/components/RollenverteilungHeader'
import RollenverteilungSideMenu from '../features/users/components/RollenverteilungSideMenu'
import UsersRoleTable from '../features/users/components/UsersRoleTable'
import type {
  CreateUserForm,
  CreateUserPayload,
  PendingAdminConfirmation,
  ReloadUsersOverrides,
} from '../features/users/types'
import { getCreateRoleOptions } from '../features/users/utils'
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

  const [createForm, setCreateForm] = useState<CreateUserForm>({
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

  async function submitCreateUser(payload: CreateUserPayload) {
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

  const createRoleOptions = getCreateRoleOptions(roles, isDisponent)

  async function reloadUsers(overrides?: ReloadUsersOverrides) {
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
      <RollenverteilungHeader
        onOpenSideMenu={() => setIsSideMenuOpen(true)}
        onOpenProfile={() => navigate('/profil')}
      />

      <div className="p-2 sm:p-3 lg:p-4">
        <UsersRoleTable
          canManageRoleAssignments={canManageRoleAssignments}
          currentInitiativeId={currentInitiativeId}
          currentUserId={currentUser?.id ?? null}
          currentUserInitiativeId={currentUser?.initiative?.id ?? null}
          initiatives={initiatives}
          isAdmin={isAdmin}
          isDisponent={isDisponent}
          isLoading={isLoading}
          loadError={loadError}
          onInitiativeChange={handleInitiativeChange}
          onNavigateToProfile={(userId) => navigate(`/users/${userId}/profile`)}
          onOpenCreateModal={openCreateModal}
          onPageChange={setPage}
          onPageSizeChange={(nextPageSize) => {
            setPageSize(nextPageSize)
            setPage(1)
          }}
          onSearchChange={(nextSearchQuery) => {
            setSearchQuery(nextSearchQuery)
            setPage(1)
          }}
          page={page}
          pageSize={pageSize}
          roles={roles}
          savingUserId={savingUserId}
          searchQuery={searchQuery}
          saveError={saveError}
          saveSuccess={saveSuccess}
          toggleRole={toggleRole}
          totalItems={totalItems}
          totalPages={totalPages}
          users={users}
        />
      </div>

      {isSideMenuOpen ? (
        <RollenverteilungSideMenu
          canManageInitiatives={canManageInitiatives}
          isFahrer={isFahrer}
          onClose={closeSideMenu}
          onNavigate={goToPage}
        />
      ) : null}

      {pendingAdminConfirmation ? (
        <AdminRoleConfirmationDialog
          isCreating={isCreating}
          onCancel={closeAdminConfirmation}
          onConfirm={handleAdminConfirmation}
          pendingAdminConfirmation={pendingAdminConfirmation}
          savingUserId={savingUserId}
        />
      ) : null}

      {isCreateModalOpen ? (
        <CreateUserModal
          canManageRoleAssignments={canManageRoleAssignments}
          createError={createError}
          createFieldErrors={createFieldErrors}
          createForm={createForm}
          createRoleOptions={createRoleOptions}
          initiatives={initiatives}
          isCreating={isCreating}
          isDisponent={isDisponent}
          onClose={closeCreateModal}
          onSubmit={() => {
            void handleCreateUserSubmit()
          }}
          setCreateForm={setCreateForm}
        />
      ) : null}
    </main>
  )
}

export default RollenverteilungPage

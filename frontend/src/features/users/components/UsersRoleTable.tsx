import type { InitiativeSummary, RoleSummary, UserSummary } from '../../../types/UserProfile'
import { getRoleInactiveClass, getRoleSelectedClass } from '../utils'

type UsersRoleTableProps = {
  canManageRoleAssignments: boolean
  currentInitiativeId: number | null
  currentUserId: number | null
  currentUserInitiativeId: number | null
  initiatives: InitiativeSummary[]
  isAdmin: boolean
  isDisponent: boolean
  isLoading: boolean
  loadError: string
  onInitiativeChange: (userId: number, nextValue: string) => void
  onNavigateToProfile: (userId: number) => void
  onOpenCreateModal: () => void
  onPageChange: (updater: (current: number) => number) => void
  onPageSizeChange: (pageSize: number) => void
  onSearchChange: (searchQuery: string) => void
  page: number
  pageSize: number
  roles: RoleSummary[]
  savingUserId: number | null
  searchQuery: string
  saveError: string
  saveSuccess: string
  toggleRole: (userId: number, role: string) => void
  totalItems: number
  totalPages: number
  users: UserSummary[]
}

function UsersRoleTable({
  canManageRoleAssignments,
  currentInitiativeId,
  currentUserId,
  currentUserInitiativeId,
  initiatives,
  isAdmin,
  isDisponent,
  isLoading,
  loadError,
  onInitiativeChange,
  onNavigateToProfile,
  onOpenCreateModal,
  onPageChange,
  onPageSizeChange,
  onSearchChange,
  page,
  pageSize,
  roles,
  savingUserId,
  searchQuery,
  saveError,
  saveSuccess,
  toggleRole,
  totalItems,
  totalPages,
  users,
}: UsersRoleTableProps) {
  function getUserPermissions(user: UserSummary) {
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
      || (currentUserId != null && currentUserId === user.id)
      || (
        isDisponent
        && currentUserInitiativeId != null
        && user.initiative?.id != null
        && currentUserInitiativeId === user.initiative.id
      )

    return { canManageUser, canViewProfile }
  }

  function renderRoleButtons(user: UserSummary, canManageUser: boolean, isMobile = false) {
    if (roles.length === 0) {
      return <span className="text-xs text-slate-400">Keine Rollen verfügbar</span>
    }

    return roles.map((role) => {
      const normalizedRole = role.name.toLowerCase()
      const selectedRoleNames = user.roles.map((entry) => entry.toLowerCase())
      const isSelected = selectedRoleNames.includes(normalizedRole)
      const isActiveRole = user.activeRole?.toLowerCase() === normalizedRole
      const isAdminRole = normalizedRole === 'admin'

      return (
        <button
          key={role.id}
          type="button"
          onClick={() => toggleRole(user.id, role.name)}
          disabled={!canManageUser || savingUserId === user.id || (isDisponent && isAdminRole)}
          className={`rounded-full border px-3 py-1 text-xs font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0053a0]/20 disabled:opacity-60 ${
            isMobile ? 'min-h-11 whitespace-normal text-left leading-snug' : 'shrink-0'
          } ${
            isSelected
              ? getRoleSelectedClass(role.name)
              : getRoleInactiveClass(role.name)
          } ${isActiveRole ? 'ring-2 ring-[#0053a0]/25 ring-offset-1' : ''}`}
          title={isActiveRole ? 'Aktive Rolle' : undefined}
        >
          {role.name}
          {isActiveRole ? <span className="sr-only">, aktive Rolle</span> : null}
        </button>
      )
    })
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:p-5">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {canManageRoleAssignments ? (
          <button
            type="button"
            onClick={onOpenCreateModal}
            className="min-h-11 w-full rounded-xl bg-[#0053a0] px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 sm:w-auto"
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
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Suche nach Nutzer oder E-Mail ..."
          className="min-h-11 w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#0053a0] focus:ring-2 focus:ring-[#0053a0]/15"
        />
      </div>

      <div className="space-y-3 md:hidden">
        {isLoading ? (
          <div className="rounded-xl border border-slate-200 px-4 py-8 text-center text-sm text-slate-500">
            Nutzer werden geladen...
          </div>
        ) : users.length === 0 ? (
          <div className="rounded-xl border border-slate-200 px-4 py-8 text-center text-sm text-slate-500">
            Keine Nutzer gefunden
          </div>
        ) : (
          users.map((user) => {
            const { canManageUser, canViewProfile } = getUserPermissions(user)
            const activeRole = user.activeRole ?? user.roles[0] ?? 'Keine Rolle'

            return (
              <article key={user.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="break-words text-base font-semibold text-slate-900">{user.username}</h3>
                    <p className="mt-1 break-words text-sm text-slate-600">{user.email}</p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      user.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {user.isActive ? 'Aktiv' : 'Inaktiv'}
                  </span>
                </div>

                <dl className="mt-4 grid grid-cols-1 gap-3 text-sm">
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Initiative</dt>
                    <dd className="mt-1">
                      <select
                        value={user.initiative?.id ?? ''}
                        onChange={(event) => onInitiativeChange(user.id, event.target.value)}
                        className="min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-[#0053a0] focus:ring-2 focus:ring-[#0053a0]/15"
                        disabled={!canManageUser || initiatives.length === 0 || isDisponent}
                      >
                        <option value="">Keine Initiative</option>
                        {initiatives.map((initiative) => (
                          <option key={initiative.id} value={initiative.id}>
                            {initiative.name}
                          </option>
                        ))}
                      </select>
                    </dd>
                  </div>

                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Aktive Rolle</dt>
                    <dd className="mt-1 break-words font-semibold text-slate-800">{activeRole}</dd>
                  </div>

                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Rollen</dt>
                    <dd className="mt-2 flex flex-wrap gap-2">
                      {renderRoleButtons(user, canManageUser, true)}
                    </dd>
                  </div>
                </dl>

                <div className="mt-4">
                  <button
                    type="button"
                    onClick={() => onNavigateToProfile(user.id)}
                    disabled={!canViewProfile}
                    title={
                      canViewProfile
                        ? 'Profil öffnen'
                        : 'Keine Berechtigung: Fremde Profile nur für Admin oder Disponent gleicher Initiative.'
                    }
                    className="min-h-11 w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition enabled:hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Profil anzeigen
                  </button>
                </div>
              </article>
            )
          })
        )}
      </div>

      <div className="hidden overflow-x-auto md:block">
        <table className="w-full table-fixed text-sm">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="w-1/6 px-2 py-3 text-left font-semibold text-slate-700">Benutzer-ID</th>
              <th className="w-1/5 px-2 py-3 text-left font-semibold text-slate-700">Benutzername</th>
              <th className="w-1/4 px-2 py-3 text-left font-semibold text-slate-700">E-Mail</th>
              <th className="w-1/6 px-2 py-3 text-left font-semibold text-slate-700">Initiative</th>
              <th className="w-1/3 px-2 py-3 text-left font-semibold text-slate-700">Rollen</th>
              <th className="w-1/6 px-2 py-3 text-left font-semibold text-slate-700">Profil</th>
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
                const { canManageUser, canViewProfile } = getUserPermissions(user)

                return (
                  <tr key={user.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="truncate px-2 py-3 text-slate-700">{user.id}</td>
                    <td className="truncate px-2 py-3 text-slate-700">{user.username}</td>
                    <td className="truncate px-2 py-3 text-slate-700">{user.email}</td>
                    <td className="px-2 py-3">
                      <select
                        value={user.initiative?.id ?? ''}
                        onChange={(event) => onInitiativeChange(user.id, event.target.value)}
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
                        {renderRoleButtons(user, canManageUser)}
                      </div>
                    </td>
                    <td className="px-2 py-3">
                      <button
                        type="button"
                        onClick={() => onNavigateToProfile(user.id)}
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
                )
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
          <span>Treffer: {totalItems}</span>
          <label htmlFor="pageSize" className="ml-2 text-xs font-semibold text-slate-600">
            Pro Seite
          </label>
          <select
            id="pageSize"
            value={pageSize}
            onChange={(event) => onPageSizeChange(Number(event.target.value))}
            className="min-h-9 rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs text-slate-700 outline-none transition focus:border-[#0053a0] focus:ring-2 focus:ring-[#0053a0]/15"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
        </div>

        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 sm:flex sm:gap-3">
          <button
            type="button"
            onClick={() => onPageChange((current) => Math.max(1, current - 1))}
            disabled={page <= 1}
            className="min-h-11 rounded-full border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-600 transition enabled:hover:bg-slate-100 disabled:opacity-50"
          >
            Zurück
          </button>
          <span className="whitespace-nowrap text-center text-xs font-semibold text-slate-600">
            Seite {totalPages === 0 ? 0 : page} von {totalPages}
          </span>
          <button
            type="button"
            onClick={() => onPageChange((current) => current + 1)}
            disabled={totalPages === 0 || page >= totalPages}
            className="min-h-11 rounded-full border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-600 transition enabled:hover:bg-slate-100 disabled:opacity-50"
          >
            Weiter
          </button>
        </div>
      </div>
    </section>
  )
}

export default UsersRoleTable

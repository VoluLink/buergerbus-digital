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
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        {canManageRoleAssignments ? (
          <button
            type="button"
            onClick={onOpenCreateModal}
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
          onChange={(event) => onSearchChange(event.target.value)}
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
                  || (currentUserId != null && currentUserId === user.id)
                  || (
                    isDisponent
                    && currentUserInitiativeId != null
                    && user.initiative?.id != null
                    && currentUserInitiativeId === user.initiative.id
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

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span>Treffer: {totalItems}</span>
          <label htmlFor="pageSize" className="ml-2 text-xs font-semibold text-slate-600">
            Pro Seite
          </label>
          <select
            id="pageSize"
            value={pageSize}
            onChange={(event) => onPageSizeChange(Number(event.target.value))}
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
            onClick={() => onPageChange((current) => Math.max(1, current - 1))}
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
            onClick={() => onPageChange((current) => current + 1)}
            disabled={totalPages === 0 || page >= totalPages}
            className="rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-600 transition enabled:hover:bg-slate-100 disabled:opacity-50"
          >
            Weiter
          </button>
        </div>
      </div>
    </section>
  )
}

export default UsersRoleTable

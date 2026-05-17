import { useEffect, useState } from 'react'
import {
  Bus,
  Menu,
  Settings,
  UserRound,
  UserRoundPlus,
  X,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { fetchUsers, updateUserRoles, updateUserStatus, type User } from '../services/users'

type UserRole = 'Admin' | 'Disponend' | 'Fahrer'

function RollenverteilungPage() {
  const navigate = useNavigate()
  const [isSideMenuOpen, setIsSideMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Lade Nutzer vom Backend beim Komponenten-Mount
  useEffect(() => {
    async function loadUsers() {
      try {
        const fetchedUsers = await fetchUsers()
        setUsers(fetchedUsers)
      } catch {
        console.error('Fehler beim Laden der Nutzer')
      } finally {
        setIsLoading(false)
      }
    }

    loadUsers()
  }, [])

  const availableRoles: UserRole[] = ['Admin', 'Disponend', 'Fahrer']

  function closeSideMenu() {
    setIsSideMenuOpen(false)
  }

  function goToPage(path: string) {
    closeSideMenu()
    navigate(path)
  }

  function handleStatusToggle(index: number) {
    const user = users[index]
    const newStatus = user.status === 'Aktiv' ? 'Inaktiv' : 'Aktiv'

    // Lokales State aktualisieren
    setUsers((prev) =>
      prev.map((u, i) => (i === index ? { ...u, status: newStatus } : u)),
    )

    // Backend aktualisieren
    updateUserStatus(user.id, newStatus).catch(() => {
      // Bei Fehler zurückrollen
      setUsers((prev) =>
        prev.map((u, i) => (i === index ? { ...u, status: user.status } : u)),
      )
    })
  }

  function toggleRole(index: number, role: UserRole) {
    const user = users[index]
    const hasRole = user.roles.includes(role)
    const newRoles = hasRole ? user.roles.filter((r) => r !== role) : [...user.roles, role]

    // Lokales State aktualisieren
    setUsers((prev) =>
      prev.map((u, i) => (i === index ? { ...u, roles: newRoles } : u)),
    )

    // Backend aktualisieren
    updateUserRoles(user.id, newRoles).catch(() => {
      // Bei Fehler zurückrollen
      setUsers((prev) =>
        prev.map((u, i) => (i === index ? { ...u, roles: user.roles } : u)),
      )
    })
  }

  const filteredUsers = users.filter(
    (user) =>
      user.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()),
  )

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

          <button
            type="button"
            onClick={() => navigate('/profil')}
            className="ml-auto flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-left transition hover:bg-slate-50"
          >
            <span className="text-sm font-semibold text-slate-700">Profil</span>

            <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#0053a0] text-white shadow-md">
              <UserRound className="h-6 w-6" aria-hidden="true" />
            </div>
          </button>
        </div>
      </header>

      <div className="p-2 sm:p-3 lg:p-4">
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="mb-4">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Suche nach Nutzer, E-Mail, Fahrer-ID oder Rolle ..."
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#0053a0] focus:ring-2 focus:ring-[#0053a0]/15"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm table-fixed">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="px-2 py-3 text-left font-semibold text-slate-700 w-1/6">Benutzer-ID</th>
                  <th className="px-2 py-3 text-left font-semibold text-slate-700 w-1/6">Benutzername</th>
                  <th className="px-2 py-3 text-left font-semibold text-slate-700 w-1/6">E-Mail</th>
                  <th className="px-2 py-3 text-left font-semibold text-slate-700 w-1/12">Fahrer-ID</th>
                  <th className="px-2 py-3 text-left font-semibold text-slate-700 w-1/12">Standort</th>
                  <th className="px-2 py-3 text-left font-semibold text-slate-700 w-1/4">Rollen</th>
                  <th className="px-2 py-3 text-left font-semibold text-slate-700 w-1/12">Status</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                      Nutzer werden geladen...
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                      Keine Nutzer gefunden
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="px-2 py-3 text-slate-700 truncate">{user.id}</td>
                      <td className="px-2 py-3 text-slate-700 truncate">{user.username}</td>
                      <td className="px-2 py-3 text-slate-700 truncate">{user.email}</td>
                      <td className="px-2 py-3 text-slate-500 truncate">{user.fahrerId}</td>
                      <td className="px-2 py-3">
                        <select className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-700 outline-none transition focus:border-[#0053a0] focus:ring-2 focus:ring-[#0053a0]/15">
                          <option></option>
                        </select>
                      </td>
                      <td className="px-2 py-3">
                        <div className="flex flex-nowrap gap-2 overflow-x-auto">
                          {availableRoles.map((role) => (
                            <button
                              key={role}
                              type="button"
                              onClick={() => toggleRole(users.indexOf(user), role)}
                              className={`flex-shrink-0 rounded-full px-3 py-1 text-xs font-semibold transition ${
                                user.roles.includes(role)
                                  ? role === 'Admin'
                                    ? 'bg-[#0053a0] text-white'
                                    : role === 'Disponend'
                                      ? 'bg-amber-500 text-white'
                                      : 'bg-emerald-600 text-white'
                                  : 'border border-slate-300 bg-white text-slate-500 hover:bg-slate-50'
                              }`}
                            >
                              {role}
                            </button>
                          ))}
                        </div>
                      </td>
                      <td className="px-2 py-3">
                        <button
                          type="button"
                          onClick={() => handleStatusToggle(users.indexOf(user))}
                          className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                            user.status === 'Aktiv'
                              ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                              : 'bg-red-100 text-red-700 hover:bg-red-200'
                          }`}
                        >
                          {user.status}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>


        </section>
      </div>

      {/* Side Menu */}
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

              <button
                type="button"
                onClick={() => goToPage('/fahrerinfos')}
                className="flex w-full items-center gap-3 rounded-2xl bg-[#0053a0]/12 px-4 py-3 text-left text-lg font-medium text-[#0053a0]"
              >
                <UserRound className="h-5 w-5" aria-hidden="true" />
                Fahrerinfos
              </button>

              <button
                type="button"
                onClick={() => goToPage('/fahrzeuginfos')}
                className="flex w-full items-center gap-3 rounded-2xl bg-[#0053a0]/12 px-4 py-3 text-left text-lg font-medium text-[#0053a0]"
              >
                <Bus className="h-5 w-5" aria-hidden="true" />
                Fahrzeuginfos
              </button>

              <button
                type="button"
                onClick={() => goToPage('/fahrgastinfos')}
                className="flex w-full items-center gap-3 rounded-2xl bg-[#0053a0]/12 px-4 py-3 text-left text-lg font-medium text-[#0053a0]"
              >
                <UserRoundPlus className="h-5 w-5" aria-hidden="true" />
                Fahrgastinfos
              </button>

              <button
                type="button"
                onClick={() => goToPage('/rollenverteilung')}
                className="flex w-full items-center gap-3 rounded-2xl bg-[#0053a0] px-4 py-3 text-left text-lg font-medium text-white"
              >
                <Settings className="h-5 w-5" aria-hidden="true" />
                Rollenverteilung
              </button>
            </div>
          </aside>
        </div>
      ) : null}
    </main>
  )
}

export default RollenverteilungPage
import { useEffect, useState } from 'react'
import { Bus, CircleUserRound, Menu, Search, Settings, UserRound, UserRoundPlus, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import type { FahrerListItem } from '../types/FahrerListItem'
import { getAllFahrer } from '../services/fahrerList'
import UserMenuButton from '../components/UserMenuButton'
import { useRoleVisibility } from '../hooks/useRoleVisibility'

function FahrerinfosPage() {
  const navigate = useNavigate()
  const { canManageInitiatives } = useRoleVisibility()
  const [isSideMenuOpen, setIsSideMenuOpen] = useState(false)
  const [drivers, setDrivers] = useState<FahrerListItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    let isMounted = true
    setIsLoading(true)
    setError(null)

    getAllFahrer()
      .then((data) => {
        if (!isMounted) return
        setDrivers(data)
      })
      .catch((err) => {
        if (!isMounted) return
        setDrivers([])
        setError(err instanceof Error ? err.message : 'Fahrerprofil konnte nicht geladen werden.')
      })
      .finally(() => {
        if (!isMounted) return
        setIsLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [])

  function closeSideMenu() {
    setIsSideMenuOpen(false)
  }

  function goToPage(path: string) {
    closeSideMenu()
    navigate(path)
  }

  const filteredDrivers = drivers.filter((driver) => {
    const haystack = `${driver.fahrerId} ${driver.name} ${driver.telefonnummer ?? ''} ${driver.status} ${driver.bemerkung ?? ''}`.toLowerCase()
    return haystack.includes(searchQuery.trim().toLowerCase())
  })

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
          </div>

          <UserMenuButton
            onClick={() => navigate('/profil')}
            icon={<CircleUserRound className="h-6 w-6" aria-hidden="true" />}
          />
        </div>
      </header>

      <div className="p-3 sm:p-4 lg:p-6">
        <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-5 sm:p-6">
            <h1 className="text-4xl font-bold tracking-tight text-slate-800">Fahrerinfos</h1>

            <div className="mt-4 w-full">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Suche nach Name, Telefonnummer, Status ..."
                  className="w-full rounded-xl border border-slate-300 py-2 pl-9 pr-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#0053a0] focus:ring-2 focus:ring-[#0053a0]/15"
                />
              </div>
            </div>
          </div>

          <div className="p-5 sm:p-6">
            {isLoading ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                Lade Fahrer ...
              </div>
            ) : error ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                {error}
              </div>
            ) : filteredDrivers.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                {searchQuery.trim() ? 'Keine passenden Fahrer gefunden.' : 'Keine Fahrer vorhanden.'}
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50">
                      <th className="px-4 py-3 text-left font-semibold text-slate-700">Fahrer-ID</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700">Name</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700">Telefonnummer</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700">Status</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700">Bemerkung</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDrivers.map((driver) => (
                      <tr key={driver.fahrerId} className="border-b border-slate-100">
                        <td className="px-4 py-3">{driver.fahrerId}</td>
                        <td className="px-4 py-3">{driver.name}</td>
                        <td className="px-4 py-3">{driver.telefonnummer || '—'}</td>
                        <td className="px-4 py-3">{driver.status}</td>
                        <td className="px-4 py-3">{driver.bemerkung || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      </div>

      {isSideMenuOpen ? (
        <div
          className="fixed inset-0 z-30 bg-slate-900/45 backdrop-blur-[2px]"
          onClick={closeSideMenu}
        >
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
                className="flex w-full items-center gap-3 rounded-2xl bg-[#0053a0] px-4 py-3 text-left text-lg font-medium text-white"
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

              <button
                type="button"
                onClick={() => goToPage('/rollenverteilung')}
                className="flex w-full items-center gap-3 rounded-2xl bg-[#0053a0]/12 px-4 py-3 text-left text-lg font-medium text-[#0053a0]"
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

export default FahrerinfosPage
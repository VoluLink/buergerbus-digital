import { type ReactNode, useEffect, useState } from 'react'
import { CircleUserRound, Menu, Search } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import type { FahrerListItem } from '../types/FahrerListItem'
import { getAllFahrer } from '../services/fahrerList'
import UserMenuButton from '../components/UserMenuButton'
import ProtectedSideMenu from '../components/ProtectedSideMenu'

function FahrerinfosPage() {
  const navigate = useNavigate()
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


  function renderPhoneLink(phoneNumber?: string | null): ReactNode {
    if (!phoneNumber) {
      return '-'
    }

    return (
      <a className="break-words font-medium text-[#0053a0] underline-offset-2 hover:underline" href={`tel:${phoneNumber}`}>
        {phoneNumber}
      </a>
    )
  }

  function renderEmailLink(email?: string | null): ReactNode {
    if (!email) {
      return null
    }

    return (
      <a className="break-all font-medium text-[#0053a0] underline-offset-2 hover:underline" href={`mailto:${email}`}>
        {email}
      </a>
    )
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
              aria-label="Navigation Ã¶ffnen"
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
              <>
                <div className="space-y-3 md:hidden">
                  {filteredDrivers.map((driver) => (
                    <article
                      key={driver.fahrerId}
                      className={`rounded-2xl border p-4 shadow-sm ${
                        driver.aktiv ? 'border-slate-200 bg-white' : 'border-red-200 bg-red-50'
                      }`}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h2 className="break-words text-lg font-semibold leading-6 text-slate-900">{driver.name}</h2>
                          <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Fahrer-ID {driver.fahrerId}
                          </p>
                        </div>
                        <span
                          className={`inline-flex min-h-11 items-center rounded-xl px-3 py-2 text-sm font-semibold ${
                            driver.aktiv ? 'bg-emerald-50 text-emerald-700' : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {driver.status}
                        </span>
                      </div>

                      <dl className="mt-4 grid grid-cols-1 gap-3 text-sm">
                        <div>
                          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Telefon</dt>
                          <dd className="mt-1 break-words text-slate-800">{renderPhoneLink(driver.telefonnummer)}</dd>
                        </div>

                        {driver.email ? (
                          <div>
                            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">E-Mail</dt>
                            <dd className="mt-1 text-slate-800">{renderEmailLink(driver.email)}</dd>
                          </div>
                        ) : null}

                        <div>
                          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Fahrzeug</dt>
                          <dd className="mt-1 break-words text-slate-800">{driver.fahrzeug || '-'}</dd>
                        </div>

                        <div>
                          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Bemerkung</dt>
                          <dd className="mt-1 break-words text-slate-800">{driver.bemerkung || '-'}</dd>
                        </div>
                      </dl>
                    </article>
                  ))}
                </div>

                <div className="hidden overflow-x-auto rounded-2xl border border-slate-200 md:block">
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
                          <td className="px-4 py-3">{renderPhoneLink(driver.telefonnummer)}</td>
                          <td className="px-4 py-3">{driver.status}</td>
                          <td className="px-4 py-3">{driver.bemerkung || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </section>
      </div>

      <ProtectedSideMenu isOpen={isSideMenuOpen} onClose={closeSideMenu} />
    </main>
  )
}

export default FahrerinfosPage

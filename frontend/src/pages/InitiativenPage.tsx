import { useCallback, useEffect, useState } from 'react'
import { Bus, CircleUserRound, Menu, Settings, UserRound, UserRoundPlus, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import UserMenuButton from '../components/UserMenuButton'
import { createInitiative, getInitiativen } from '../services/initiativeApi'
import type { Initiative } from '../types/Initiative'

type InitiativeFormState = {
  name: string
  beschreibung: string
}

function formatDateDisplay(value: string | null | undefined) {
  if (!value) {
    return '—'
  }

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('de-DE', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(parsed)
}

function createEmptyForm(): InitiativeFormState {
  return {
    name: '',
    beschreibung: '',
  }
}

function InitiativenPage() {
  const navigate = useNavigate()
  const [isSideMenuOpen, setIsSideMenuOpen] = useState(false)

  const [initiatives, setInitiatives] = useState<Initiative[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [createForm, setCreateForm] = useState<InitiativeFormState>(createEmptyForm())
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const loadInitiatives = useCallback(async () => {
    setIsLoading(true)
    setLoadError(null)

    try {
      const data = await getInitiativen()
      setInitiatives(data)
    } catch (err) {
      setInitiatives([])
      setLoadError(err instanceof Error ? err.message : 'Initiativen konnten nicht geladen werden.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    let isMounted = true

    void (async () => {
      setIsLoading(true)
      setLoadError(null)

      try {
        const data = await getInitiativen()
        if (!isMounted) return
        setInitiatives(data)
      } catch (err) {
        if (!isMounted) return
        setInitiatives([])
        setLoadError(err instanceof Error ? err.message : 'Initiativen konnten nicht geladen werden.')
      } finally {
        if (!isMounted) return
        setIsLoading(false)
      }
    })()

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

  function openCreateModal() {
    setCreateForm(createEmptyForm())
    setSaveError(null)
    setIsCreateModalOpen(true)
  }

  function closeCreateModal() {
    if (isSaving) {
      return
    }

    setIsCreateModalOpen(false)
  }

  function updateCreateField(field: keyof InitiativeFormState, value: string) {
    setCreateForm((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  async function handleCreateInitiative() {
    const trimmedName = createForm.name.trim()

    if (!trimmedName) {
      setSaveError('Bitte einen Namen eingeben.')
      return
    }

    setIsSaving(true)
    setSaveError(null)

    try {
      await createInitiative({
        name: trimmedName,
        beschreibung: createForm.beschreibung.trim(),
      })

      setIsCreateModalOpen(false)
      setCreateForm(createEmptyForm())
      await loadInitiatives()
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Initiative konnte nicht erstellt werden.')
    } finally {
      setIsSaving(false)
    }
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

            <h1 className="text-2xl font-bold text-slate-800">Initiativen</h1>
          </div>

          <UserMenuButton
            onClick={() => navigate('/profil')}
            icon={<CircleUserRound className="h-6 w-6" aria-hidden="true" />}
          />
        </div>
      </header>

      <div className="p-3 sm:p-4 lg:p-6">
        <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-5 sm:p-6">
            <div>
              <h2 className="text-4xl font-bold tracking-tight text-slate-800">Initiativen</h2>
              <p className="mt-2 text-sm text-slate-600">
                Übersicht aller vorhandenen Initiativen.
              </p>
            </div>

            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              + Initiative hinzufügen
            </button>
          </div>

          <div className="p-5 sm:p-6">
            {isLoading ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                Lade Initiativen ...
              </div>
            ) : loadError ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                {loadError}
              </div>
            ) : initiatives.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                Keine Initiativen vorhanden.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50">
                      <th className="px-4 py-3 text-left font-semibold text-slate-700">ID</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700">Name</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700">Beschreibung</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700">Angelegt am</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700">Geändert am</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700">Button</th>
                    </tr>
                  </thead>
                  <tbody>
                    {initiatives.map((initiative) => (
                      <tr key={initiative.id} className="border-b border-slate-100">
                        <td className="px-4 py-3 tabular-nums">{initiative.id}</td>
                        <td className="px-4 py-3 font-medium text-slate-900">{initiative.name}</td>
                        <td className="px-4 py-3 text-slate-700">{initiative.beschreibung || '—'}</td>
                        <td className="px-4 py-3 text-slate-700">{formatDateDisplay(initiative.angelegtAm)}</td>
                        <td className="px-4 py-3 text-slate-700">{formatDateDisplay(initiative.geaendertAm)}</td>
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            disabled
                            className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-500"
                            aria-disabled="true"
                          >
                            —
                          </button>
                        </td>
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
                onClick={() => goToPage('/initiativen')}
                className="flex w-full items-center gap-3 rounded-2xl bg-[#0053a0] px-4 py-3 text-left text-lg font-medium text-white"
              >
                <Bus className="h-5 w-5" aria-hidden="true" />
                Initiativen
              </button>

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

      {isCreateModalOpen ? (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
          onClick={closeCreateModal}
        >
          <section
            className="relative w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-[0_35px_80px_rgba(15,23,42,0.4)]"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="bg-[#0053a0] px-6 py-5 text-white sm:px-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                    Initiative hinzufügen
                  </h2>
                  <p className="mt-1 text-sm text-white/80">
                    Name und Beschreibung angeben.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeCreateModal}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-xl text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
                  aria-label="Modal schließen"
                  disabled={isSaving}
                >
                  <X className="h-7 w-7" aria-hidden="true" />
                </button>
              </div>
            </header>

            <div className="space-y-5 px-6 py-6 sm:px-8">
              {saveError ? (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                  {saveError}
                </div>
              ) : null}

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm font-semibold text-slate-700">
                  Name
                  <input
                    type="text"
                    value={createForm.name}
                    onChange={(event) => updateCreateField('name', event.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#0053a0] focus:ring-2 focus:ring-[#0053a0]/15"
                    placeholder="z.B. Neue Initiative"
                  />
                </label>

                <label className="block text-sm font-semibold text-slate-700">
                  Beschreibung
                  <input
                    type="text"
                    value={createForm.beschreibung}
                    onChange={(event) => updateCreateField('beschreibung', event.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#0053a0] focus:ring-2 focus:ring-[#0053a0]/15"
                    placeholder="Beschreibung der Initiative"
                  />
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <label className="block text-sm font-semibold text-slate-700">
                  ID
                  <input
                    type="text"
                    disabled
                    value="Wird automatisch vergeben"
                    className="mt-1 w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500"
                  />
                </label>

                <label className="block text-sm font-semibold text-slate-700">
                  Angelegt am
                  <input
                    type="text"
                    disabled
                    value="Wird automatisch gesetzt"
                    className="mt-1 w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500"
                  />
                </label>

                <label className="block text-sm font-semibold text-slate-700">
                  Geändert am
                  <input
                    type="text"
                    disabled
                    value="Wird automatisch gesetzt"
                    className="mt-1 w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500"
                  />
                </label>
              </div>

              <div className="flex flex-wrap items-center justify-end gap-3 border-t border-slate-200 pt-5">
                <button
                  type="button"
                  onClick={closeCreateModal}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={isSaving}
                >
                  Abbrechen
                </button>

                <button
                  type="button"
                  onClick={() => void handleCreateInitiative()}
                  className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={isSaving}
                >
                  {isSaving ? 'Speichere...' : 'Speichern'}
                </button>
              </div>
            </div>
          </section>
        </div>
      ) : null}
    </main>
  )
}

export default InitiativenPage

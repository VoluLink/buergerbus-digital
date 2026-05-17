import { useEffect, useState } from 'react'
import { Bus, CircleUserRound, Menu, Search, Settings, UserRound, UserRoundPlus, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import {
  createFahrgast,
  deleteFahrgast,
  getFahrgaeste,
  updateFahrgast,
} from '../services/fahrgastApi'
import type { Fahrgast, FahrgastFormData } from '../types/Fahrgast'
import UserMenuButton from '../components/UserMenuButton'

function formatDateDisplay(value: string) {
  if (!value) {
    return '-'
  }

  const parsedDate = new Date(value)
  if (Number.isNaN(parsedDate.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('de-DE').format(parsedDate)
}

function createFormFromGuest(guest: Fahrgast): FahrgastFormData {
  return {
    vorname: guest.vorname,
    nachname: guest.nachname,
    adresse: guest.adresse,
    email: guest.email,
    telefonnummer: guest.telefonnummer,
    bemerkung: guest.bemerkung,
    letzteNutzung: guest.letzteNutzung.slice(0, 10),
    aktiv: guest.aktiv ? 'true' : 'false',
    initiativeId: String(guest.initiativeId),
  }
}

function createEmptyForm(): FahrgastFormData {
  return {
    vorname: '',
    nachname: '',
    adresse: '',
    email: '',
    telefonnummer: '',
    bemerkung: '',
    letzteNutzung: '',
    aktiv: 'true',
    initiativeId: '1',
  }
}

function toGuestModel(form: FahrgastFormData, existing: Fahrgast | null, nextId: number): Fahrgast {
  const nowIso = new Date().toISOString()

  return {
    id: existing?.id ?? nextId,
    vorname: form.vorname.trim(),
    nachname: form.nachname.trim(),
    adresse: form.adresse.trim(),
    email: form.email.trim(),
    telefonnummer: form.telefonnummer.trim(),
    bemerkung: form.bemerkung.trim(),
    angelegtAm: existing?.angelegtAm ?? nowIso,
    geaendertAm: existing ? nowIso : '',
    letzteNutzung: form.letzteNutzung ? `${form.letzteNutzung}T00:00:00Z` : nowIso,
    aktiv: form.aktiv === 'true',
    initiativeId: Number(form.initiativeId),
  }
}

function FahrgastinfosPage() {
  const navigate = useNavigate()
  const [isSideMenuOpen, setIsSideMenuOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [guests, setGuests] = useState<Fahrgast[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [selectedGuestId, setSelectedGuestId] = useState<number | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [editForm, setEditForm] = useState<FahrgastFormData>(createEmptyForm())
  const [createForm, setCreateForm] = useState<FahrgastFormData>(createEmptyForm())

  const selectedGuest = guests.find((entry) => entry.id === selectedGuestId) ?? null

  useEffect(() => {
    let isActive = true

    setIsLoading(true)
    setLoadError('')

    void getFahrgaeste()
      .then((loadedGuests) => {
        if (!isActive) {
          return
        }

        setGuests(loadedGuests)
        setSelectedGuestId(null)
      })
      .catch(() => {
        if (isActive) {
          setLoadError('Fahrgastdaten konnten nicht geladen werden.')
        }
      })
      .finally(() => {
        if (isActive) {
          setIsLoading(false)
        }
      })

    return () => {
      isActive = false
    }
  }, [])

  const filteredGuests = guests.filter((entry) => {
    const haystack = `${entry.vorname} ${entry.nachname} ${entry.adresse} ${entry.telefonnummer}`.toLowerCase()
    return haystack.includes(searchQuery.trim().toLowerCase())
  })

  function closeSideMenu() {
    setIsSideMenuOpen(false)
  }

  function goToPage(path: string) {
    closeSideMenu()
    navigate(path)
  }

  function handleOpenEditModal() {
    if (!selectedGuest) {
      return
    }

    setEditForm(createFormFromGuest(selectedGuest))
    setIsEditModalOpen(true)
  }

  function handleCloseEditModal() {
    setIsEditModalOpen(false)
  }

  function handleEditFormChange(field: keyof FahrgastFormData, value: string) {
    setEditForm((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  function handleCreateFormChange(field: keyof FahrgastFormData, value: string) {
    setCreateForm((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  async function handleSaveGuestChanges() {
    if (!selectedGuest) {
      return
    }

    const updatedGuest = toGuestModel(editForm, selectedGuest, selectedGuest.id)
    const savedGuest = await updateFahrgast(selectedGuest.id, updatedGuest)

    setGuests((prev) => prev.map((entry) => (entry.id === selectedGuest.id ? savedGuest : entry)))
    setIsEditModalOpen(false)
  }

  async function handleDeleteGuest() {
    if (!selectedGuestId || !selectedGuest) {
      return
    }

    const shouldDelete = window.confirm('Sind Sie sicher, dass Sie diesen Fahrgast löschen möchten?')

    if (!shouldDelete) {
      return
    }

    await deleteFahrgast(selectedGuest.id)

    setGuests((prev) => prev.filter((entry) => entry.id !== selectedGuest.id))
    setSelectedGuestId(null)
  }

  function handleOpenCreateModal() {
    setCreateForm(createEmptyForm())
    setIsCreateModalOpen(true)
  }

  function handleCloseCreateModal() {
    setIsCreateModalOpen(false)
  }

  async function handleCreateGuest() {
    const nextId = guests.length > 0 ? Math.max(...guests.map((entry) => entry.id)) + 1 : 1
    const newGuest = toGuestModel(createForm, null, nextId)
    const savedGuest = await createFahrgast(newGuest)

    setGuests((prev) => [...prev, savedGuest])
    setSelectedGuestId(savedGuest.id)
    setIsCreateModalOpen(false)
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
            <h1 className="text-4xl font-bold tracking-tight text-slate-800">Fahrgastinfos</h1>

            <div className="mt-4 w-full">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Suche nach Name, Adresse, Telefonnummer ..."
                  className="w-full rounded-xl border border-slate-300 py-2 pl-9 pr-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#0053a0] focus:ring-2 focus:ring-[#0053a0]/15"
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">Auswahl</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">Vorname</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">Nachname</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">Adresse</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">Telefonnummer</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">Bemerkungen</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td className="px-4 py-6 text-center text-sm text-slate-500" colSpan={6}>
                      Fahrgäste werden geladen...
                    </td>
                  </tr>
                ) : filteredGuests.length > 0 ? (
                  filteredGuests.map((guest) => (
                    <tr key={guest.id} className="border-b border-slate-100">
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedGuestId === guest.id}
                          onChange={(event) => setSelectedGuestId(event.target.checked ? guest.id : null)}
                        />
                      </td>
                      <td className="px-4 py-3">{guest.vorname}</td>
                      <td className="px-4 py-3">{guest.nachname}</td>
                      <td className="px-4 py-3">{guest.adresse}</td>
                      <td className="px-4 py-3">{guest.telefonnummer || '-'}</td>
                      <td className="px-4 py-3">{guest.bemerkung || '-'}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="px-4 py-6 text-center text-sm text-slate-500" colSpan={6}>
                      {loadError || 'Kein Fahrgast vorhanden.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex w-full items-center justify-end gap-3 p-4">
            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
            >
              Fahrgast hinzufügen
            </button>
            <button
              type="button"
              onClick={handleOpenEditModal}
              disabled={!selectedGuestId}
              className={`rounded-xl px-5 py-2.5 text-sm font-semibold transition ${
                selectedGuestId
                  ? 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                  : 'cursor-not-allowed border border-slate-200 bg-slate-100 text-slate-400'
              }`}
            >
              Bearbeiten
            </button>
            <button
              type="button"
              onClick={handleDeleteGuest}
              disabled={!selectedGuestId}
              className={`rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition ${
                selectedGuestId
                  ? 'bg-rose-500 hover:bg-rose-600'
                  : 'cursor-not-allowed bg-rose-200'
              }`}
            >
              Gast löschen
            </button>
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
                className="flex w-full items-center gap-3 rounded-2xl bg-[#0053a0] px-4 py-3 text-left text-lg font-medium text-white"
              >
                <UserRoundPlus className="h-5 w-5" aria-hidden="true" />
                Fahrgastinfos
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

      {isEditModalOpen ? (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
          onClick={handleCloseEditModal}
        >
          <section
            className="w-full max-w-3xl rounded-2xl bg-white p-6 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <h2 className="text-xl font-bold text-slate-800">Fahrgast bearbeiten</h2>
              <button
                type="button"
                onClick={handleCloseEditModal}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                aria-label="Bearbeiten schließen"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            <form
              className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2"
              onSubmit={(event) => {
                event.preventDefault()
                void handleSaveGuestChanges()
              }}
            >
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600">Vorname</label>
                <input
                  type="text"
                  value={editForm.vorname}
                  onChange={(event) => handleEditFormChange('vorname', event.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600">Nachname</label>
                <input
                  type="text"
                  value={editForm.nachname}
                  onChange={(event) => handleEditFormChange('nachname', event.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600">Adresse</label>
                <input
                  type="text"
                  value={editForm.adresse}
                  onChange={(event) => handleEditFormChange('adresse', event.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600">E-Mail</label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(event) => handleEditFormChange('email', event.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600">Telefonnummer</label>
                <input
                  type="text"
                  value={editForm.telefonnummer}
                  onChange={(event) => handleEditFormChange('telefonnummer', event.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600">Letzte Nutzung</label>
                <input
                  type="date"
                  value={editForm.letzteNutzung}
                  onChange={(event) => handleEditFormChange('letzteNutzung', event.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600">Aktiv</label>
                <select
                  value={editForm.aktiv}
                  onChange={(event) => handleEditFormChange('aktiv', event.target.value as 'true' | 'false')}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                >
                  <option value="true">Ja</option>
                  <option value="false">Nein</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600">Initiative-ID</label>
                <input
                  type="number"
                  value={editForm.initiativeId}
                  onChange={(event) => handleEditFormChange('initiativeId', event.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600">Bemerkungen</label>
                <textarea
                  value={editForm.bemerkung}
                  onChange={(event) => handleEditFormChange('bemerkung', event.target.value)}
                  rows={3}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                />
              </div>

              <div className="sm:col-span-2 mt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={handleCloseEditModal}
                  className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-[#0053a0] px-5 py-2.5 text-sm font-semibold text-white hover:brightness-110"
                >
                  Änderungen speichern
                </button>
              </div>
            </form>
          </section>
        </div>
      ) : null}

      {isCreateModalOpen ? (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
          onClick={handleCloseCreateModal}
        >
          <section
            className="w-full max-w-3xl rounded-2xl bg-white p-6 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <h2 className="text-xl font-bold text-slate-800">Fahrgast hinzufügen</h2>
              <button
                type="button"
                onClick={handleCloseCreateModal}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                aria-label="Hinzufügen schließen"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            <form
              className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2"
              onSubmit={(event) => {
                event.preventDefault()
                void handleCreateGuest()
              }}
            >
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600">Vorname</label>
                <input
                  type="text"
                  value={createForm.vorname}
                  onChange={(event) => handleCreateFormChange('vorname', event.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600">Nachname</label>
                <input
                  type="text"
                  value={createForm.nachname}
                  onChange={(event) => handleCreateFormChange('nachname', event.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600">Adresse</label>
                <input
                  type="text"
                  value={createForm.adresse}
                  onChange={(event) => handleCreateFormChange('adresse', event.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600">E-Mail</label>
                <input
                  type="email"
                  value={createForm.email}
                  onChange={(event) => handleCreateFormChange('email', event.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600">Telefonnummer</label>
                <input
                  type="text"
                  value={createForm.telefonnummer}
                  onChange={(event) => handleCreateFormChange('telefonnummer', event.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600">Letzte Nutzung</label>
                <input
                  type="date"
                  value={createForm.letzteNutzung}
                  onChange={(event) => handleCreateFormChange('letzteNutzung', event.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600">Aktiv</label>
                <select
                  value={createForm.aktiv}
                  onChange={(event) => handleCreateFormChange('aktiv', event.target.value as 'true' | 'false')}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                >
                  <option value="true">Ja</option>
                  <option value="false">Nein</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600">Initiative-ID</label>
                <input
                  type="number"
                  value={createForm.initiativeId}
                  onChange={(event) => handleCreateFormChange('initiativeId', event.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600">Bemerkungen</label>
                <textarea
                  value={createForm.bemerkung}
                  onChange={(event) => handleCreateFormChange('bemerkung', event.target.value)}
                  rows={3}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                />
              </div>

              <div className="sm:col-span-2 mt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={handleCloseCreateModal}
                  className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
                >
                  Gast anlegen
                </button>
              </div>
            </form>
          </section>
        </div>
      ) : null}

      {selectedGuest ? (
        <p className="px-6 pb-6 text-xs text-slate-500">
          Letzte Nutzung: {formatDateDisplay(selectedGuest.letzteNutzung)}
        </p>
      ) : null}
    </main>
  )
}

export default FahrgastinfosPage

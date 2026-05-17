import { useState, useEffect } from 'react'
import { Bus, CircleUserRound, Menu, Settings, UserRound, UserRoundPlus, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import type { Fahrer, FahrerFormData } from '../types/Fahrer'
import { getAllFahrer, createFahrer, updateFahrer, deleteFahrer } from '../services/fahrerApi'
import UserMenuButton from '../components/UserMenuButton'

function FahrerinfosPage() {
  const navigate = useNavigate()
  const [isSideMenuOpen, setIsSideMenuOpen] = useState(false)
  const [drivers, setDrivers] = useState<Fahrer[]>([])
  const [selectedDriverId, setSelectedDriverId] = useState<number | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editFormData, setEditFormData] = useState<FahrerFormData>({
    vorname: '',
    nachname: '',
    adresse: '',
    telefonnummer: '',
    fuehrerscheinklasse: '',
    letzteG25: '',
    naechsteG25: '',
    bemerkung: '',
    aktiv: true,
    emailadresse: '',
  })
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [addFormData, setAddFormData] = useState<FahrerFormData>({
    vorname: '',
    nachname: '',
    adresse: '',
    telefonnummer: '',
    fuehrerscheinklasse: '',
    letzteG25: '',
    naechsteG25: '',
    bemerkung: '',
    aktiv: true,
    emailadresse: '',
  })
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    getAllFahrer().then(setDrivers)
  }, [])

  const filteredDrivers = drivers.filter((driver) => {
    const query = searchQuery.toLowerCase()
    const fullName = `${driver.vorname} ${driver.nachname}`.toLowerCase()
    return (
      fullName.includes(query) ||
      (driver.telefonnummer ?? '').toLowerCase().includes(query) ||
      driver.emailadresse.toLowerCase().includes(query) ||
      (driver.bemerkung ?? '').toLowerCase().includes(query)
    )
  })

  const isDriverSelected = selectedDriverId !== null

  function closeSideMenu() {
    setIsSideMenuOpen(false)
  }

  function goToPage(path: string) {
    closeSideMenu()
    navigate(path)
  }

  function handleDeleteDriver() {
    if (selectedDriverId === null) {
      return
    }

    const isConfirmed = window.confirm('Möchtest du diesen Fahrer wirklich löschen?')
    if (!isConfirmed) {
      return
    }

    deleteFahrer(selectedDriverId).then(() => {
      getAllFahrer().then(setDrivers)
      setSelectedDriverId(null)
    })
  }

  function handleOpenAddModal() {
    setAddFormData({
      vorname: '',
      nachname: '',
      adresse: '',
      telefonnummer: '',
      fuehrerscheinklasse: '',
      letzteG25: '',
      naechsteG25: '',
      bemerkung: '',
      aktiv: true,
      emailadresse: '',
    })
    setIsAddModalOpen(true)
  }

  function handleCloseAddModal() {
    setIsAddModalOpen(false)
  }

  function handleSaveAdd() {
    createFahrer(addFormData).then((newDriver) => {
      setDrivers((previousDrivers) => [...previousDrivers, newDriver])
      setIsAddModalOpen(false)
    })
  }

  function handleOpenEditModal() {
    if (selectedDriverId === null) {
      return
    }

    const selectedDriver = drivers.find((driver) => driver.id === selectedDriverId)
    if (!selectedDriver) {
      return
    }

    setEditFormData({
      vorname: selectedDriver.vorname,
      nachname: selectedDriver.nachname,
      adresse: selectedDriver.adresse,
      telefonnummer: selectedDriver.telefonnummer ?? '',
      fuehrerscheinklasse: selectedDriver.fuehrerscheinklasse,
      letzteG25: selectedDriver.letzteG25,
      naechsteG25: selectedDriver.naechsteG25 ?? '',
      bemerkung: selectedDriver.bemerkung ?? '',
      aktiv: selectedDriver.aktiv,
      emailadresse: selectedDriver.emailadresse,
    })
    setIsEditModalOpen(true)
  }

  function handleCloseEditModal() {
    setIsEditModalOpen(false)
  }

  function handleSaveEdit() {
    if (selectedDriverId === null) {
      return
    }

    updateFahrer(selectedDriverId, editFormData).then((updatedDriver) => {
      setDrivers((previousDrivers) =>
        previousDrivers.map((driver) => (driver.id === selectedDriverId ? updatedDriver : driver)),
      )
      setIsEditModalOpen(false)
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
          </div>

          <div className="px-5 py-4 sm:px-6">
            <input
              type="search"
              placeholder="Fahrer suchen ..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-800 outline-none transition focus:border-[#0053a0] focus:ring-2 focus:ring-[#0053a0]/20"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">Auswahl</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">Name</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">Telefonnummer</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">Emailadresse</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">Adresse</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">Führerscheinklasse</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">Letzte G25</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">Nächste G25</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">Bemerkung</th>
                </tr>
              </thead>
              <tbody>
                {filteredDrivers.map((driver) => (
                  <tr key={driver.id} className="border-b border-slate-100">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedDriverId === driver.id}
                        onChange={(event) =>
                          setSelectedDriverId(event.target.checked ? driver.id : null)
                        }
                      />
                    </td>
                    <td className="px-4 py-3">{driver.vorname} {driver.nachname}</td>
                    <td className="px-4 py-3">{driver.telefonnummer}</td>
                    <td className="px-4 py-3">{driver.emailadresse}</td>
                    <td className="px-4 py-3">{driver.adresse}</td>
                    <td className="px-4 py-3">{driver.fuehrerscheinklasse}</td>
                    <td className="px-4 py-3">{driver.letzteG25}</td>
                    <td className="px-4 py-3">{driver.naechsteG25}</td>
                    <td className="px-4 py-3">{driver.bemerkung}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex w-full items-center justify-end gap-3 p-4">
            <button
              type="button"
              onClick={handleOpenAddModal}
              className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
            >
              Fahrer hinzufügen
            </button>
            <button
              type="button"
              disabled={!isDriverSelected}
              onClick={handleOpenEditModal}
              className={`rounded-xl px-5 py-2.5 text-sm font-semibold transition ${
                isDriverSelected
                  ? 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                  : 'cursor-not-allowed border border-slate-200 bg-slate-100 text-slate-400'
              }`}
            >
              Bearbeiten
            </button>
            <button
              type="button"
              disabled={!isDriverSelected}
              onClick={handleDeleteDriver}
              className={`rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition ${
                isDriverSelected
                  ? 'bg-rose-500 hover:bg-rose-600'
                  : 'cursor-not-allowed bg-rose-200'
              }`}
            >
              Fahrer löschen
            </button>
          </div>
        </section>
      </div>

      {isAddModalOpen ? (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/45 p-4 backdrop-blur-[2px]"
          onClick={handleCloseAddModal}
        >
          <div
            className="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <h2 className="text-2xl font-bold text-slate-800">Fahrer hinzufügen</h2>
              <button
                type="button"
                onClick={handleCloseAddModal}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100"
                aria-label="Formular schließen"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            <form
              className="grid grid-cols-1 gap-4 px-6 py-5 sm:grid-cols-2"
              onSubmit={(event) => {
                event.preventDefault()
                handleSaveAdd()
              }}
            >
              <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
                Vorname
                <input
                  type="text"
                  value={addFormData.vorname}
                  onChange={(event) => setAddFormData((p) => ({ ...p, vorname: event.target.value }))}
                  className="rounded-xl border border-slate-300 px-3 py-2 text-slate-800 outline-none transition focus:border-[#0053a0] focus:ring-2 focus:ring-[#0053a0]/20"
                  required
                />
              </label>

              <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
                Nachname
                <input
                  type="text"
                  value={addFormData.nachname}
                  onChange={(event) => setAddFormData((p) => ({ ...p, nachname: event.target.value }))}
                  className="rounded-xl border border-slate-300 px-3 py-2 text-slate-800 outline-none transition focus:border-[#0053a0] focus:ring-2 focus:ring-[#0053a0]/20"
                  required
                />
              </label>

              <label className="flex flex-col gap-1 text-sm font-medium text-slate-700 sm:col-span-2">
                Adresse
                <input
                  type="text"
                  value={addFormData.adresse}
                  onChange={(event) => setAddFormData((p) => ({ ...p, adresse: event.target.value }))}
                  className="rounded-xl border border-slate-300 px-3 py-2 text-slate-800 outline-none transition focus:border-[#0053a0] focus:ring-2 focus:ring-[#0053a0]/20"
                  required
                />
              </label>

              <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
                Telefonnummer
                <input
                  type="text"
                  value={addFormData.telefonnummer}
                  onChange={(event) => setAddFormData((p) => ({ ...p, telefonnummer: event.target.value }))}
                  className="rounded-xl border border-slate-300 px-3 py-2 text-slate-800 outline-none transition focus:border-[#0053a0] focus:ring-2 focus:ring-[#0053a0]/20"
                />
              </label>

              <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
                Emailadresse
                <input
                  type="email"
                  value={addFormData.emailadresse}
                  onChange={(event) => setAddFormData((p) => ({ ...p, emailadresse: event.target.value }))}
                  className="rounded-xl border border-slate-300 px-3 py-2 text-slate-800 outline-none transition focus:border-[#0053a0] focus:ring-2 focus:ring-[#0053a0]/20"
                />
              </label>

              <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
                Führerscheinklasse
                <input
                  type="text"
                  value={addFormData.fuehrerscheinklasse}
                  onChange={(event) => setAddFormData((p) => ({ ...p, fuehrerscheinklasse: event.target.value }))}
                  className="rounded-xl border border-slate-300 px-3 py-2 text-slate-800 outline-none transition focus:border-[#0053a0] focus:ring-2 focus:ring-[#0053a0]/20"
                  required
                />
              </label>

              <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
                Letzte G25-Untersuchung
                <input
                  type="date"
                  value={addFormData.letzteG25}
                  onChange={(event) => setAddFormData((p) => ({ ...p, letzteG25: event.target.value }))}
                  className="rounded-xl border border-slate-300 px-3 py-2 text-slate-800 outline-none transition focus:border-[#0053a0] focus:ring-2 focus:ring-[#0053a0]/20"
                  required
                />
              </label>

              <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
                Nächste G25-Untersuchung
                <input
                  type="date"
                  value={addFormData.naechsteG25}
                  onChange={(event) => setAddFormData((p) => ({ ...p, naechsteG25: event.target.value }))}
                  className="rounded-xl border border-slate-300 px-3 py-2 text-slate-800 outline-none transition focus:border-[#0053a0] focus:ring-2 focus:ring-[#0053a0]/20"
                />
              </label>

              <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={addFormData.aktiv}
                  onChange={(event) => setAddFormData((p) => ({ ...p, aktiv: event.target.checked }))}
                />
                Aktiv
              </label>

              <label className="flex flex-col gap-1 text-sm font-medium text-slate-700 sm:col-span-2">
                Bemerkung
                <textarea
                  value={addFormData.bemerkung}
                  onChange={(event) => setAddFormData((p) => ({ ...p, bemerkung: event.target.value }))}
                  className="min-h-24 rounded-xl border border-slate-300 px-3 py-2 text-slate-800 outline-none transition focus:border-[#0053a0] focus:ring-2 focus:ring-[#0053a0]/20"
                />
              </label>

              <div className="flex items-center justify-end gap-3 sm:col-span-2">
                <button
                  type="button"
                  onClick={handleCloseAddModal}
                  className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
                >
                  Fahrer hinzufügen
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {isEditModalOpen ? (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/45 p-4 backdrop-blur-[2px]"
          onClick={handleCloseEditModal}
        >
          <div
            className="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <h2 className="text-2xl font-bold text-slate-800">Fahrer bearbeiten</h2>
              <button
                type="button"
                onClick={handleCloseEditModal}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100"
                aria-label="Bearbeiten-Formular schließen"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            <form
              className="grid grid-cols-1 gap-4 px-6 py-5 sm:grid-cols-2"
              onSubmit={(event) => {
                event.preventDefault()
                handleSaveEdit()
              }}
            >
              <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
                Vorname
                <input
                  type="text"
                  value={editFormData.vorname}
                  onChange={(event) => setEditFormData((p) => ({ ...p, vorname: event.target.value }))}
                  className="rounded-xl border border-slate-300 px-3 py-2 text-slate-800 outline-none transition focus:border-[#0053a0] focus:ring-2 focus:ring-[#0053a0]/20"
                  required
                />
              </label>

              <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
                Nachname
                <input
                  type="text"
                  value={editFormData.nachname}
                  onChange={(event) => setEditFormData((p) => ({ ...p, nachname: event.target.value }))}
                  className="rounded-xl border border-slate-300 px-3 py-2 text-slate-800 outline-none transition focus:border-[#0053a0] focus:ring-2 focus:ring-[#0053a0]/20"
                  required
                />
              </label>

              <label className="flex flex-col gap-1 text-sm font-medium text-slate-700 sm:col-span-2">
                Adresse
                <input
                  type="text"
                  value={editFormData.adresse}
                  onChange={(event) => setEditFormData((p) => ({ ...p, adresse: event.target.value }))}
                  className="rounded-xl border border-slate-300 px-3 py-2 text-slate-800 outline-none transition focus:border-[#0053a0] focus:ring-2 focus:ring-[#0053a0]/20"
                  required
                />
              </label>

              <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
                Telefonnummer
                <input
                  type="text"
                  value={editFormData.telefonnummer}
                  onChange={(event) => setEditFormData((p) => ({ ...p, telefonnummer: event.target.value }))}
                  className="rounded-xl border border-slate-300 px-3 py-2 text-slate-800 outline-none transition focus:border-[#0053a0] focus:ring-2 focus:ring-[#0053a0]/20"
                />
              </label>

              <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
                Emailadresse
                <input
                  type="email"
                  value={editFormData.emailadresse}
                  onChange={(event) => setEditFormData((p) => ({ ...p, emailadresse: event.target.value }))}
                  className="rounded-xl border border-slate-300 px-3 py-2 text-slate-800 outline-none transition focus:border-[#0053a0] focus:ring-2 focus:ring-[#0053a0]/20"
                />
              </label>

              <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
                Führerscheinklasse
                <input
                  type="text"
                  value={editFormData.fuehrerscheinklasse}
                  onChange={(event) => setEditFormData((p) => ({ ...p, fuehrerscheinklasse: event.target.value }))}
                  className="rounded-xl border border-slate-300 px-3 py-2 text-slate-800 outline-none transition focus:border-[#0053a0] focus:ring-2 focus:ring-[#0053a0]/20"
                  required
                />
              </label>

              <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
                Letzte G25-Untersuchung
                <input
                  type="date"
                  value={editFormData.letzteG25}
                  onChange={(event) => setEditFormData((p) => ({ ...p, letzteG25: event.target.value }))}
                  className="rounded-xl border border-slate-300 px-3 py-2 text-slate-800 outline-none transition focus:border-[#0053a0] focus:ring-2 focus:ring-[#0053a0]/20"
                  required
                />
              </label>

              <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
                Nächste G25-Untersuchung
                <input
                  type="date"
                  value={editFormData.naechsteG25}
                  onChange={(event) => setEditFormData((p) => ({ ...p, naechsteG25: event.target.value }))}
                  className="rounded-xl border border-slate-300 px-3 py-2 text-slate-800 outline-none transition focus:border-[#0053a0] focus:ring-2 focus:ring-[#0053a0]/20"
                />
              </label>

              <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={editFormData.aktiv}
                  onChange={(event) => setEditFormData((p) => ({ ...p, aktiv: event.target.checked }))}
                />
                Aktiv
              </label>

              <label className="flex flex-col gap-1 text-sm font-medium text-slate-700 sm:col-span-2">
                Bemerkung
                <textarea
                  value={editFormData.bemerkung}
                  onChange={(event) => setEditFormData((p) => ({ ...p, bemerkung: event.target.value }))}
                  className="min-h-24 rounded-xl border border-slate-300 px-3 py-2 text-slate-800 outline-none transition focus:border-[#0053a0] focus:ring-2 focus:ring-[#0053a0]/20"
                />
              </label>

              <div className="flex items-center justify-end gap-3 sm:col-span-2">
                <button
                  type="button"
                  onClick={handleCloseEditModal}
                  className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-[#0053a0] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#00488a]"
                >
                  Änderungen speichern
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

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
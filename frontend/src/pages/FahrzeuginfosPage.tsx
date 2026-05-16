import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Bus, Menu, Settings, UserRound, UserRoundPlus, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import {
  createFahrzeug,
  deleteFahrzeug,
  getFahrzeuge,
  updateFahrzeug,
} from '../services/fahrzeugApi'
import type {
  Fahrzeug,
  FahrzeugFieldConfig,
  FahrzeugFormData,
  FahrzeugFormMode,
} from '../types/Fahrzeug'

const vehicleFormFields: FahrzeugFieldConfig[] = [
  { name: 'id', label: 'Fahrzeug-ID', type: 'number' },
  { name: 'kennzeichen', label: 'Kennzeichen', type: 'text' },
  { name: 'bezeichnung', label: 'Bezeichnung', type: 'text' },
  { name: 'markeTyp', label: 'Marke/Typ', type: 'text' },
  { name: 'fahrzeugart', label: 'Fahrzeugart', type: 'text' },
  { name: 'kapazitaet', label: 'Kapazitaet', type: 'number' },
  { name: 'kilometerstand', label: 'Kilometerstand', type: 'number' },
  { name: 'betriebsaufnahme', label: 'Betriebsaufnahme', type: 'date' },
  { name: 'letzteWartung', label: 'Letzte Wartung', type: 'date' },
  { name: 'naechsteWartung', label: 'Naechste Wartung', type: 'date' },
  { name: 'schaeden', label: 'Schaeden', type: 'text' },
  { name: 'reparaturtermin', label: 'Reparaturtermin', type: 'date' },
  {
    name: 'aktiv',
    label: 'Aktiv',
    type: 'select',
    options: [
      { label: 'Ja', value: 'true' },
      { label: 'Nein', value: 'false' },
    ],
  },
  { name: 'status', label: 'Status', type: 'text' },
  { name: 'initiativeId', label: 'Initiative-ID', type: 'number' },
  { name: 'bemerkung', label: 'Bemerkung', type: 'textarea' },
]

function createEmptyVehicleForm(): FahrzeugFormData {
  return {
    id: '',
    kennzeichen: '',
    bezeichnung: '',
    markeTyp: '',
    fahrzeugart: '',
    kapazitaet: '',
    kilometerstand: '',
    betriebsaufnahme: '',
    bemerkung: '',
    status: '',
    aktiv: 'true',
    initiativeId: '1',
    letzteWartung: '',
    naechsteWartung: '',
    schaeden: '',
    reparaturtermin: '',
  }
}

function toVehicleFormData(vehicle: Fahrzeug): FahrzeugFormData {
  return {
    id: String(vehicle.id),
    kennzeichen: vehicle.kennzeichen,
    bezeichnung: vehicle.bezeichnung,
    markeTyp: vehicle.markeTyp,
    fahrzeugart: vehicle.fahrzeugart,
    kapazitaet: String(vehicle.kapazitaet),
    kilometerstand: String(vehicle.kilometerstand),
    betriebsaufnahme: vehicle.betriebsaufnahme,
    bemerkung: vehicle.bemerkung ?? '',
    status: vehicle.status,
    aktiv: vehicle.aktiv ? 'true' : 'false',
    initiativeId: String(vehicle.initiativeId),
    letzteWartung: vehicle.letzteWartung ?? '',
    naechsteWartung: vehicle.naechsteWartung ?? '',
    schaeden: vehicle.schaeden ?? '',
    reparaturtermin: vehicle.reparaturtermin ?? '',
  }
}

function toVehicleModel(formData: FahrzeugFormData): Fahrzeug {
  return {
    id: Number(formData.id),
    kennzeichen: formData.kennzeichen.trim(),
    bezeichnung: formData.bezeichnung.trim(),
    markeTyp: formData.markeTyp.trim(),
    fahrzeugart: formData.fahrzeugart.trim(),
    kapazitaet: Number(formData.kapazitaet),
    kilometerstand: Number(formData.kilometerstand),
    betriebsaufnahme: formData.betriebsaufnahme,
    bemerkung: formData.bemerkung.trim() ? formData.bemerkung.trim() : null,
    status: formData.status.trim(),
    aktiv: formData.aktiv === 'true',
    initiativeId: Number(formData.initiativeId),
    letzteWartung: formData.letzteWartung || null,
    naechsteWartung: formData.naechsteWartung || null,
    schaeden: formData.schaeden.trim() ? formData.schaeden.trim() : null,
    reparaturtermin: formData.reparaturtermin || null,
  }
}

function formatDisplayDate(value: string) {
  if (!value) {
    return '-'
  }

  const parsedDate = new Date(value)
  if (Number.isNaN(parsedDate.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('de-DE').format(parsedDate)
}

function FahrzeuginfosPage() {
  const navigate = useNavigate()
  const [isSideMenuOpen, setIsSideMenuOpen] = useState(false)
  const [vehicles, setVehicles] = useState<Fahrzeug[]>([])
  const [selectedVehicleId, setSelectedVehicleId] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<FahrzeugFormMode>('create')
  const [formData, setFormData] = useState<FahrzeugFormData>(createEmptyVehicleForm())
  const [formError, setFormError] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const selectedVehicle = vehicles.find((vehicle) => vehicle.id === selectedVehicleId) ?? null

  useEffect(() => {
    let isActive = true

    async function loadVehicles() {
      setIsLoading(true)
      setLoadError('')

      try {
        const loadedVehicles = await getFahrzeuge()
        if (isActive) {
          setVehicles(loadedVehicles)
        }
      } catch {
        if (isActive) {
          setLoadError('Fahrzeugdaten konnten nicht geladen werden.')
        }
      } finally {
        if (isActive) {
          setIsLoading(false)
        }
      }
    }

    void loadVehicles()

    return () => {
      isActive = false
    }
  }, [])

  function closeSideMenu() {
    setIsSideMenuOpen(false)
  }

  function goToPage(path: string) {
    closeSideMenu()
    navigate(path)
  }

  function handleVehicleSelection(vehicleId: number, isChecked: boolean) {
    setSelectedVehicleId(isChecked ? vehicleId : null)
  }

  function openCreateVehicleModal() {
    setModalMode('create')
    setFormData(createEmptyVehicleForm())
    setFormError('')
    setIsModalOpen(true)
  }

  function openEditVehicleModal() {
    if (!selectedVehicle) {
      alert('Bitte waehlen Sie ein Fahrzeug aus, um die Daten zu bearbeiten.')
      return
    }

    setModalMode('edit')
    setFormData(toVehicleFormData(selectedVehicle))
    setFormError('')
    setIsModalOpen(true)
  }

  function closeModal() {
    setIsModalOpen(false)
    setFormError('')
  }

  function handleFieldChange(fieldName: keyof FahrzeugFormData, value: string) {
    setFormData((previous) => ({
      ...previous,
      [fieldName]: value,
    }))
  }

  function validateVehicleForm(data: FahrzeugFormData, mode: FahrzeugFormMode) {
    const vehicleId = Number(data.id)
    const kapazitaet = Number(data.kapazitaet)
    const kilometerstand = Number(data.kilometerstand)
    const initiativeId = Number(data.initiativeId)

    if (!Number.isInteger(vehicleId) || vehicleId <= 0) {
      return 'Bitte eine gueltige Fahrzeug-ID eingeben.'
    }

    if (mode === 'create' && vehicles.some((vehicle) => vehicle.id === vehicleId)) {
      return 'Diese Fahrzeug-ID existiert bereits.'
    }

    if (!data.kennzeichen.trim()) {
      return 'Kennzeichen ist erforderlich.'
    }

    if (!data.bezeichnung.trim()) {
      return 'Bezeichnung ist erforderlich.'
    }

    if (!Number.isFinite(kapazitaet) || kapazitaet <= 0) {
      return 'Kapazitaet muss groesser als 0 sein.'
    }

    if (!Number.isFinite(kilometerstand) || kilometerstand < 0) {
      return 'Kilometerstand darf nicht negativ sein.'
    }

    if (!data.betriebsaufnahme) {
      return 'Betriebsaufnahme ist erforderlich.'
    }

    if (!data.status.trim()) {
      return 'Status ist erforderlich.'
    }

    if (!Number.isInteger(initiativeId) || initiativeId <= 0) {
      return 'Bitte eine gueltige Initiative-ID eingeben.'
    }

    return ''
  }

  async function handleSaveVehicle(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError('')

    const validationError = validateVehicleForm(formData, modalMode)
    if (validationError) {
      setFormError(validationError)
      return
    }

    const model = toVehicleModel(formData)
    setIsSaving(true)

    try {
      if (modalMode === 'create') {
        const createdVehicle = await createFahrzeug(model)
        setVehicles((previousVehicles) => [...previousVehicles, createdVehicle])
        setSelectedVehicleId(createdVehicle.id)
      } else if (selectedVehicle) {
        const updatedVehicle = await updateFahrzeug(selectedVehicle.id, model)
        setVehicles((previousVehicles) =>
          previousVehicles.map((vehicle) =>
            vehicle.id === selectedVehicle.id ? updatedVehicle : vehicle,
          ),
        )
        setSelectedVehicleId(updatedVehicle.id)
      }

      closeModal()
    } catch {
      setFormError('Das Fahrzeug konnte nicht gespeichert werden.')
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDeleteVehicle() {
    if (!selectedVehicle) {
      alert('Bitte waehlen Sie ein Fahrzeug aus, um es zu loeschen.')
      return
    }

    const shouldDelete = window.confirm(
      `Sind Sie sicher, dass Sie das Fahrzeug ${selectedVehicle.id} loeschen moechten?`,
    )

    if (!shouldDelete) {
      return
    }

    try {
      await deleteFahrzeug(selectedVehicle.id)
      setVehicles((previousVehicles) =>
        previousVehicles.filter((vehicle) => vehicle.id !== selectedVehicle.id),
      )
      setSelectedVehicleId(null)
    } catch {
      alert('Das Fahrzeug konnte nicht geloescht werden.')
    }
  }

  function renderVehicleFields(mode: FahrzeugFormMode) {
    return vehicleFormFields.map((field) => {
      const fieldValue = formData[field.name]
      const isTextarea = field.type === 'textarea'
      const isSelect = field.type === 'select'
      const fieldSpan = isTextarea ? 'col-span-1 sm:col-span-2 md:col-span-3' : ''
      const isIdField = field.name === 'id'

      return (
        <div key={field.name} className={fieldSpan}>
          <label className="block text-sm font-medium text-slate-700">{field.label}</label>

          {isTextarea ? (
            <textarea
              value={fieldValue}
              onChange={(event) => handleFieldChange(field.name, event.target.value)}
              rows={4}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          ) : isSelect ? (
            <select
              value={fieldValue}
              onChange={(event) => handleFieldChange(field.name, event.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
            >
              {field.options?.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          ) : (
            <input
              type={field.type}
              value={fieldValue}
              onChange={(event) => handleFieldChange(field.name, event.target.value)}
              disabled={mode === 'edit' && isIdField}
              className={`mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm ${
                mode === 'edit' && isIdField ? 'bg-slate-50 text-slate-500' : 'bg-white'
              }`}
            />
          )}
        </div>
      )
    })
  }

  function renderVehicleModal(mode: FahrzeugFormMode, title: string, submitLabel: string) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
        onClick={closeModal}
      >
        <div
          className="w-full max-w-2xl rounded-lg bg-white p-6 shadow-lg"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="flex items-center justify-between border-b pb-4">
            <h2 className="text-xl font-bold text-slate-800">{title}</h2>
            <button
              type="button"
              onClick={closeModal}
              className="text-slate-500 hover:text-slate-700"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form
            onSubmit={handleSaveVehicle}
            className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3"
          >
            {renderVehicleFields(mode)}

            {formError ? (
              <p className="col-span-1 text-sm text-red-600 sm:col-span-2 md:col-span-3">
                {formError}
              </p>
            ) : null}

            <div className="col-span-1 mt-2 flex justify-end gap-2 sm:col-span-2 md:col-span-3">
              <button
                type="button"
                onClick={closeModal}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
              >
                Abbrechen
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className={`rounded-lg px-4 py-2 text-sm font-semibold text-white ${
                  isSaving ? 'cursor-not-allowed bg-blue-400' : 'bg-blue-500 hover:bg-blue-600'
                }`}
              >
                {isSaving ? 'Speichern...' : submitLabel}
              </button>
            </div>
          </form>
        </div>
      </div>
    )
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

            <h1 className="text-2xl font-bold text-slate-800">Fahrzeugverwaltung</h1>
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
          {loadError ? (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {loadError}
            </div>
          ) : null}

          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="flex items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-12 text-sm text-slate-500">
                Fahrzeugdaten werden geladen...
              </div>
            ) : vehicles.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-12 text-center text-sm text-slate-500">
                Noch keine Fahrzeuge vorhanden.
              </div>
            ) : (
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">Auswahl</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">Fahrzeug-ID</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">Kennzeichen</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">Bezeichnung</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">Marke/Typ</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">Fahrzeugart</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">Kapazitaet</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">Kilometerstand</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">Betriebsaufnahme</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">Letzte Wartung</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">Naechste Wartung</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">Schaeden</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">Reparaturtermin</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">Status</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">Aktiv</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">Initiative-ID</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">Bemerkung</th>
                  </tr>
                </thead>
                <tbody>
                  {vehicles.map((vehicle) => (
                    <tr
                      key={vehicle.id}
                      className={`border-b border-slate-100 transition hover:bg-slate-50 ${
                        selectedVehicleId === vehicle.id ? 'bg-[#0053a0]/5' : ''
                      }`}
                    >
                      <td className="px-4 py-3 text-slate-700">
                        <input
                          type="checkbox"
                          checked={selectedVehicleId === vehicle.id}
                          onChange={(event) =>
                            handleVehicleSelection(vehicle.id, event.target.checked)
                          }
                        />
                      </td>
                      <td className="px-4 py-3 text-slate-700 truncate">{vehicle.id}</td>
                      <td className="px-4 py-3 text-slate-700 truncate">{vehicle.kennzeichen}</td>
                      <td className="px-4 py-3 text-slate-700 truncate">{vehicle.bezeichnung}</td>
                      <td className="px-4 py-3 text-slate-700 truncate">{vehicle.markeTyp}</td>
                      <td className="px-4 py-3 text-slate-700 truncate">{vehicle.fahrzeugart}</td>
                      <td className="px-4 py-3 text-slate-700 truncate">{vehicle.kapazitaet}</td>
                      <td className="px-4 py-3 text-slate-700 truncate">{vehicle.kilometerstand}</td>
                      <td className="px-4 py-3 text-slate-700 truncate">
                        {formatDisplayDate(vehicle.betriebsaufnahme)}
                      </td>
                      <td className="px-4 py-3 text-slate-700 truncate">
                        {formatDisplayDate(vehicle.letzteWartung ?? '')}
                      </td>
                      <td className="px-4 py-3 text-slate-700 truncate">
                        {formatDisplayDate(vehicle.naechsteWartung ?? '')}
                      </td>
                      <td className="px-4 py-3 text-slate-700 truncate">{vehicle.schaeden ?? '-'}</td>
                      <td className="px-4 py-3 text-slate-700 truncate">
                        {formatDisplayDate(vehicle.reparaturtermin ?? '')}
                      </td>
                      <td className="px-4 py-3 text-slate-700 truncate">{vehicle.status}</td>
                      <td className="px-4 py-3 text-slate-700 truncate">
                        {vehicle.aktiv ? 'Ja' : 'Nein'}
                      </td>
                      <td className="px-4 py-3 text-slate-700 truncate">{vehicle.initiativeId}</td>
                      <td className="px-4 py-3 text-slate-700 truncate">{vehicle.bemerkung ?? '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="mt-4 flex w-full justify-end gap-2">
            <button
              type="button"
              onClick={openCreateVehicleModal}
              className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600"
            >
              Fahrzeug erstellen
            </button>
            <button
              type="button"
              onClick={openEditVehicleModal}
              disabled={!selectedVehicle}
              className={`rounded-lg px-4 py-2 text-sm font-semibold text-white ${
                selectedVehicle
                  ? 'bg-blue-500 hover:bg-blue-600'
                  : 'cursor-not-allowed bg-gray-300'
              }`}
            >
              Daten bearbeiten
            </button>
            <button
              type="button"
              onClick={handleDeleteVehicle}
              disabled={!selectedVehicle}
              className={`rounded-lg px-4 py-2 text-sm font-semibold text-white ${
                selectedVehicle ? 'bg-red-500 hover:bg-red-600' : 'cursor-not-allowed bg-red-300'
              }`}
            >
              Fahrzeug loeschen
            </button>
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
                className="flex w-full items-center gap-3 rounded-2xl bg-[#0053a0] px-4 py-3 text-left text-lg font-medium text-white"
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

      {isModalOpen && modalMode === 'create'
        ? renderVehicleModal('create', 'Fahrzeug erstellen', 'Fahrzeug erstellen')
        : null}

      {isModalOpen && modalMode === 'edit'
        ? renderVehicleModal('edit', 'Fahrzeugdaten bearbeiten', 'Aenderungen speichern')
        : null}
    </main>
  )
}

export default FahrzeuginfosPage

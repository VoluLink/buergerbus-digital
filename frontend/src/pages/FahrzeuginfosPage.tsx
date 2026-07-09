import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { Menu, Search, UserRound } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import {
  createFahrzeug,
  deleteFahrzeug,
  getFahrzeuge,
  updateFahrzeug,
} from '../services/fahrzeugApi'
import { fetchInitiatives } from '../services/users'
import {
  createSchaden,
  getSchaedenByFahrzeug,
  updateSchaden,
} from '../services/schadenApi'
import {
  createWartung,
  getWartungenByFahrzeug,
  updateWartung,
} from '../services/wartungApi'
import type {
  Fahrzeug,
  FahrzeugFieldConfig,
  FahrzeugFormData,
  FahrzeugFormMode,
} from '../types/Fahrzeug'
import type { Schaden, SchadenFormData } from '../types/Schaden'
import type { Wartung, WartungFormData } from '../types/Wartung'
import type { InitiativeSummary } from '../types/UserProfile'
import { useAuth } from '../context/AuthContext'
import UserMenuButton from '../components/UserMenuButton'
import ProtectedSideMenu from '../components/ProtectedSideMenu'
import { useRoleVisibility } from '../hooks/useRoleVisibility'
import VehicleFormDialog from '../features/vehicles/components/VehicleFormDialog'
import VehicleTable from '../features/vehicles/components/VehicleTable'
import type { FahrzeugTab } from '../features/vehicles/types'
import {
  createEmptySchadenForm,
  createEmptyVehicleForm,
  createEmptyWartungForm,
  toDateInputValue,
  toVehicleFormData,
} from '../features/vehicles/utils'

const vehicleFormFields: FahrzeugFieldConfig[] = [
  { name: 'kennzeichen', label: 'Kennzeichen', type: 'text' },
  { name: 'bezeichnung', label: 'Bezeichnung', type: 'text' },
  { name: 'initiativeId', label: 'Initiative', type: 'select' },
  { name: 'kapazitaet', label: 'Kapazität', type: 'number' },
  { name: 'kilometerstand', label: 'Kilometerstand', type: 'number' },
  { name: 'betriebsaufnahme', label: 'Betriebsaufnahme', type: 'date' },
  { name: 'status', label: 'Status', type: 'text' },
  { name: 'bemerkung', label: 'Bemerkung', type: 'textarea' },
]

const schadenStatusOptions = ['Offen', 'In Bearbeitung', 'Behoben', 'Nicht reparierbar']

function FahrzeuginfosPage() {
  const navigate = useNavigate()
  const { currentUser } = useAuth()
  const { canManageDataCrud } = useRoleVisibility()
  const isCrudRestricted = !canManageDataCrud
  const [isSideMenuOpen, setIsSideMenuOpen] = useState(false)
  const [vehicles, setVehicles] = useState<Fahrzeug[]>([])
  const [initiativen, setInitiativen] = useState<InitiativeSummary[]>([])
  const [selectedVehicleId, setSelectedVehicleId] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<FahrzeugFormMode>('create')
  const [formData, setFormData] = useState<FahrzeugFormData>(createEmptyVehicleForm())
  const [formError, setFormError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<FahrzeugTab>('stammdaten')
  const [wartungen, setWartungen] = useState<Wartung[]>([])
  const [schaeden, setSchaeden] = useState<Schaden[]>([])
  const [detailsLoading, setDetailsLoading] = useState(false)
  const [detailsError, setDetailsError] = useState('')
  const [wartungFormData, setWartungFormData] = useState<WartungFormData>(
    createEmptyWartungForm(),
  )
  const [schadenFormData, setSchadenFormData] = useState<SchadenFormData>(
    createEmptySchadenForm(),
  )
  const [wartungFormError, setWartungFormError] = useState('')
  const [schadenFormError, setSchadenFormError] = useState('')
  const [wartungSuccessMessage, setWartungSuccessMessage] = useState('')
  const [schadenSuccessMessage, setSchadenSuccessMessage] = useState('')
  const [isWartungSaving, setIsWartungSaving] = useState(false)
  const [isSchadenSaving, setIsSchadenSaving] = useState(false)
  const [editingWartungId, setEditingWartungId] = useState<number | null>(null)
  const [editingSchadenId, setEditingSchadenId] = useState<number | null>(null)

  const selectedVehicle = useMemo(
    () => vehicles.find((vehicle) => vehicle.id === selectedVehicleId) ?? null,
    [selectedVehicleId, vehicles],
  )

  useEffect(() => {
    let isActive = true

    setEditingWartungId(null)
    setEditingSchadenId(null)
    setWartungFormData(createEmptyWartungForm())
    setSchadenFormData(createEmptySchadenForm())
    setWartungFormError('')
    setSchadenFormError('')
    setWartungSuccessMessage('')
    setSchadenSuccessMessage('')

    async function loadVehicles() {
      setIsLoading(true)
      setLoadError('')

      try {
        const [loadedVehicles, loadedInitiativen] = await Promise.all([
          getFahrzeuge(),
          fetchInitiatives().catch(() => [] as InitiativeSummary[]),
        ])
        if (isActive) {
          setVehicles(loadedVehicles)
          setInitiativen(loadedInitiativen)
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
  }, [currentUser?.id])

  useEffect(() => {
    let isActive = true

    async function loadVehicleDetails(vehicleId: number, userId: number) {
      setDetailsLoading(true)
      setDetailsError('')

      try {
        const [loadedWartungen, loadedSchaeden] = await Promise.all([
          getWartungenByFahrzeug(vehicleId, userId),
          getSchaedenByFahrzeug(vehicleId, userId),
        ])

        if (isActive) {
          setWartungen(loadedWartungen)
          setSchaeden(loadedSchaeden)
        }
      } catch {
        if (isActive) {
          setDetailsError('Wartungen oder Schäden konnten nicht geladen werden.')
        }
      } finally {
        if (isActive) {
          setDetailsLoading(false)
        }
      }
    }

    if (!selectedVehicleId || !currentUser?.id) {
      setWartungen([])
      setSchaeden([])
      setDetailsError('')
      return () => {
        isActive = false
      }
    }

    void loadVehicleDetails(selectedVehicleId, currentUser.id)

    return () => {
      isActive = false
    }
  }, [currentUser?.id, selectedVehicleId])

  function closeSideMenu() {
    setIsSideMenuOpen(false)
  }


  function handleVehicleSelection(vehicleId: number, isChecked: boolean) {
    setSelectedVehicleId(isChecked ? vehicleId : null)
  }

  function openCreateVehicleModal() {
    if (isCrudRestricted) {
      return
    }

    const defaultInitiativeId = currentUser?.initiative?.id ?? initiativen[0]?.id ?? null
    setModalMode('create')
    setFormData({
      ...createEmptyVehicleForm(),
      initiativeId: defaultInitiativeId ? String(defaultInitiativeId) : '',
    })
    setFormError('')
    setSuccessMessage('')
    setActiveTab('stammdaten')
    setWartungFormData(createEmptyWartungForm())
    setSchadenFormData(createEmptySchadenForm())
    setIsModalOpen(true)
  }

  function openEditVehicleModal() {
    if (isCrudRestricted) {
      return
    }

    if (!selectedVehicle) {
      alert('Bitte wählen Sie ein Fahrzeug aus, um die Daten zu bearbeiten.')
      return
    }

    setModalMode('edit')
    setFormData(toVehicleFormData(selectedVehicle))
    setFormError('')
    setSuccessMessage('')
    setActiveTab('stammdaten')
    setWartungFormData(createEmptyWartungForm())
    setSchadenFormData(createEmptySchadenForm())
    setWartungFormError('')
    setSchadenFormError('')
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

  function validateVehicleForm(data: FahrzeugFormData) {
    const kapazitaet = Number(data.kapazitaet)
    const kilometerstand = Number(data.kilometerstand)
    const initiativeId = Number(data.initiativeId)

    if (!data.kennzeichen.trim()) {
      return 'Kennzeichen ist erforderlich.'
    }

    if (!data.bezeichnung.trim()) {
      return 'Bezeichnung ist erforderlich.'
    }

    if (!Number.isFinite(kapazitaet) || kapazitaet < 1 || kapazitaet > 8) {
      return 'Kapazität muss zwischen 1 und 8 liegen.'
    }

    if (!Number.isFinite(kilometerstand) || kilometerstand < 0) {
      return 'Kilometerstand darf nicht negativ sein.'
    }

    if (!data.betriebsaufnahme) {
      return 'Betriebsaufnahme ist erforderlich.'
    }

    if (!Number.isFinite(initiativeId) || initiativeId <= 0) {
      return 'Initiative ist erforderlich.'
    }

    return ''
  }

  async function handleSaveVehicle(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (isCrudRestricted) {
      return
    }

    setFormError('')
    setSuccessMessage('')

    const validationError = validateVehicleForm(formData)
    if (validationError) {
      setFormError(validationError)
      return
    }

    const request = {
      kennzeichen: formData.kennzeichen.trim(),
      bezeichnung: formData.bezeichnung.trim(),
      kapazitaet: Number(formData.kapazitaet),
      kilometerstand: Number(formData.kilometerstand),
      betriebsaufnahme: formData.betriebsaufnahme,
      initiativeId: Number(formData.initiativeId),
      bemerkung: formData.bemerkung.trim() ? formData.bemerkung.trim() : null,
      status: formData.status.trim() ? formData.status.trim() : null,
    }

    setIsSaving(true)

    try {
      if (modalMode === 'create') {
        const createdVehicle = await createFahrzeug(currentUser?.id, request)
        const refreshedVehicles = await getFahrzeuge()
        setVehicles(refreshedVehicles)
        setSelectedVehicleId(createdVehicle.id)
        setSuccessMessage('Fahrzeug wurde erfolgreich angelegt.')
      } else if (selectedVehicle) {
        const updatedVehicle = await updateFahrzeug(selectedVehicle.id, currentUser?.id, request)
        const refreshedVehicles = await getFahrzeuge()
        setVehicles(refreshedVehicles)
        setSelectedVehicleId(updatedVehicle.id)
        setSuccessMessage('Fahrzeug wurde erfolgreich gespeichert.')
      }

      closeModal()
    } catch {
      setFormError('Das Fahrzeug konnte nicht gespeichert werden.')
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDeleteVehicle() {
    if (isCrudRestricted) {
      return
    }

    if (!selectedVehicle) {
      alert('Bitte wählen Sie ein Fahrzeug aus, um es zu löschen.')
      return
    }

    if (!currentUser?.id) {
      alert('Benutzerkontext fehlt.')
      return
    }

    const shouldDelete = window.confirm(
      `Sind Sie sicher, dass Sie das Fahrzeug ${selectedVehicle.id} löschen möchten?`,
    )

    if (!shouldDelete) {
      return
    }

    try {
      await deleteFahrzeug(selectedVehicle.id, currentUser.id)
      const refreshedVehicles = await getFahrzeuge()
      setVehicles(refreshedVehicles)
      setSelectedVehicleId(null)
      setSuccessMessage('Fahrzeug wurde gelöscht.')
    } catch {
      alert('Das Fahrzeug konnte nicht gelöscht werden.')
    }
  }

  function handleWartungFieldChange(fieldName: keyof WartungFormData, value: string) {
    setWartungFormData((previous) => ({
      ...previous,
      [fieldName]: value,
    }))
  }

  function handleSchadenFieldChange(fieldName: keyof SchadenFormData, value: string) {
    setSchadenFormData((previous) => ({
      ...previous,
      [fieldName]: value,
    }))
  }

  function startEditWartung(wartung: Wartung) {
    if (isCrudRestricted) {
      return
    }

    setEditingWartungId(wartung.id)
    setWartungFormError('')
    setWartungSuccessMessage('')
    setWartungFormData({
      letzterTermin: toDateInputValue(wartung.letzterTermin),
      naechsterTermin: toDateInputValue(wartung.naechsterTermin),
      grund: wartung.grund ?? '',
      ort: wartung.ort,
      kosten: wartung.kosten === null ? '' : String(wartung.kosten),
    })
  }

  function cancelEditWartung() {
    setEditingWartungId(null)
    setWartungFormData(createEmptyWartungForm())
    setWartungFormError('')
  }

  function startEditSchaden(schaden: Schaden) {
    if (isCrudRestricted) {
      return
    }

    setEditingSchadenId(schaden.id)
    setSchadenFormError('')
    setSchadenSuccessMessage('')
    setSchadenFormData({
      beschreibung: schaden.beschreibung,
      entstandenAm: toDateInputValue(schaden.entstandenAm),
      behobenAm: toDateInputValue(schaden.behobenAm),
      status: schaden.status,
    })
  }

  function cancelEditSchaden() {
    setEditingSchadenId(null)
    setSchadenFormData(createEmptySchadenForm())
    setSchadenFormError('')
  }

  const sortedVehicles = useMemo(
    () => {
      const normalizedSearch = searchQuery.trim().toLowerCase()
      return vehicles
        .filter((vehicle) => {
          const haystack = `${vehicle.id} ${vehicle.kennzeichen} ${vehicle.bezeichnung} ${vehicle.initiativeName ?? ''} ${vehicle.status} ${vehicle.bemerkung ?? ''}`.toLowerCase()
          return haystack.includes(normalizedSearch)
        })
        .sort((a, b) => a.kennzeichen.localeCompare(b.kennzeichen, 'de'))
    },
    [searchQuery, vehicles],
  )
  const sortedSchaeden = useMemo(
    () =>
      [...schaeden].sort((first, second) => {
        const firstDate = new Date(first.entstandenAm)
        const secondDate = new Date(second.entstandenAm)
        const firstValue = Number.isNaN(firstDate.getTime()) ? 0 : firstDate.getTime()
        const secondValue = Number.isNaN(secondDate.getTime()) ? 0 : secondDate.getTime()

        return secondValue - firstValue
      }),
    [schaeden],
  )

  async function handleSaveWartung(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (isCrudRestricted) {
      return
    }

    setWartungFormError('')
    setWartungSuccessMessage('')

    if (!selectedVehicle || !currentUser?.id) {
      setWartungFormError('Kein Fahrzeug oder Benutzerkontext verfügbar.')
      return
    }

    if (!wartungFormData.letzterTermin) {
      setWartungFormError('Letzter Termin ist erforderlich.')
      return
    }

    if (!wartungFormData.ort.trim()) {
      setWartungFormError('Ort ist erforderlich.')
      return
    }

    const kostenValue = wartungFormData.kosten.trim()
    const kosten = kostenValue ? Number(kostenValue) : null
    if (kostenValue && Number.isNaN(kosten)) {
      setWartungFormError('Kosten müssen eine Zahl sein.')
      return
    }

    setIsWartungSaving(true)

    try {
      const request = {
        letzterTermin: wartungFormData.letzterTermin,
        naechsterTermin: wartungFormData.naechsterTermin || null,
        grund: wartungFormData.grund.trim() ? wartungFormData.grund.trim() : null,
        ort: wartungFormData.ort.trim(),
        kosten,
      }

      if (editingWartungId) {
        const updatedWartung = await updateWartung(editingWartungId, currentUser.id, request)
        setWartungen((previous) =>
          previous.map((item) => (item.id === updatedWartung.id ? updatedWartung : item)),
        )
        setWartungSuccessMessage('Wartung wurde erfolgreich aktualisiert.')
      } else {
        const newWartung = await createWartung(selectedVehicle.id, currentUser.id, request)
        setWartungen((previous) => [newWartung, ...previous])
        setWartungSuccessMessage('Wartung wurde erfolgreich angelegt.')
      }

      setEditingWartungId(null)
      setWartungFormData(createEmptyWartungForm())
    } catch {
      setWartungFormError('Wartung konnte nicht gespeichert werden.')
    } finally {
      setIsWartungSaving(false)
    }
  }

  async function handleSaveSchaden(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (isCrudRestricted) {
      return
    }

    setSchadenFormError('')
    setSchadenSuccessMessage('')

    if (!selectedVehicle || !currentUser?.id) {
      setSchadenFormError('Kein Fahrzeug oder Benutzerkontext verfügbar.')
      return
    }

    if (!schadenFormData.beschreibung.trim()) {
      setSchadenFormError('Beschreibung ist erforderlich.')
      return
    }

    if (!schadenFormData.entstandenAm) {
      setSchadenFormError('Entstanden am ist erforderlich.')
      return
    }

    if (!schadenFormData.status) {
      setSchadenFormError('Status ist erforderlich.')
      return
    }

    setIsSchadenSaving(true)

    try {
      const request = {
        beschreibung: schadenFormData.beschreibung.trim(),
        entstandenAm: schadenFormData.entstandenAm,
        behobenAm: schadenFormData.behobenAm || null,
        status: schadenFormData.status,
      }

      if (editingSchadenId) {
        const updatedSchaden = await updateSchaden(editingSchadenId, currentUser.id, request)
        setSchaeden((previous) =>
          previous.map((item) => (item.id === updatedSchaden.id ? updatedSchaden : item)),
        )
        setSchadenSuccessMessage('Schaden wurde erfolgreich aktualisiert.')
      } else {
        const newSchaden = await createSchaden(selectedVehicle.id, currentUser.id, request)
        setSchaeden((previous) => [newSchaden, ...previous])
        setSchadenSuccessMessage('Schaden wurde erfolgreich angelegt.')
      }

      setEditingSchadenId(null)
      setSchadenFormData(createEmptySchadenForm())
    } catch {
      setSchadenFormError('Schaden konnte nicht gespeichert werden.')
    } finally {
      setIsSchadenSaving(false)
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

            <h1 className="text-2xl font-bold text-slate-800">Fahrzeugverwaltung</h1>
          </div>

          <UserMenuButton
            onClick={() => navigate('/profil')}
            icon={<UserRound className="h-6 w-6" aria-hidden="true" />}
          />
        </div>
      </header>

      <div className="p-2 sm:p-3 lg:p-4">
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="mb-4">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Suche nach Kennzeichen, Bezeichnung, Initiative ..."
                className="w-full rounded-xl border border-slate-300 py-2 pl-9 pr-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#0053a0] focus:ring-2 focus:ring-[#0053a0]/15"
              />
            </div>
          </div>

          {loadError ? (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {loadError}
            </div>
          ) : null}

          {successMessage ? (
            <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {successMessage}
            </div>
          ) : null}

          <div className="md:overflow-x-auto">
            <VehicleTable
              isLoading={isLoading}
              vehicles={sortedVehicles}
              searchQuery={searchQuery}
              selectedVehicleId={selectedVehicleId}
              onVehicleSelection={handleVehicleSelection}
            />
          </div>
          {!isCrudRestricted ? (
            <div className="mt-4 grid w-full grid-cols-1 gap-2 sm:grid-cols-3 md:flex md:justify-end">
              <button
                type="button"
                onClick={openCreateVehicleModal}
                className="min-h-11 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600"
              >
                Fahrzeug hinzufügen
              </button>
              <button
                type="button"
                onClick={openEditVehicleModal}
                disabled={!selectedVehicle}
                className={`min-h-11 rounded-lg px-4 py-2 text-sm font-semibold text-white ${
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
                className={`min-h-11 rounded-lg px-4 py-2 text-sm font-semibold text-white ${
                  selectedVehicle ? 'bg-red-500 hover:bg-red-600' : 'cursor-not-allowed bg-red-300'
                }`}
              >
                Fahrzeug löschen
              </button>
            </div>
          ) : null}
        </section>
      </div>

      <ProtectedSideMenu isOpen={isSideMenuOpen} onClose={closeSideMenu} />

      {isModalOpen ? (
        <VehicleFormDialog
          activeTab={activeTab}
          detailsError={detailsError}
          detailsLoading={detailsLoading}
          editingSchadenId={editingSchadenId}
          editingWartungId={editingWartungId}
          formData={formData}
          formError={formError}
          initativen={initiativen}
          isCrudRestricted={isCrudRestricted}
          isSaving={isSaving}
          isSchadenSaving={isSchadenSaving}
          isWartungSaving={isWartungSaving}
          mode={modalMode}
          schadenFormData={schadenFormData}
          schadenFormError={schadenFormError}
          schaeden={sortedSchaeden}
          schadenStatusOptions={schadenStatusOptions}
          schadenSuccessMessage={schadenSuccessMessage}
          submitLabel={modalMode === 'create' ? 'Fahrzeug hinzufügen' : 'Änderungen speichern'}
          title={modalMode === 'create' ? 'Fahrzeug hinzufügen' : 'Fahrzeugdaten bearbeiten'}
          vehicleFormFields={vehicleFormFields}
          wartungFormData={wartungFormData}
          wartungFormError={wartungFormError}
          wartungen={wartungen}
          wartungSuccessMessage={wartungSuccessMessage}
          onCancelEditSchaden={cancelEditSchaden}
          onCancelEditWartung={cancelEditWartung}
          onClose={closeModal}
          onFieldChange={handleFieldChange}
          onSaveSchaden={handleSaveSchaden}
          onSaveVehicle={handleSaveVehicle}
          onSaveWartung={handleSaveWartung}
          onSchadenFieldChange={handleSchadenFieldChange}
          onSetActiveTab={setActiveTab}
          onStartEditSchaden={startEditSchaden}
          onStartEditWartung={startEditWartung}
          onWartungFieldChange={handleWartungFieldChange}
        />
      ) : null}
    </main>
  )
}

export default FahrzeuginfosPage

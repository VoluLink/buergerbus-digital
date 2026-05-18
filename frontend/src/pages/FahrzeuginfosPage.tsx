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
import { useAuth } from '../context/AuthContext'
import UserMenuButton from '../components/UserMenuButton'

const vehicleFormFields: FahrzeugFieldConfig[] = [
  { name: 'kennzeichen', label: 'Kennzeichen', type: 'text' },
  { name: 'bezeichnung', label: 'Bezeichnung', type: 'text' },
  { name: 'kapazitaet', label: 'Kapazitaet', type: 'number' },
  { name: 'kilometerstand', label: 'Kilometerstand', type: 'number' },
  { name: 'betriebsaufnahme', label: 'Betriebsaufnahme', type: 'date' },
  { name: 'status', label: 'Status', type: 'text' },
  { name: 'bemerkung', label: 'Bemerkung', type: 'textarea' },
]

function createEmptyVehicleForm(): FahrzeugFormData {
  return {
    kennzeichen: '',
    bezeichnung: '',
    kapazitaet: '',
    kilometerstand: '',
    betriebsaufnahme: '',
    bemerkung: '',
    status: '',
  }
}

function toVehicleFormData(vehicle: Fahrzeug): FahrzeugFormData {
  return {
    kennzeichen: vehicle.kennzeichen,
    bezeichnung: vehicle.bezeichnung,
    kapazitaet: String(vehicle.kapazitaet),
    kilometerstand: String(vehicle.kilometerstand),
    betriebsaufnahme: vehicle.betriebsaufnahme,
    bemerkung: vehicle.bemerkung ?? '',
    status: vehicle.status,
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

type FahrzeugTab = 'stammdaten' | 'wartungen' | 'schaeden'

const schadenStatusOptions = ['Offen', 'In Bearbeitung', 'Behoben', 'Nicht reparierbar']
const entriesPerPage = 10

function createEmptyWartungForm(): WartungFormData {
  return {
    letzterTermin: '',
    naechsterTermin: '',
    grund: '',
    ort: '',
    kosten: '',
  }
}

function createEmptySchadenForm(): SchadenFormData {
  return {
    beschreibung: '',
    entstandenAm: '',
    behobenAm: '',
    status: 'Offen',
  }
}

function parseDateValue(value: string | null | undefined): Date | null {
  if (!value) {
    return null
  }

  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

function FahrzeuginfosPage() {
  const navigate = useNavigate()
  const { currentUser } = useAuth()
  const [isSideMenuOpen, setIsSideMenuOpen] = useState(false)
  const [vehicles, setVehicles] = useState<Fahrzeug[]>([])
  const [selectedVehicleId, setSelectedVehicleId] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
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
  const [wartungPage, setWartungPage] = useState(1)
  const [schadenPage, setSchadenPage] = useState(1)
  const [editingWartungId, setEditingWartungId] = useState<number | null>(null)
  const [editingSchadenId, setEditingSchadenId] = useState<number | null>(null)

  const selectedVehicle = vehicles.find((vehicle) => vehicle.id === selectedVehicleId) ?? null

  useEffect(() => {
    let isActive = true

    setWartungPage(1)
    setSchadenPage(1)
    setEditingWartungId(null)
    setEditingSchadenId(null)
    setWartungFormData(createEmptyWartungForm())
    setSchadenFormData(createEmptySchadenForm())
    setWartungFormError('')
    setSchadenFormError('')
    setWartungSuccessMessage('')
    setSchadenSuccessMessage('')

    async function loadVehicles() {
      if (!currentUser?.id) {
        setVehicles([])
        setLoadError('Benutzerkontext fehlt.')
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      setLoadError('')

      try {
        const loadedVehicles = await getFahrzeuge(currentUser.id)
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
          setDetailsError('Wartungen oder Schaeden konnten nicht geladen werden.')
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
    setSuccessMessage('')
    setActiveTab('stammdaten')
    setWartungFormData(createEmptyWartungForm())
    setSchadenFormData(createEmptySchadenForm())
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

    return ''
  }

  async function handleSaveVehicle(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError('')
    setSuccessMessage('')

    if (!currentUser?.id) {
      setFormError('Benutzerkontext fehlt.')
      return
    }

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
      bemerkung: formData.bemerkung.trim() ? formData.bemerkung.trim() : null,
      status: formData.status.trim() ? formData.status.trim() : null,
    }

    setIsSaving(true)

    try {
      if (modalMode === 'create') {
        const createdVehicle = await createFahrzeug(currentUser.id, request)
        const refreshedVehicles = await getFahrzeuge(currentUser.id)
        setVehicles(refreshedVehicles)
        setSelectedVehicleId(createdVehicle.id)
        setSuccessMessage('Fahrzeug wurde erfolgreich angelegt.')
      } else if (selectedVehicle) {
        const updatedVehicle = await updateFahrzeug(selectedVehicle.id, currentUser.id, request)
        const refreshedVehicles = await getFahrzeuge(currentUser.id)
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
    if (!selectedVehicle) {
      alert('Bitte waehlen Sie ein Fahrzeug aus, um es zu loeschen.')
      return
    }

    if (!currentUser?.id) {
      alert('Benutzerkontext fehlt.')
      return
    }

    const shouldDelete = window.confirm(
      `Sind Sie sicher, dass Sie das Fahrzeug ${selectedVehicle.id} loeschen moechten?`,
    )

    if (!shouldDelete) {
      return
    }

    try {
      await deleteFahrzeug(selectedVehicle.id, currentUser.id)
      const refreshedVehicles = await getFahrzeuge(currentUser.id)
      setVehicles(refreshedVehicles)
      setSelectedVehicleId(null)
      setSuccessMessage('Fahrzeug wurde geloescht.')
    } catch {
      alert('Das Fahrzeug konnte nicht geloescht werden.')
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
    setEditingWartungId(wartung.id)
    setWartungFormError('')
    setWartungSuccessMessage('')
    setWartungFormData({
      letzterTermin: wartung.letzterTermin,
      naechsterTermin: wartung.naechsterTermin ?? '',
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
    setEditingSchadenId(schaden.id)
    setSchadenFormError('')
    setSchadenSuccessMessage('')
    setSchadenFormData({
      beschreibung: schaden.beschreibung,
      entstandenAm: schaden.entstandenAm,
      behobenAm: schaden.behobenAm ?? '',
      status: schaden.status,
    })
  }

  function cancelEditSchaden() {
    setEditingSchadenId(null)
    setSchadenFormData(createEmptySchadenForm())
    setSchadenFormError('')
  }

  function getLatestWartungDate(items: Wartung[]) {
    const sorted = [...items]
      .map((item) => ({ ...item, parsed: parseDateValue(item.letzterTermin) }))
      .filter((item) => item.parsed)
      .sort((a, b) => (b.parsed as Date).getTime() - (a.parsed as Date).getTime())

    return sorted.length > 0 ? sorted[0].letzterTermin : null
  }

  function getNextWartungDate(items: Wartung[]) {
    const sorted = [...items]
      .map((item) => ({ ...item, parsed: parseDateValue(item.naechsterTermin) }))
      .filter((item) => item.parsed)
      .sort((a, b) => (a.parsed as Date).getTime() - (b.parsed as Date).getTime())

    return sorted.length > 0 ? sorted[0].naechsterTermin ?? null : null
  }

  const letzteWartung = getLatestWartungDate(wartungen)
  const naechsteWartung = getNextWartungDate(wartungen)
  const offeneSchaeden = schaeden.filter((item) => item.status !== 'Behoben').length
  const fahrzeugStatus = offeneSchaeden > 0 ? 'Defekt' : 'Einsatzbereit'

  const wartungTotalPages = Math.max(1, Math.ceil(wartungen.length / entriesPerPage))
  const schadenTotalPages = Math.max(1, Math.ceil(schaeden.length / entriesPerPage))
  const wartungPageStart = (wartungPage - 1) * entriesPerPage
  const schadenPageStart = (schadenPage - 1) * entriesPerPage
  const pagedWartungen = wartungen.slice(wartungPageStart, wartungPageStart + entriesPerPage)
  const pagedSchaeden = schaeden.slice(schadenPageStart, schadenPageStart + entriesPerPage)

  useEffect(() => {
    if (wartungPage > wartungTotalPages) {
      setWartungPage(wartungTotalPages)
    }
  }, [wartungPage, wartungTotalPages])

  useEffect(() => {
    if (schadenPage > schadenTotalPages) {
      setSchadenPage(schadenTotalPages)
    }
  }, [schadenPage, schadenTotalPages])

  async function handleSaveWartung(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setWartungFormError('')
    setWartungSuccessMessage('')

    if (!selectedVehicle || !currentUser?.id) {
      setWartungFormError('Kein Fahrzeug oder Benutzerkontext verfuegbar.')
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
      setWartungFormError('Kosten muessen eine Zahl sein.')
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
        setWartungPage(1)
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
    setSchadenFormError('')
    setSchadenSuccessMessage('')

    if (!selectedVehicle || !currentUser?.id) {
      setSchadenFormError('Kein Fahrzeug oder Benutzerkontext verfuegbar.')
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
        setSchadenPage(1)
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

  function renderVehicleFields() {
    return vehicleFormFields.map((field) => {
      const fieldValue = formData[field.name]
      const isTextarea = field.type === 'textarea'
      const isSelect = field.type === 'select'
      const fieldSpan = isTextarea ? 'col-span-1 sm:col-span-2 md:col-span-3' : ''

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
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
            />
          )}
        </div>
      )
    })
  }

  function renderVehicleModal(mode: FahrzeugFormMode, title: string, submitLabel: string) {
    const isCreateMode = mode === 'create'

    const renderTabButton = (tab: FahrzeugTab, label: string) => (
      <button
        type="button"
        onClick={() => {
          if (!isCreateMode || tab === 'stammdaten') {
            setActiveTab(tab)
          }
        }}
        className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
          activeTab === tab
            ? 'bg-[#0053a0] text-white'
            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
        } ${isCreateMode && tab !== 'stammdaten' ? 'cursor-not-allowed opacity-60' : ''}`}
        disabled={isCreateMode && tab !== 'stammdaten'}
      >
        {label}
      </button>
    )

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

          <div className="mt-4">
            <div className="flex flex-wrap gap-2 border-b pb-3">
              {renderTabButton('stammdaten', 'Stammdaten')}
              {renderTabButton('wartungen', 'Wartungen')}
              {renderTabButton('schaeden', 'Schaeden')}
            </div>

            <div className="mt-4">
              {activeTab === 'stammdaten' ? (
                <form
                  onSubmit={handleSaveVehicle}
                  className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3"
                >
                  {renderVehicleFields()}

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
                        isSaving
                          ? 'cursor-not-allowed bg-blue-400'
                          : 'bg-blue-500 hover:bg-blue-600'
                      }`}
                    >
                      {isSaving ? 'Speichern...' : submitLabel}
                    </button>
                  </div>
                </form>
              ) : null}

              {activeTab === 'wartungen' ? (
                <div className="space-y-4">
                  {isCreateMode ? (
                    <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                      Wartungen koennen erst nach dem Speichern des Fahrzeugs erfasst werden.
                    </div>
                  ) : (
                    <>
                      {detailsError ? (
                        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                          {detailsError}
                        </div>
                      ) : null}

                      {wartungSuccessMessage ? (
                        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                          {wartungSuccessMessage}
                        </div>
                      ) : null}

                      <div className="rounded-lg border border-slate-200">
                        {detailsLoading ? (
                          <div className="px-4 py-6 text-sm text-slate-500">
                            Wartungen werden geladen...
                          </div>
                        ) : wartungen.length === 0 ? (
                          <div className="px-4 py-6 text-sm text-slate-500">
                            Noch keine Wartungen vorhanden.
                          </div>
                        ) : (
                          <div className="max-h-64 overflow-x-auto overflow-y-auto">
                            <table className="w-full border-collapse text-sm">
                              <thead>
                                <tr className="border-b border-slate-200 bg-slate-50">
                                  <th className="px-4 py-2 text-left font-semibold text-slate-700">
                                    Letzter Termin
                                  </th>
                                  <th className="px-4 py-2 text-left font-semibold text-slate-700">
                                    Naechster Termin
                                  </th>
                                  <th className="px-4 py-2 text-left font-semibold text-slate-700">Grund</th>
                                  <th className="px-4 py-2 text-left font-semibold text-slate-700">Ort</th>
                                  <th className="px-4 py-2 text-left font-semibold text-slate-700">Kosten</th>
                                  <th className="px-4 py-2 text-left font-semibold text-slate-700">Aktion</th>
                                </tr>
                              </thead>
                              <tbody>
                                {pagedWartungen.map((wartung) => (
                                  <tr
                                    key={wartung.id}
                                    onClick={() => startEditWartung(wartung)}
                                    className={`cursor-pointer border-b border-slate-100 transition hover:bg-slate-50 ${
                                      editingWartungId === wartung.id ? 'bg-[#0053a0]/10' : ''
                                    }`}
                                  >
                                    <td className="px-4 py-2 text-slate-700">
                                      {formatDisplayDate(wartung.letzterTermin)}
                                    </td>
                                    <td className="px-4 py-2 text-slate-700">
                                      {formatDisplayDate(wartung.naechsterTermin ?? '')}
                                    </td>
                                    <td className="px-4 py-2 text-slate-700">
                                      {wartung.grund ?? '-'}
                                    </td>
                                    <td className="px-4 py-2 text-slate-700">{wartung.ort}</td>
                                    <td className="px-4 py-2 text-slate-700">
                                      {wartung.kosten === null
                                        ? '-'
                                        : new Intl.NumberFormat('de-DE', {
                                            style: 'currency',
                                            currency: 'EUR',
                                          }).format(wartung.kosten)}
                                    </td>
                                    <td className="px-4 py-2 text-slate-700">
                                      <button
                                        type="button"
                                        onClick={(event) => {
                                          event.stopPropagation()
                                          startEditWartung(wartung)
                                        }}
                                        className="text-sm font-semibold text-[#0053a0] hover:underline"
                                      >
                                        Bearbeiten
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>

                      {wartungen.length > entriesPerPage ? (
                        <div className="flex items-center justify-between text-sm text-slate-600">
                          <button
                            type="button"
                            onClick={() => setWartungPage((previous) => Math.max(1, previous - 1))}
                            disabled={wartungPage === 1}
                            className={`rounded-lg border border-slate-200 px-3 py-1.5 ${
                              wartungPage === 1
                                ? 'cursor-not-allowed text-slate-400'
                                : 'hover:bg-slate-100'
                            }`}
                          >
                            Zurueck
                          </button>
                          <span>
                            Seite {wartungPage} von {wartungTotalPages}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setWartungPage((previous) =>
                                Math.min(wartungTotalPages, previous + 1),
                              )
                            }
                            disabled={wartungPage === wartungTotalPages}
                            className={`rounded-lg border border-slate-200 px-3 py-1.5 ${
                              wartungPage === wartungTotalPages
                                ? 'cursor-not-allowed text-slate-400'
                                : 'hover:bg-slate-100'
                            }`}
                          >
                            Weiter
                          </button>
                        </div>
                      ) : null}

                      <form
                        onSubmit={handleSaveWartung}
                        className="grid grid-cols-1 gap-4 rounded-lg border border-slate-200 bg-slate-50 p-4 sm:grid-cols-2"
                      >
                        <div>
                          <label className="block text-sm font-medium text-slate-700">
                            Letzter Termin
                          </label>
                          <input
                            type="date"
                            value={wartungFormData.letzterTermin}
                            onChange={(event) =>
                              handleWartungFieldChange('letzterTermin', event.target.value)
                            }
                            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700">
                            Naechster Termin
                          </label>
                          <input
                            type="date"
                            value={wartungFormData.naechsterTermin}
                            onChange={(event) =>
                              handleWartungFieldChange('naechsterTermin', event.target.value)
                            }
                            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700">Grund</label>
                          <input
                            type="text"
                            value={wartungFormData.grund}
                            onChange={(event) => handleWartungFieldChange('grund', event.target.value)}
                            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700">Ort</label>
                          <input
                            type="text"
                            value={wartungFormData.ort}
                            onChange={(event) => handleWartungFieldChange('ort', event.target.value)}
                            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700">Kosten</label>
                          <input
                            type="number"
                            step="0.01"
                            value={wartungFormData.kosten}
                            onChange={(event) => handleWartungFieldChange('kosten', event.target.value)}
                            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                          />
                        </div>

                        {wartungFormError ? (
                          <p className="text-sm text-red-600 sm:col-span-2">{wartungFormError}</p>
                        ) : null}

                        <div className="flex flex-wrap justify-end gap-2 sm:col-span-2">
                          {editingWartungId ? (
                            <button
                              type="button"
                              onClick={cancelEditWartung}
                              className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
                            >
                              Neue Wartung
                            </button>
                          ) : null}
                          <button
                            type="submit"
                            disabled={isWartungSaving}
                            className={`rounded-lg px-4 py-2 text-sm font-semibold text-white ${
                              isWartungSaving
                                ? 'cursor-not-allowed bg-blue-400'
                                : 'bg-blue-500 hover:bg-blue-600'
                            }`}
                          >
                            {isWartungSaving
                              ? 'Speichern...'
                              : editingWartungId
                                ? 'Aenderungen speichern'
                                : 'Wartung hinzufuegen'}
                          </button>
                        </div>
                      </form>
                    </>
                  )}
                </div>
              ) : null}

              {activeTab === 'schaeden' ? (
                <div className="space-y-4">
                  {isCreateMode ? (
                    <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                      Schaeden koennen erst nach dem Speichern des Fahrzeugs erfasst werden.
                    </div>
                  ) : (
                    <>
                      {detailsError ? (
                        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                          {detailsError}
                        </div>
                      ) : null}

                      {schadenSuccessMessage ? (
                        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                          {schadenSuccessMessage}
                        </div>
                      ) : null}

                      <div className="rounded-lg border border-slate-200">
                        {detailsLoading ? (
                          <div className="px-4 py-6 text-sm text-slate-500">
                            Schaeden werden geladen...
                          </div>
                        ) : schaeden.length === 0 ? (
                          <div className="px-4 py-6 text-sm text-slate-500">
                            Noch keine Schaeden vorhanden.
                          </div>
                        ) : (
                          <div className="max-h-64 overflow-x-auto overflow-y-auto">
                            <table className="w-full border-collapse text-sm">
                              <thead>
                                <tr className="border-b border-slate-200 bg-slate-50">
                                  <th className="px-4 py-2 text-left font-semibold text-slate-700">
                                    Beschreibung
                                  </th>
                                  <th className="px-4 py-2 text-left font-semibold text-slate-700">
                                    Entstanden am
                                  </th>
                                  <th className="px-4 py-2 text-left font-semibold text-slate-700">
                                    Behoben am
                                  </th>
                                  <th className="px-4 py-2 text-left font-semibold text-slate-700">Status</th>
                                  <th className="px-4 py-2 text-left font-semibold text-slate-700">Aktion</th>
                                </tr>
                              </thead>
                              <tbody>
                                {pagedSchaeden.map((schaden) => (
                                  <tr
                                    key={schaden.id}
                                    onClick={() => startEditSchaden(schaden)}
                                    className={`cursor-pointer border-b border-slate-100 transition hover:bg-slate-50 ${
                                      editingSchadenId === schaden.id ? 'bg-[#0053a0]/10' : ''
                                    }`}
                                  >
                                    <td className="px-4 py-2 text-slate-700">
                                      {schaden.beschreibung}
                                    </td>
                                    <td className="px-4 py-2 text-slate-700">
                                      {formatDisplayDate(schaden.entstandenAm)}
                                    </td>
                                    <td className="px-4 py-2 text-slate-700">
                                      {formatDisplayDate(schaden.behobenAm ?? '')}
                                    </td>
                                    <td className="px-4 py-2 text-slate-700">{schaden.status}</td>
                                    <td className="px-4 py-2 text-slate-700">
                                      <button
                                        type="button"
                                        onClick={(event) => {
                                          event.stopPropagation()
                                          startEditSchaden(schaden)
                                        }}
                                        className="text-sm font-semibold text-[#0053a0] hover:underline"
                                      >
                                        Bearbeiten
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>

                      {schaeden.length > entriesPerPage ? (
                        <div className="flex items-center justify-between text-sm text-slate-600">
                          <button
                            type="button"
                            onClick={() => setSchadenPage((previous) => Math.max(1, previous - 1))}
                            disabled={schadenPage === 1}
                            className={`rounded-lg border border-slate-200 px-3 py-1.5 ${
                              schadenPage === 1
                                ? 'cursor-not-allowed text-slate-400'
                                : 'hover:bg-slate-100'
                            }`}
                          >
                            Zurueck
                          </button>
                          <span>
                            Seite {schadenPage} von {schadenTotalPages}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setSchadenPage((previous) =>
                                Math.min(schadenTotalPages, previous + 1),
                              )
                            }
                            disabled={schadenPage === schadenTotalPages}
                            className={`rounded-lg border border-slate-200 px-3 py-1.5 ${
                              schadenPage === schadenTotalPages
                                ? 'cursor-not-allowed text-slate-400'
                                : 'hover:bg-slate-100'
                            }`}
                          >
                            Weiter
                          </button>
                        </div>
                      ) : null}

                      <form
                        onSubmit={handleSaveSchaden}
                        className="grid grid-cols-1 gap-4 rounded-lg border border-slate-200 bg-slate-50 p-4 sm:grid-cols-2"
                      >
                        <div className="sm:col-span-2">
                          <label className="block text-sm font-medium text-slate-700">Beschreibung</label>
                          <textarea
                            value={schadenFormData.beschreibung}
                            onChange={(event) =>
                              handleSchadenFieldChange('beschreibung', event.target.value)
                            }
                            rows={3}
                            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700">Entstanden am</label>
                          <input
                            type="date"
                            value={schadenFormData.entstandenAm}
                            onChange={(event) =>
                              handleSchadenFieldChange('entstandenAm', event.target.value)
                            }
                            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700">Behoben am</label>
                          <input
                            type="date"
                            value={schadenFormData.behobenAm}
                            onChange={(event) =>
                              handleSchadenFieldChange('behobenAm', event.target.value)
                            }
                            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700">Status</label>
                          <select
                            value={schadenFormData.status}
                            onChange={(event) =>
                              handleSchadenFieldChange('status', event.target.value)
                            }
                            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                          >
                            {schadenStatusOptions.map((option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                        </div>

                        {schadenFormError ? (
                          <p className="text-sm text-red-600 sm:col-span-2">{schadenFormError}</p>
                        ) : null}

                        <div className="flex flex-wrap justify-end gap-2 sm:col-span-2">
                          {editingSchadenId ? (
                            <button
                              type="button"
                              onClick={cancelEditSchaden}
                              className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
                            >
                              Neuer Schaden
                            </button>
                          ) : null}
                          <button
                            type="submit"
                            disabled={isSchadenSaving}
                            className={`rounded-lg px-4 py-2 text-sm font-semibold text-white ${
                              isSchadenSaving
                                ? 'cursor-not-allowed bg-blue-400'
                                : 'bg-blue-500 hover:bg-blue-600'
                            }`}
                          >
                            {isSchadenSaving
                              ? 'Speichern...'
                              : editingSchadenId
                                ? 'Aenderungen speichern'
                                : 'Schaden hinzufuegen'}
                          </button>
                        </div>
                      </form>
                    </>
                  )}
                </div>
              ) : null}
            </div>
          </div>
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

          <UserMenuButton
            onClick={() => navigate('/profil')}
            icon={<UserRound className="h-6 w-6" aria-hidden="true" />}
          />
        </div>
      </header>

      <div className="p-2 sm:p-3 lg:p-4">
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
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
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">Letzte Wartung</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">Naechste Wartung</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">
                      Offene Schaeden
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">Fahrzeugstatus</th>
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
                      <td className="px-4 py-3 text-slate-700 truncate">
                        {selectedVehicleId === vehicle.id
                          ? formatDisplayDate(letzteWartung ?? '')
                          : '-'}
                      </td>
                      <td className="px-4 py-3 text-slate-700 truncate">
                        {selectedVehicleId === vehicle.id
                          ? formatDisplayDate(naechsteWartung ?? '')
                          : '-'}
                      </td>
                      <td className="px-4 py-3 text-slate-700 truncate">
                        {selectedVehicleId === vehicle.id ? offeneSchaeden : '-'}
                      </td>
                      <td className="px-4 py-3 text-slate-700 truncate">
                        {selectedVehicleId === vehicle.id ? fahrzeugStatus : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {selectedVehicle ? (
            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-slate-800">
                    Zusammenfassung fuer {selectedVehicle.kennzeichen}
                  </h3>
                  <p className="text-sm text-slate-600">
                    Wartungen und Schaeden fuer das ausgewaehlte Fahrzeug.
                  </p>
                </div>
                {detailsLoading ? (
                  <span className="text-sm text-slate-500">Daten werden geladen...</span>
                ) : null}
              </div>

              {detailsError ? (
                <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {detailsError}
                </div>
              ) : null}

              <dl className="mt-4 grid grid-cols-1 gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-lg border border-slate-200 bg-white px-4 py-3">
                  <dt className="text-xs font-semibold uppercase text-slate-500">Letzte Wartung</dt>
                  <dd className="mt-2 text-base font-semibold text-slate-800">
                    {formatDisplayDate(letzteWartung ?? '')}
                  </dd>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white px-4 py-3">
                  <dt className="text-xs font-semibold uppercase text-slate-500">Naechste Wartung</dt>
                  <dd className="mt-2 text-base font-semibold text-slate-800">
                    {formatDisplayDate(naechsteWartung ?? '')}
                  </dd>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white px-4 py-3">
                  <dt className="text-xs font-semibold uppercase text-slate-500">Offene Schaeden</dt>
                  <dd className="mt-2 text-base font-semibold text-slate-800">{offeneSchaeden}</dd>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white px-4 py-3">
                  <dt className="text-xs font-semibold uppercase text-slate-500">Fahrzeugstatus</dt>
                  <dd className="mt-2 text-base font-semibold text-slate-800">{fahrzeugStatus}</dd>
                </div>
              </dl>
            </div>
          ) : null}

          <div className="mt-4 flex w-full justify-end gap-2">
            <button
              type="button"
              onClick={openCreateVehicleModal}
              className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600"
            >
              Fahrzeug hinzufuegen
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
        ? renderVehicleModal('create', 'Fahrzeug hinzufuegen', 'Fahrzeug hinzufuegen')
        : null}

      {isModalOpen && modalMode === 'edit'
        ? renderVehicleModal('edit', 'Fahrzeugdaten bearbeiten', 'Aenderungen speichern')
        : null}
    </main>
  )
}

export default FahrzeuginfosPage

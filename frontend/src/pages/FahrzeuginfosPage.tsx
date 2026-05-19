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

function toDateInputValue(value?: string | Date | null): string {
  if (!value) {
    return ''
  }

  if (typeof value === 'string') {
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return value
    }

    const germanDate = value.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/)
    if (germanDate) {
      const [, day, month, year] = germanDate
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
    }

    return ''
  }

  const year = value.getFullYear()
  const month = String(value.getMonth() + 1).padStart(2, '0')
  const day = String(value.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function formatKilometerstand(value: number | null | undefined) {
  if (value === null || value === undefined) {
    return '-'
  }

  return `${new Intl.NumberFormat('de-DE').format(value)} km`
}

function isWartungDueSoon(value: string | null | undefined) {
  if (!value) {
    return false
  }

  const parsedDate = new Date(value)
  if (Number.isNaN(parsedDate.getTime())) {
    return false
  }

  const diffDays = (parsedDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  return diffDays >= 0 && diffDays <= 30
}

function getStatusBadgeClasses(status: string) {
  const base = 'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold'

  switch (status) {
    case 'Einsatzbereit':
      return `${base} bg-emerald-100 text-emerald-700`
    case 'Wartung fällig':
    case 'Wartung faellig':
      return `${base} bg-amber-100 text-amber-700`
    case 'Werkstatt':
      return `${base} bg-orange-100 text-orange-700`
    case 'Außer Betrieb':
    case 'Ausser Betrieb':
      return `${base} bg-rose-100 text-rose-700`
    default:
      return `${base} bg-slate-100 text-slate-600`
  }
}

function getAktivBadgeClasses(isAktiv: boolean) {
  return isAktiv
    ? 'inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700'
    : 'inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600'
}

type FahrzeugTab = 'stammdaten' | 'wartungen' | 'schaeden'

const schadenStatusOptions = ['Offen', 'In Bearbeitung', 'Behoben', 'Nicht reparierbar']

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
  const [editingWartungId, setEditingWartungId] = useState<number | null>(null)
  const [editingSchadenId, setEditingSchadenId] = useState<number | null>(null)

  const selectedVehicle = vehicles.find((vehicle) => vehicle.id === selectedVehicleId) ?? null

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

  const sortedVehicles = [...vehicles].sort((a, b) =>
    a.kennzeichen.localeCompare(b.kennzeichen, 'de'),
  )
  const sortedSchaeden = [...schaeden].sort((first, second) => {
    const firstDate = new Date(first.entstandenAm)
    const secondDate = new Date(second.entstandenAm)
    const firstValue = Number.isNaN(firstDate.getTime()) ? 0 : firstDate.getTime()
    const secondValue = Number.isNaN(secondDate.getTime()) ? 0 : secondDate.getTime()

    return secondValue - firstValue
  })

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
              {renderTabButton('schaeden', 'Schäden')}
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
                          <div className="max-h-[350px] overflow-x-hidden overflow-y-auto">
                            <table className="w-full border-collapse text-sm">
                              <thead className="bg-slate-50">
                                <tr className="border-b border-slate-200">
                                  <th className="sticky top-0 z-10 bg-slate-50 px-4 py-2 text-left font-semibold text-slate-700">
                                    Letzter Termin
                                  </th>
                                  <th className="sticky top-0 z-10 bg-slate-50 px-4 py-2 text-left font-semibold text-slate-700">
                                    Nächster Termin
                                  </th>
                                  <th className="sticky top-0 z-10 bg-slate-50 px-4 py-2 text-left font-semibold text-slate-700">Grund</th>
                                  <th className="sticky top-0 z-10 bg-slate-50 px-4 py-2 text-left font-semibold text-slate-700">Ort</th>
                                  <th className="sticky top-0 z-10 bg-slate-50 px-4 py-2 text-left font-semibold text-slate-700">Kosten</th>
                                </tr>
                              </thead>
                              <tbody>
                                {wartungen.map((wartung) => (
                                  <tr
                                    key={wartung.id}
                                    onClick={() => startEditWartung(wartung)}
                                    className={`border-b border-slate-100 transition hover:bg-slate-50 ${
                                      editingWartungId === wartung.id ? 'table-primary' : ''
                                    }`}
                                    style={{ cursor: 'pointer' }}
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
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>

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
                            Nächster Termin
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
                                ? 'Änderungen speichern'
                                : 'Wartung anlegen'}
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
                      Schäden koennen erst nach dem Speichern des Fahrzeugs erfasst werden.
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
                            Schäden werden geladen...
                          </div>
                        ) : schaeden.length === 0 ? (
                          <div className="px-4 py-6 text-sm text-slate-500">
                            Noch keine Schäden vorhanden.
                          </div>
                        ) : (
                          <div className="max-h-[350px] overflow-x-hidden overflow-y-auto">
                            <table className="w-full border-collapse text-sm">
                              <thead className="bg-slate-50">
                                <tr className="border-b border-slate-200">
                                  <th className="sticky top-0 z-10 bg-slate-50 px-4 py-2 text-left font-semibold text-slate-700">
                                    Beschreibung
                                  </th>
                                  <th className="sticky top-0 z-10 bg-slate-50 px-4 py-2 text-left font-semibold text-slate-700">
                                    Entstanden am
                                  </th>
                                  <th className="sticky top-0 z-10 bg-slate-50 px-4 py-2 text-left font-semibold text-slate-700">
                                    Behoben am
                                  </th>
                                  <th className="sticky top-0 z-10 bg-slate-50 px-4 py-2 text-left font-semibold text-slate-700">Status</th>
                                </tr>
                              </thead>
                              <tbody>
                                {sortedSchaeden.map((schaden) => (
                                  <tr
                                    key={schaden.id}
                                    onClick={() => startEditSchaden(schaden)}
                                    className={`cursor-pointer border-b border-slate-100 transition hover:bg-slate-50 ${
                                      editingSchadenId === schaden.id ? 'bg-[#0053a0]/10' : ''
                                    }`}
                                  >
                                    <td className="px-4 py-2 text-slate-700 max-w-[220px] truncate">
                                      {schaden.beschreibung}
                                    </td>
                                    <td className="px-4 py-2 text-slate-700">
                                      {formatDisplayDate(schaden.entstandenAm)}
                                    </td>
                                    <td className="px-4 py-2 text-slate-700">
                                      {formatDisplayDate(schaden.behobenAm ?? '')}
                                    </td>
                                    <td className="px-4 py-2 text-slate-700">{schaden.status}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>

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
                                ? 'Änderungen speichern'
                                : 'Schaden anlegen'}
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
              <table className="w-full min-w-[1200px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="px-3 py-3 text-left font-semibold text-slate-700">Auswahl</th>
                    <th className="px-3 py-3 text-left font-semibold text-slate-700">Fahrzeug-ID</th>
                    <th className="px-3 py-3 text-left font-semibold text-slate-700">Kennzeichen</th>
                    <th className="px-3 py-3 text-left font-semibold text-slate-700">Bezeichnung</th>
                    <th className="px-3 py-3 text-left font-semibold text-slate-700">Initiative</th>
                    <th className="px-3 py-3 text-left font-semibold text-slate-700">Kapazität</th>
                    <th className="px-3 py-3 text-left font-semibold text-slate-700">Kilometerstand</th>
                    <th className="px-3 py-3 text-left font-semibold text-slate-700">Betriebsaufnahme</th>
                    <th className="px-3 py-3 text-left font-semibold text-slate-700">Letzte Wartung</th>
                    <th className="px-3 py-3 text-left font-semibold text-slate-700">Nächste Wartung</th>
                    <th className="px-3 py-3 text-left font-semibold text-slate-700">Offene Schäden</th>
                    <th className="px-3 py-3 text-left font-semibold text-slate-700">Fahrzeugstatus</th>
                    <th className="px-3 py-3 text-left font-semibold text-slate-700">Aktiv</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedVehicles.map((vehicle) => {
                    const isSelected = selectedVehicleId === vehicle.id
                    const hasOffeneSchaeden = vehicle.offeneSchaeden > 0
                    const isDueSoon = isWartungDueSoon(vehicle.naechsteWartung)
                    const rowRing = hasOffeneSchaeden
                      ? 'ring-1 ring-inset ring-rose-200'
                      : isDueSoon
                        ? 'ring-1 ring-inset ring-amber-200'
                        : ''

                    return (
                      <tr
                        key={vehicle.id}
                        className={`border-b border-slate-100 transition hover:bg-slate-50 ${
                          isSelected ? 'bg-[#0053a0]/5' : ''
                        } ${rowRing}`}
                      >
                        <td className="px-3 py-3 text-slate-700">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(event) =>
                              handleVehicleSelection(vehicle.id, event.target.checked)
                            }
                          />
                        </td>
                        <td className="px-3 py-3 text-slate-700 tabular-nums whitespace-nowrap">
                          {vehicle.id}
                        </td>
                        <td className="px-3 py-3 text-slate-700 font-medium whitespace-nowrap">
                          {vehicle.kennzeichen}
                        </td>
                        <td className="px-3 py-3 text-slate-700 max-w-[200px] truncate">
                          {vehicle.bezeichnung}
                        </td>
                        <td className="px-3 py-3 text-slate-700 max-w-[180px] truncate">
                          {vehicle.initiativeName ?? '-'}
                        </td>
                        <td className="px-3 py-3 text-right text-slate-700 tabular-nums whitespace-nowrap">
                          {vehicle.kapazitaet}
                        </td>
                        <td className="px-3 py-3 text-right text-slate-700 tabular-nums whitespace-nowrap">
                          {formatKilometerstand(vehicle.kilometerstand)}
                        </td>
                        <td className="px-3 py-3 text-slate-700 tabular-nums whitespace-nowrap">
                          {formatDisplayDate(vehicle.betriebsaufnahme)}
                        </td>
                        <td className="px-3 py-3 text-slate-700 tabular-nums whitespace-nowrap">
                          {formatDisplayDate(vehicle.letzteWartung ?? '')}
                        </td>
                        <td className="px-3 py-3 text-slate-700 tabular-nums whitespace-nowrap">
                          {formatDisplayDate(vehicle.naechsteWartung ?? '')}
                        </td>
                        <td className="px-3 py-3 text-slate-700 tabular-nums whitespace-nowrap">
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                              hasOffeneSchaeden
                                ? 'bg-rose-100 text-rose-700'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {vehicle.offeneSchaeden}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-slate-700 whitespace-nowrap">
                          <span className={getStatusBadgeClasses(vehicle.status)}>
                            {vehicle.status}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-slate-700 whitespace-nowrap">
                          <span className={getAktivBadgeClasses(vehicle.aktiv)}>
                            {vehicle.aktiv ? 'Ja' : 'Nein'}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
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

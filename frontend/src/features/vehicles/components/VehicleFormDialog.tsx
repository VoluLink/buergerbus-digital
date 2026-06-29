import type { FormEvent } from 'react'
import { X } from 'lucide-react'
import type {
  FahrzeugFieldConfig,
  FahrzeugFormData,
  FahrzeugFormMode,
} from '../../../types/Fahrzeug'
import type { Schaden, SchadenFormData } from '../../../types/Schaden'
import type { InitiativeSummary } from '../../../types/UserProfile'
import type { Wartung, WartungFormData } from '../../../types/Wartung'
import type { FahrzeugTab } from '../types'
import DamageSection from './DamageSection'
import MaintenanceSection from './MaintenanceSection'

interface VehicleFormDialogProps {
  activeTab: FahrzeugTab
  detailsError: string
  detailsLoading: boolean
  editingSchadenId: number | null
  editingWartungId: number | null
  formData: FahrzeugFormData
  formError: string
  initativen: InitiativeSummary[]
  isCrudRestricted: boolean
  isSaving: boolean
  isSchadenSaving: boolean
  isWartungSaving: boolean
  mode: FahrzeugFormMode
  schadenFormData: SchadenFormData
  schadenFormError: string
  schaeden: Schaden[]
  schadenStatusOptions: string[]
  schadenSuccessMessage: string
  submitLabel: string
  title: string
  vehicleFormFields: FahrzeugFieldConfig[]
  wartungFormData: WartungFormData
  wartungFormError: string
  wartungen: Wartung[]
  wartungSuccessMessage: string
  onCancelEditSchaden: () => void
  onCancelEditWartung: () => void
  onClose: () => void
  onFieldChange: (fieldName: keyof FahrzeugFormData, value: string) => void
  onSaveSchaden: (event: FormEvent<HTMLFormElement>) => void
  onSaveVehicle: (event: FormEvent<HTMLFormElement>) => void
  onSaveWartung: (event: FormEvent<HTMLFormElement>) => void
  onSchadenFieldChange: (fieldName: keyof SchadenFormData, value: string) => void
  onSetActiveTab: (tab: FahrzeugTab) => void
  onStartEditSchaden: (schaden: Schaden) => void
  onStartEditWartung: (wartung: Wartung) => void
  onWartungFieldChange: (fieldName: keyof WartungFormData, value: string) => void
}

function VehicleFormDialog({
  activeTab,
  detailsError,
  detailsLoading,
  editingSchadenId,
  editingWartungId,
  formData,
  formError,
  initativen,
  isCrudRestricted,
  isSaving,
  isSchadenSaving,
  isWartungSaving,
  mode,
  schadenFormData,
  schadenFormError,
  schaeden,
  schadenStatusOptions,
  schadenSuccessMessage,
  submitLabel,
  title,
  vehicleFormFields,
  wartungFormData,
  wartungFormError,
  wartungen,
  wartungSuccessMessage,
  onCancelEditSchaden,
  onCancelEditWartung,
  onClose,
  onFieldChange,
  onSaveSchaden,
  onSaveVehicle,
  onSaveWartung,
  onSchadenFieldChange,
  onSetActiveTab,
  onStartEditSchaden,
  onStartEditWartung,
  onWartungFieldChange,
}: VehicleFormDialogProps) {
  const isCreateMode = mode === 'create'

  const renderTabButton = (tab: FahrzeugTab, label: string) => (
    <button
      type="button"
      onClick={() => {
        if (!isCreateMode || tab === 'stammdaten') {
          onSetActiveTab(tab)
        }
      }}
      className={`min-h-11 rounded-lg px-4 py-2 text-sm font-semibold transition ${
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
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/50 p-3 backdrop-blur-sm sm:items-center sm:p-4">
      <div
        className="flex max-h-[calc(100vh-2rem)] w-full max-w-2xl flex-col overflow-hidden rounded-lg bg-white shadow-lg"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 border-b px-4 py-4 sm:px-6">
          <h2 className="text-xl font-bold text-slate-800">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700"
            aria-label="Dialog schließen"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6">
          <div className="flex flex-wrap gap-2 border-b pb-3">
            {renderTabButton('stammdaten', 'Stammdaten')}
            {renderTabButton('wartungen', 'Wartungen')}
            {renderTabButton('schaeden', 'Schäden')}
          </div>

          <div className="mt-4">
            {activeTab === 'stammdaten' ? (
              <form
                onSubmit={onSaveVehicle}
                className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3"
              >
                {vehicleFormFields.map((field) => {
                  const fieldValue = formData[field.name]
                  const isTextarea = field.type === 'textarea'
                  const isSelect = field.type === 'select'
                  const isKapazitaet = field.name === 'kapazitaet'
                  const selectOptions =
                    field.name === 'initiativeId'
                      ? initativen.map((initiative) => ({
                          label: initiative.name,
                          value: String(initiative.id),
                        }))
                      : field.options ?? []
                  const fieldSpan = isTextarea ? 'col-span-1 sm:col-span-2 md:col-span-3' : ''

                  return (
                    <div key={field.name} className={fieldSpan}>
                      <label className="block text-sm font-medium text-slate-700">
                        {field.label}
                      </label>

                      {isTextarea ? (
                        <textarea
                          value={fieldValue}
                          onChange={(event) => onFieldChange(field.name, event.target.value)}
                          rows={4}
                          className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                        />
                      ) : isSelect ? (
                        <select
                          value={fieldValue}
                          onChange={(event) => onFieldChange(field.name, event.target.value)}
                          className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                        >
                          {field.name === 'initiativeId' ? (
                            <option value="">Keine Initiative ausgewählt</option>
                          ) : null}
                          {field.name === 'initiativeId' && selectOptions.length === 0 ? (
                            <option value="" disabled>
                              Keine Initiativen gefunden
                            </option>
                          ) : null}
                          {selectOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type={field.type}
                          value={fieldValue}
                          min={isKapazitaet ? 1 : undefined}
                          max={isKapazitaet ? 8 : undefined}
                          onChange={(event) => {
                            if (isKapazitaet) {
                              const rawValue = event.target.value
                              if (!rawValue) {
                                onFieldChange(field.name, '')
                                return
                              }

                              const numericValue = Number(rawValue)
                              if (Number.isNaN(numericValue)) {
                                return
                              }

                              const clampedValue = Math.min(Math.max(numericValue, 1), 8)
                              onFieldChange(field.name, String(clampedValue))
                              return
                            }

                            onFieldChange(field.name, event.target.value)
                          }}
                          className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                        />
                      )}
                    </div>
                  )
                })}

                {formError ? (
                  <p className="col-span-1 text-sm text-red-600 sm:col-span-2 md:col-span-3">
                    {formError}
                  </p>
                ) : null}

                <div className="sticky bottom-0 col-span-1 -mx-4 mt-2 grid grid-cols-1 gap-2 bg-white/95 px-4 py-3 sm:col-span-2 sm:mx-0 sm:flex sm:justify-end sm:px-0 md:col-span-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="min-h-11 rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
                  >
                    Abbrechen
                  </button>
                  <button
                    type="submit"
                    disabled={isCrudRestricted || isSaving}
                    className={`min-h-11 rounded-lg px-4 py-2 text-sm font-semibold text-white ${
                      isCrudRestricted || isSaving
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
                    Wartungen können erst nach dem Speichern des Fahrzeugs erfasst werden.
                  </div>
                ) : (
                  <MaintenanceSection
                    detailsError={detailsError}
                    detailsLoading={detailsLoading}
                    editingWartungId={editingWartungId}
                    formData={wartungFormData}
                    formError={wartungFormError}
                    isCrudRestricted={isCrudRestricted}
                    isSaving={isWartungSaving}
                    successMessage={wartungSuccessMessage}
                    wartungen={wartungen}
                    onCancelEdit={onCancelEditWartung}
                    onFieldChange={onWartungFieldChange}
                    onSave={onSaveWartung}
                    onStartEdit={onStartEditWartung}
                  />
                )}
              </div>
            ) : null}

            {activeTab === 'schaeden' ? (
              <div className="space-y-4">
                {isCreateMode ? (
                  <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                    Schäden können erst nach dem Speichern des Fahrzeugs erfasst werden.
                  </div>
                ) : (
                  <DamageSection
                    detailsError={detailsError}
                    detailsLoading={detailsLoading}
                    editingSchadenId={editingSchadenId}
                    formData={schadenFormData}
                    formError={schadenFormError}
                    isCrudRestricted={isCrudRestricted}
                    isSaving={isSchadenSaving}
                    schaeden={schaeden}
                    schadenStatusOptions={schadenStatusOptions}
                    successMessage={schadenSuccessMessage}
                    onCancelEdit={onCancelEditSchaden}
                    onFieldChange={onSchadenFieldChange}
                    onSave={onSaveSchaden}
                    onStartEdit={onStartEditSchaden}
                  />
                )}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}

export default VehicleFormDialog

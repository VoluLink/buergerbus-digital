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
import { useDialogAccessibility } from '../../../components/dialogs/useDialogAccessibility'
import { ui } from '../../../design/ui'

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
  const { dialogRef, handleKeyDown } = useDialogAccessibility<HTMLDivElement>(onClose)
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
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/50 p-2 backdrop-blur-sm sm:items-center sm:p-4">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="vehicle-dialog-title"
        tabIndex={-1}
        onKeyDown={handleKeyDown}
        className="flex h-[calc(100dvh-1rem)] w-full max-w-2xl flex-col overflow-hidden rounded-lg bg-white shadow-lg sm:h-auto sm:max-h-[calc(100dvh-2rem)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between gap-3 border-b px-4 py-4 sm:px-6">
          <h2 id="vehicle-dialog-title" className="text-xl font-bold text-slate-800">{title}</h2>
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
                id="vehicle-main-form"
                onSubmit={onSaveVehicle}
                className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3"
              >
                {vehicleFormFields.map((field) => {
                  const fieldValue = formData[field.name]
                  const isTextarea = field.type === 'textarea'
                  const isSelect = field.type === 'select'
                  const isKapazitaet = field.name === 'kapazitaet'
                  const isRequired = ['kennzeichen', 'bezeichnung', 'initiativeId', 'kapazitaet', 'kilometerstand', 'betriebsaufnahme'].includes(field.name)
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
                      <label className={ui.label}>
                        {field.label}{isRequired ? <span className="ml-1 text-rose-700" aria-label="Pflichtfeld">*</span> : null}
                      </label>

                      {isTextarea ? (
                        <>
                          <textarea
                            value={fieldValue}
                            onChange={(event) => onFieldChange(field.name, event.target.value)}
                            rows={4}
                            maxLength={1000}
                            aria-describedby="vehicle-remarks-counter"
                            className={ui.field}
                          />
                          <p id="vehicle-remarks-counter" className="mt-1 text-right text-xs text-slate-500">{fieldValue.length}/1000 Zeichen</p>
                        </>
                      ) : isSelect ? (
                        <select
                          value={fieldValue}
                          onChange={(event) => onFieldChange(field.name, event.target.value)}
                          required={isRequired}
                          className={ui.field}
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
                          required={isRequired}
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
                          className={ui.field}
                        />
                      )}
                    </div>
                  )
                })}

                {formError ? (
                  <p className="col-span-1 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800 sm:col-span-2 md:col-span-3" role="alert">
                    {formError}
                  </p>
                ) : null}

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

        {activeTab === 'stammdaten' ? (
          <div className="grid shrink-0 grid-cols-1 gap-2 border-t border-slate-200 bg-white px-4 py-4 pb-[calc(env(safe-area-inset-bottom)+12px)] sm:flex sm:justify-end sm:px-6 sm:pb-4">
            <button
              type="button"
              onClick={onClose}
              className={ui.secondaryButton}
            >
              Abbrechen
            </button>
            <button
              type="submit"
              form="vehicle-main-form"
              disabled={isCrudRestricted || isSaving}
              className={ui.primaryButton}
            >
              {isSaving ? 'Speichern...' : submitLabel}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  )
}

export default VehicleFormDialog

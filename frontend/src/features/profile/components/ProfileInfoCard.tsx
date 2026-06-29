import type { ProfileFormData } from '../types'
import { formatRoleLabel } from '../utils'
import { DriverInfoSection } from './DriverInfoSection'

type ProfileInfoCardProps = {
  error: string | null
  saveSuccess: string | null
  saveError: string | null
  isLoading: boolean
  hasCurrentUser: boolean
  userRoles: string[]
  userId: string
  initiativeName: string
  formData: ProfileFormData
  phoneError: string
  isAccountActive: boolean
  onInputChange: (field: keyof ProfileFormData, value: string) => void
  onAccountActiveChange: (value: boolean) => void
}

export function ProfileInfoCard({
  error,
  saveSuccess,
  saveError,
  isLoading,
  hasCurrentUser,
  userRoles,
  userId,
  initiativeName,
  formData,
  phoneError,
  isAccountActive,
  onInputChange,
  onAccountActiveChange,
}: ProfileInfoCardProps) {
  return (
    <>
      {error ? (
        <p className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </p>
      ) : null}

      {saveSuccess ? (
        <p className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {saveSuccess}
        </p>
      ) : null}

      {saveError ? (
        <p className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {saveError}
        </p>
      ) : null}

      {isLoading && !hasCurrentUser ? (
        <p className="mb-4 text-sm text-slate-500">Profil wird geladen...</p>
      ) : null}
      <div className="mb-4 border-b border-slate-200 pb-3">
        <h2 className="text-lg font-bold text-slate-800 sm:text-xl">Profil</h2>
      </div>

      <div className="mb-6">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Rollen
        </p>
        <div className="flex flex-wrap gap-2">
          {userRoles.length > 0 ? (
            userRoles.map((role) => (
              <span
                key={role}
                className="rounded-full bg-[#0053a0] px-3 py-1.5 text-xs font-semibold text-white"
              >
                {formatRoleLabel(role)}
              </span>
            ))
          ) : (
            <span className="text-xs text-slate-400">Keine Rollen zugewiesen</span>
          )}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div>
          <label htmlFor="userId" className="block text-xs font-semibold text-slate-700">
            Benutzer-ID
          </label>
          <input
            id="userId"
            type="text"
            value={userId}
            disabled
            className="mt-1 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-700 outline-none cursor-not-allowed"
          />
        </div>

        <div>
          <label htmlFor="username" className="block text-xs font-semibold text-slate-700">
            Benutzername
          </label>
          <input
            id="username"
            type="text"
            value={formData.username}
            onChange={(e) => onInputChange('username', e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#0053a0] focus:ring-2 focus:ring-[#0053a0]/15"
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-xs font-semibold text-slate-700">
            E-Mail-Adresse
          </label>
          <input
            id="email"
            type="email"
            value={formData.email}
            disabled
            placeholder="email@example.de"
            className="mt-1 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-700 outline-none cursor-not-allowed"
          />
        </div>

        <div>
          <label htmlFor="initiative" className="block text-xs font-semibold text-slate-700">
            Initiative
          </label>
          <input
            id="initiative"
            type="text"
            value={initiativeName || 'Nicht gesetzt'}
            disabled
            className="mt-1 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-700 outline-none cursor-not-allowed"
          />
        </div>

        <div>
          <label htmlFor="firstName" className="block text-xs font-semibold text-slate-700">
            Vorname
          </label>
          <input
            id="firstName"
            type="text"
            value={formData.firstName}
            onChange={(e) => onInputChange('firstName', e.target.value)}
            placeholder="z. B. Max"
            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#0053a0] focus:ring-2 focus:ring-[#0053a0]/15"
          />
        </div>

        <div>
          <label htmlFor="lastName" className="block text-xs font-semibold text-slate-700">
            Nachname
          </label>
          <input
            id="lastName"
            type="text"
            value={formData.lastName}
            onChange={(e) => onInputChange('lastName', e.target.value)}
            placeholder="z. B. Mustermann"
            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#0053a0] focus:ring-2 focus:ring-[#0053a0]/15"
          />
        </div>

        <div>
          <label htmlFor="phone" className="block text-xs font-semibold text-slate-700">
            Telefonnummer
          </label>
          <input
            id="phone"
            type="tel"
            value={formData.phone}
            onChange={(e) => onInputChange('phone', e.target.value)}
            placeholder="+49 170 1002003"
            className={`mt-1 w-full rounded-lg border bg-white px-3 py-2 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#0053a0] focus:ring-2 focus:ring-[#0053a0]/15 ${
              phoneError ? 'border-red-400' : 'border-slate-300'
            }`}
          />
          {phoneError && <p className="mt-1 text-xs text-red-600">{phoneError}</p>}
        </div>

        <DriverInfoSection formData={formData} onInputChange={onInputChange} />
      </div>

      <div className="mt-4">
        <label htmlFor="street" className="block text-xs font-semibold text-slate-700">
          Straße
        </label>
        <input
          id="street"
          type="text"
          value={formData.street}
          onChange={(e) => onInputChange('street', e.target.value)}
          placeholder="Musterstraße 123"
          className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#0053a0] focus:ring-2 focus:ring-[#0053a0]/15"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2 mt-4">
        <div>
          <label htmlFor="postCode" className="block text-xs font-semibold text-slate-700">
            Postleitzahl
          </label>
          <input
            id="postCode"
            type="text"
            value={formData.postCode}
            onChange={(e) => onInputChange('postCode', e.target.value)}
            placeholder="12345"
            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#0053a0] focus:ring-2 focus:ring-[#0053a0]/15"
          />
        </div>

        <div>
          <label htmlFor="city" className="block text-xs font-semibold text-slate-700">
            Ort
          </label>
          <input
            id="city"
            type="text"
            value={formData.city}
            onChange={(e) => onInputChange('city', e.target.value)}
            placeholder="Berlin"
            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#0053a0] focus:ring-2 focus:ring-[#0053a0]/15"
          />
        </div>
      </div>

      <div className="mt-4">
        <label htmlFor="remarks" className="block text-xs font-semibold text-slate-700">
          Bemerkung
        </label>
        <textarea
          id="remarks"
          value={formData.remarks}
          onChange={(e) => onInputChange('remarks', e.target.value)}
          placeholder="Bemerkungen..."
          rows={3}
          className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#0053a0] focus:ring-2 focus:ring-[#0053a0]/15"
        />
      </div>

      <div className="mt-4 flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/50 p-3">
        <span className="text-xs font-semibold text-slate-700">Aktiver Account</span>
        <button
          type="button"
          onClick={() => onAccountActiveChange(!isAccountActive)}
          className={`relative inline-flex h-8 w-14 items-center rounded-full transition ${
            isAccountActive ? 'bg-emerald-500' : 'bg-slate-300'
          }`}
        >
          <span
            className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-lg transition ${
              isAccountActive ? 'translate-x-7' : 'translate-x-1'
            }`}
          />
        </button>
      </div>
    </>
  )
}

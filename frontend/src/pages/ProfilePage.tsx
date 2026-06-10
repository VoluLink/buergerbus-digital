import { useEffect, useState } from 'react'
import {
  Bus,
  Menu,
  Settings,
  Trash2,
  UserRound,
  UserRoundPlus,
  X,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import UserMenuButton from '../components/UserMenuButton'
import { useAuth } from '../context/AuthContext'
import { updateUserProfile } from '../services/profile'
import { useRoleVisibility } from '../hooks/useRoleVisibility'

function formatDateInput(value?: string | null) {
  if (!value) {
    return ''
  }

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return ''
  }

  return parsed.toISOString().slice(0, 10)
}

function formatRoleLabel(role: string) {
  const normalized = role.toLowerCase()
  if (normalized === 'admin') {
    return 'Admin'
  }
  if (normalized === 'disponent') {
    return 'Disponent'
  }
  if (normalized === 'fahrer') {
    return 'Fahrer'
  }

  return role
}

function ProfilePage() {
  const navigate = useNavigate()
  const { currentUser, isLoading, error, refreshProfile } = useAuth()
  const { canManageInitiatives, isFahrer } = useRoleVisibility()
  const [isSideMenuOpen, setIsSideMenuOpen] = useState(false)
  const [isAccountActive, setIsAccountActive] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
    driverLicense: '',
    lastG2s: '',
    nextG2s: '',
    street: '',
    postCode: '',
    city: '',
    remarks: '',
  })

  const [phoneError, setPhoneError] = useState('')

  useEffect(() => {
    if (!currentUser) {
      void refreshProfile()
      return
    }

    setFormData({
      username: currentUser.username ?? '',
      email: currentUser.email ?? '',
      firstName: currentUser.vorname ?? '',
      lastName: currentUser.nachname ?? '',
      phone: currentUser.telefonnummer ?? '',
      driverLicense: currentUser.fuehrerscheinklasse ?? '',
      lastG2s: formatDateInput(currentUser.letzteG25),
      nextG2s: formatDateInput(currentUser.naechsteG25),
      street: currentUser.strasse ?? '',
      postCode: currentUser.postleitzahl ?? '',
      city: currentUser.ort ?? '',
      remarks: currentUser.bemerkung ?? '',
    })

    setIsAccountActive(currentUser.aktiv ?? true)
    setSaveError(null)
    setSaveSuccess(null)
  }, [currentUser, refreshProfile])

  const userRoles = Array.from(new Set((currentUser?.roles ?? []).filter(Boolean)))
  const userId = currentUser ? String(currentUser.id) : '-'
  const initiativeName = currentUser?.initiative?.name ?? ''

  function closeSideMenu() {
    setIsSideMenuOpen(false)
  }

  function goToPage(path: string) {
    closeSideMenu()
    navigate(path)
  }

  function handleInputChange(field: keyof typeof formData, value: string) {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))

    if (field === 'phone') {
      const phoneRegex = /^[\d\s+()/-]*$/
      setPhoneError(value && !phoneRegex.test(value) ? 'Ungültige Telefonnummer' : '')
    }
  }

  async function handleSaveProfile() {
    if (!currentUser) {
      return
    }

    if (phoneError) {
      setSaveError('Bitte prüfen Sie die Telefonnummer.')
      return
    }

    const normalizeNullable = (value: string) => {
      const trimmed = value.trim()
      return trimmed.length === 0 ? null : trimmed
    }

    const hasFahrerRole = userRoles.some((role) => role.toLowerCase() === 'fahrer')

    setIsSaving(true)
    setSaveError(null)
    setSaveSuccess(null)

    try {
      const updatedProfile = await updateUserProfile(currentUser.id, {
        username: normalizeNullable(formData.username) ?? '',
        vorname: normalizeNullable(formData.firstName),
        nachname: normalizeNullable(formData.lastName),
        strasse: normalizeNullable(formData.street),
        postleitzahl: normalizeNullable(formData.postCode),
        ort: normalizeNullable(formData.city),
        telefonnummer: normalizeNullable(formData.phone),
        fuehrerscheinklasse: normalizeNullable(formData.driverLicense),
        letzteG25: formData.lastG2s ? formData.lastG2s : null,
        naechsteG25: formData.nextG2s ? formData.nextG2s : null,
        bemerkung: normalizeNullable(formData.remarks),
        aktiv: isAccountActive,
        fahrer: hasFahrerRole
          ? {
              bemerkung: normalizeNullable(formData.remarks),
              aktiv: isAccountActive,
            }
          : null,
      })

      setFormData((prev) => ({
        ...prev,
        username: updatedProfile.username ?? '',
        email: updatedProfile.email ?? '',
        firstName: updatedProfile.vorname ?? '',
        lastName: updatedProfile.nachname ?? '',
        phone: updatedProfile.telefonnummer ?? '',
        driverLicense: updatedProfile.fuehrerscheinklasse ?? '',
        lastG2s: formatDateInput(updatedProfile.letzteG25),
        nextG2s: formatDateInput(updatedProfile.naechsteG25),
        street: updatedProfile.strasse ?? '',
        postCode: updatedProfile.postleitzahl ?? '',
        city: updatedProfile.ort ?? '',
        remarks: updatedProfile.bemerkung ?? '',
      }))

      setIsAccountActive(updatedProfile.aktiv ?? true)
      setSaveSuccess('Profil wurde gespeichert.')
      void refreshProfile()
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Profil konnte nicht gespeichert werden.')
    } finally {
      setIsSaving(false)
    }
  }

  function handleDeleteProfile() {
    if (window.confirm('Möchten Sie dieses Profil wirklich löschen?')) {
      console.log('Profil löschen')
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

            <h1 className="text-2xl font-bold text-slate-800">Profil</h1>
          </div>

          <UserMenuButton
            onClick={() => navigate('/profil')}
            icon={<UserRound className="h-6 w-6" aria-hidden="true" />}
          />
        </div>
      </header>

      <div className="p-2 sm:p-3 lg:p-4">
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
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

          {isLoading && !currentUser ? (
            <p className="mb-4 text-sm text-slate-500">Profil wird geladen...</p>
          ) : null}
          <div className="mb-4 border-b border-slate-200 pb-3">
            <h2 className="text-lg font-bold text-slate-800 sm:text-xl">Profil</h2>
          </div>

          {/* Rollen */}
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

          {/* Two-column grid */}
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Benutzer-ID */}
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

            {/* Benutzername */}
            <div>
              <label htmlFor="username" className="block text-xs font-semibold text-slate-700">
                Benutzername
              </label>
              <input
                id="username"
                type="text"
                value={formData.username}
                onChange={(e) => handleInputChange('username', e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#0053a0] focus:ring-2 focus:ring-[#0053a0]/15"
              />
            </div>

            {/* E-Mail-Adresse */}
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

            {/* Initiative */}
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

            {/* Vorname */}
            <div>
              <label htmlFor="firstName" className="block text-xs font-semibold text-slate-700">
                Vorname
              </label>
              <input
                id="firstName"
                type="text"
                value={formData.firstName}
                onChange={(e) => handleInputChange('firstName', e.target.value)}
                placeholder="z. B. Max"
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#0053a0] focus:ring-2 focus:ring-[#0053a0]/15"
              />
            </div>

            {/* Nachname */}
            <div>
              <label htmlFor="lastName" className="block text-xs font-semibold text-slate-700">
                Nachname
              </label>
              <input
                id="lastName"
                type="text"
                value={formData.lastName}
                onChange={(e) => handleInputChange('lastName', e.target.value)}
                placeholder="z. B. Mustermann"
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#0053a0] focus:ring-2 focus:ring-[#0053a0]/15"
              />
            </div>

            {/* Telefonnummer */}
            <div>
              <label htmlFor="phone" className="block text-xs font-semibold text-slate-700">
                Telefonnummer
              </label>
              <input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="+49 170 1002003"
                className={`mt-1 w-full rounded-lg border bg-white px-3 py-2 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#0053a0] focus:ring-2 focus:ring-[#0053a0]/15 ${
                  phoneError ? 'border-red-400' : 'border-slate-300'
                }`}
              />
              {phoneError && <p className="mt-1 text-xs text-red-600">{phoneError}</p>}
            </div>

            {/* Führerscheinklasse */}
            <div>
              <label htmlFor="driverLicense" className="block text-xs font-semibold text-slate-700">
                Führerscheinklasse
              </label>
              <input
                id="driverLicense"
                type="text"
                value={formData.driverLicense}
                onChange={(e) => handleInputChange('driverLicense', e.target.value)}
                placeholder="z. B. B, BE, D1"
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#0053a0] focus:ring-2 focus:ring-[#0053a0]/15"
              />
            </div>

            {/* Letzte G2S */}
            <div>
              <label htmlFor="lastG2s" className="block text-xs font-semibold text-slate-700">
                Letzte G2S
              </label>
              <input
                id="lastG2s"
                type="date"
                value={formData.lastG2s}
                onChange={(e) => handleInputChange('lastG2s', e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-[#0053a0] focus:ring-2 focus:ring-[#0053a0]/15"
              />
            </div>

            {/* Nächste G2S */}
            <div>
              <label htmlFor="nextG2s" className="block text-xs font-semibold text-slate-700">
                Nächste G2S
              </label>
              <input
                id="nextG2s"
                type="date"
                value={formData.nextG2s}
                onChange={(e) => handleInputChange('nextG2s', e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-[#0053a0] focus:ring-2 focus:ring-[#0053a0]/15"
              />
            </div>
          </div>

          {/* Adresse - Full width */}
          <div className="mt-4">
            <label htmlFor="street" className="block text-xs font-semibold text-slate-700">
              Straße
            </label>
            <input
              id="street"
              type="text"
              value={formData.street}
              onChange={(e) => handleInputChange('street', e.target.value)}
              placeholder="Musterstraße 123"
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#0053a0] focus:ring-2 focus:ring-[#0053a0]/15"
            />
          </div>

          {/* Postleitzahl und Stadt */}
          <div className="grid gap-4 lg:grid-cols-2 mt-4">
            <div>
              <label htmlFor="postCode" className="block text-xs font-semibold text-slate-700">
                Postleitzahl
              </label>
              <input
                id="postCode"
                type="text"
                value={formData.postCode}
                onChange={(e) => handleInputChange('postCode', e.target.value)}
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
                onChange={(e) => handleInputChange('city', e.target.value)}
                placeholder="Berlin"
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#0053a0] focus:ring-2 focus:ring-[#0053a0]/15"
              />
            </div>
          </div>

          {/* Bemerkung - Full width textarea */}
          <div className="mt-4">
            <label htmlFor="remarks" className="block text-xs font-semibold text-slate-700">
              Bemerkung
            </label>
            <textarea
              id="remarks"
              value={formData.remarks}
              onChange={(e) => handleInputChange('remarks', e.target.value)}
              placeholder="Bemerkungen..."
              rows={3}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#0053a0] focus:ring-2 focus:ring-[#0053a0]/15"
            />
          </div>

          {/* Aktiver Account */}
          <div className="mt-4 flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/50 p-3">
            <span className="text-xs font-semibold text-slate-700">Aktiver Account</span>
            <button
              type="button"
              onClick={() => setIsAccountActive(!isAccountActive)}
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

          {/* Action Buttons */}
          <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-200 pt-4">
            <button
              type="button"
              onClick={handleDeleteProfile}
              className="inline-flex items-center gap-2 rounded-lg border border-red-300 bg-white px-4 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50"
            >
              <Trash2 className="h-3 w-3" aria-hidden="true" />
              Löschen
            </button>

            <button
              type="button"
              onClick={handleSaveProfile}
              disabled={isSaving}
              className={`ml-auto inline-flex items-center gap-2 rounded-lg bg-[#0053a0] px-4 py-2 text-xs font-semibold text-white shadow-md transition hover:brightness-105 ${
                isSaving ? 'opacity-60 cursor-not-allowed' : ''
              }`}
            >
              {isSaving ? 'Speichere...' : 'Speichern'}
            </button>
          </div>
        </section>
      </div>

      {/* Side Menu */}
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

              {!isFahrer ? (
                <button
                  type="button"
                  onClick={() => goToPage('/fahrerinfos')}
                  className="flex w-full items-center gap-3 rounded-2xl bg-[#0053a0]/12 px-4 py-3 text-left text-lg font-medium text-[#0053a0]"
                >
                  <UserRound className="h-5 w-5" aria-hidden="true" />
                  Fahrerinfos
                </button>
              ) : null}

              <button
                type="button"
                onClick={() => goToPage('/fahrzeuginfos')}
                className="flex w-full items-center gap-3 rounded-2xl bg-[#0053a0]/12 px-4 py-3 text-left text-lg font-medium text-[#0053a0]"
              >
                <Bus className="h-5 w-5" aria-hidden="true" />
                Fahrzeuginfos
              </button>

              {!isFahrer ? (
                <button
                  type="button"
                  onClick={() => goToPage('/fahrgastinfos')}
                  className="flex w-full items-center gap-3 rounded-2xl bg-[#0053a0]/12 px-4 py-3 text-left text-lg font-medium text-[#0053a0]"
                >
                  <UserRoundPlus className="h-5 w-5" aria-hidden="true" />
                  Fahrgastinfos
                </button>
              ) : null}

              {canManageInitiatives ? (
                <button
                  type="button"
                  onClick={() => goToPage('/initiativen')}
                  className="flex w-full items-center gap-3 rounded-2xl bg-[#0053a0]/12 px-4 py-3 text-left text-lg font-medium text-[#0053a0]"
                >
                  <Bus className="h-5 w-5" aria-hidden="true" />
                  Initiativen
                </button>
              ) : null}

              {!isFahrer ? (
                <button
                  type="button"
                  onClick={() => goToPage('/rollenverteilung')}
                  className="flex w-full items-center gap-3 rounded-2xl bg-[#0053a0]/12 px-4 py-3 text-left text-lg font-medium text-[#0053a0]"
                >
                  <Settings className="h-5 w-5" aria-hidden="true" />
                  Rollenverteilung
                </button>
              ) : null}
            </div>
          </aside>
        </div>
      ) : null}
    </main>
  )
}

export default ProfilePage
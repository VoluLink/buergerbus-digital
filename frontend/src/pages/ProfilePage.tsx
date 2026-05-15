import { useState } from 'react'
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

function ProfilePage() {
  const navigate = useNavigate()
  const [isSideMenuOpen, setIsSideMenuOpen] = useState(false)
  const [isAccountActive, setIsAccountActive] = useState(false)

  const [formData, setFormData] = useState({
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

  const [emailError, setEmailError] = useState('')
  const [phoneError, setPhoneError] = useState('')

  // Rollen vom Backend (hier zur Anzeige, werden später vom Backend gesetzt)
  const userRoles = ['Admin', 'Disponend', 'Fahrer']

  // Benutzer-ID vom Backend (hier zur Anzeige, wird später vom Backend gesetzt)
  const userId = 'U-001'

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
    
    if (field === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      setEmailError(value && !emailRegex.test(value) ? 'Ungültige E-Mail-Adresse' : '')
    }
    
    if (field === 'phone') {
      const phoneRegex = /^[\d\s+()/-]*$/
      setPhoneError(value && !phoneRegex.test(value) ? 'Ungültige Telefonnummer' : '')
    }
  }

  function handleSaveProfile() {
    console.log('Profil speichern:', { userId, formData, userRoles, isAccountActive })
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
          <div className="mb-4 border-b border-slate-200 pb-3">
            <h2 className="text-lg font-bold text-slate-800 sm:text-xl">Profil</h2>
          </div>

          {/* Rollen */}
          <div className="mb-6">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Rolle
            </p>
            <div className="flex flex-wrap gap-2">
              {userRoles.length > 0 ? (
                userRoles.map((role) => {
                  let bgColor = 'bg-slate-200 text-slate-700'
                  if (role === 'Admin') bgColor = 'bg-[#0053a0] text-white'
                  if (role === 'Disponend') bgColor = 'bg-amber-500 text-white'
                  if (role === 'Fahrer') bgColor = 'bg-emerald-600 text-white'

                  return (
                    <span key={role} className={`rounded-full px-3 py-1.5 text-xs font-semibold ${bgColor}`}>
                      {role}
                    </span>
                  )
                })
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

            {/* E-Mail-Adresse */}
            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-slate-700">
                E-Mail-Adresse
              </label>
              <input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="email@example.de"
                className={`mt-1 w-full rounded-lg border bg-white px-3 py-2 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#0053a0] focus:ring-2 focus:ring-[#0053a0]/15 ${
                  emailError ? 'border-red-400' : 'border-slate-300'
                }`}
              />
              {emailError && <p className="mt-1 text-xs text-red-600">{emailError}</p>}
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
              Adresse
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
                Stadt
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
              className="ml-auto inline-flex items-center gap-2 rounded-lg bg-[#0053a0] px-4 py-2 text-xs font-semibold text-white shadow-md transition hover:brightness-105"
            >
              Speichern
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

              <button
                type="button"
                onClick={() => goToPage('/profil')}
                className="flex w-full items-center gap-3 rounded-2xl bg-[#0053a0] px-4 py-3 text-left text-lg font-medium text-white"
              >
                <UserRound className="h-5 w-5" aria-hidden="true" />
                Profil
              </button>
            </div>
          </aside>
        </div>
      ) : null}
    </main>
  )
}

export default ProfilePage
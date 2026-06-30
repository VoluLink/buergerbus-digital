import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, Menu, Trash2, UserRound } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import ProtectedSideMenu from '../components/ProtectedSideMenu'
import UserMenuButton from '../components/UserMenuButton'
import { useAuth } from '../context/AuthContext'
import { useRoleVisibility } from '../hooks/useRoleVisibility'
import { deleteUserProfile, updateUserProfile } from '../services/profile'
import { fetchUserProfile } from '../services/users'
import type { UserProfile } from '../types/UserProfile'

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

function createProfileForm(profile?: UserProfile | null) {
  return {
    username: profile?.username ?? '',
    email: profile?.email ?? '',
    firstName: profile?.vorname ?? '',
    lastName: profile?.nachname ?? '',
    phone: profile?.telefonnummer ?? '',
    driverLicense: profile?.fuehrerscheinklasse ?? '',
    lastG25: formatDateInput(profile?.letzteG25),
    nextG25: formatDateInput(profile?.naechsteG25),
    street: profile?.strasse ?? '',
    postCode: profile?.postleitzahl ?? '',
    city: profile?.ort ?? '',
    remarks: profile?.bemerkung ?? '',
    accountActive: profile?.aktiv === false ? 'false' : 'true',
  }
}

function buildDisplayName(profile: UserProfile) {
  const nameParts = [profile.vorname, profile.nachname].filter(Boolean)
  if (nameParts.length > 0) {
    return nameParts.join(' ')
  }

  return profile.username || profile.email
}

function describeRoles(profile: UserProfile) {
  if (profile.roles.length === 0) {
    return 'Keine Rollen'
  }

  const activeRole = profile.activeRole ?? profile.roles[0]
  const additionalRoles = profile.roles
    .filter((role) => role !== activeRole)
    .join(', ')

  return additionalRoles ? `Aktiv: ${activeRole} · Weitere: ${additionalRoles}` : `Aktiv: ${activeRole}`
}

function mapErrorToUiMessage(message: string) {
  const normalized = message.toLowerCase()

  if (normalized.includes('keine berechtigung')) {
    return 'Du hast keine Berechtigung, dieses Profil zu sehen.'
  }

  if (normalized.includes('nicht gefunden')) {
    return 'Der Nutzer wurde nicht gefunden.'
  }

  return message
}

function UserProfilePage() {
  const navigate = useNavigate()
  const params = useParams()
  const { currentUser, refreshProfile } = useAuth()
  const { isAdmin } = useRoleVisibility()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState(createProfileForm())
  const [isEditMode, setIsEditMode] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [actionError, setActionError] = useState('')
  const [actionSuccess, setActionSuccess] = useState('')
  const [phoneError, setPhoneError] = useState('')
  const [isSideMenuOpen, setIsSideMenuOpen] = useState(false)

  const userId = useMemo(() => {
    const raw = params.id
    if (!raw) {
      return null
    }

    const parsed = Number(raw)
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null
  }, [params.id])

  useEffect(() => {
    let isActive = true

    async function load() {
      setIsLoading(true)
      setError('')
      setProfile(null)

      if (!userId) {
        setError('Ungültige Nutzer-ID.')
        setIsLoading(false)
        return
      }

      try {
        const loaded = await fetchUserProfile(userId)
        if (!isActive) {
          return
        }
        setProfile(loaded)
        setFormData(createProfileForm(loaded))
        setIsEditMode(false)
      } catch (err) {
        if (!isActive) {
          return
        }

        const message = err instanceof Error ? err.message : 'Profil konnte nicht geladen werden.'
        setError(mapErrorToUiMessage(message))
      } finally {
        if (isActive) {
          setIsLoading(false)
        }
      }
    }

    void load()

    return () => {
      isActive = false
    }
  }, [userId])

  const canManageProfile = isAdmin && profile !== null
  const isOwnProfile = currentUser?.id === profile?.id
  const canDeleteProfile = canManageProfile && currentUser?.id !== profile?.id

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

  function startEditing() {
    if (!profile || !canManageProfile) {
      return
    }

    setFormData(createProfileForm(profile))
    setPhoneError('')
    setActionError('')
    setActionSuccess('')
    setIsEditMode(true)
  }

  function cancelEditing() {
    setFormData(createProfileForm(profile))
    setPhoneError('')
    setActionError('')
    setIsEditMode(false)
  }

  async function handleSaveProfile() {
    if (!profile || !canManageProfile) {
      return
    }

    if (phoneError) {
      setActionError('Bitte prüfen Sie die Telefonnummer.')
      return
    }

    const normalizeNullable = (value: string) => {
      const trimmed = value.trim()
      return trimmed.length === 0 ? null : trimmed
    }

    const hasFahrerRole = profile.roles.some((role) => role.toLowerCase() === 'fahrer')

    setIsSaving(true)
    setActionError('')
    setActionSuccess('')

    try {
      const updatedProfile = await updateUserProfile(profile.id, {
        username: normalizeNullable(formData.username) ?? '',
        vorname: normalizeNullable(formData.firstName),
        nachname: normalizeNullable(formData.lastName),
        strasse: normalizeNullable(formData.street),
        postleitzahl: normalizeNullable(formData.postCode),
        ort: normalizeNullable(formData.city),
        telefonnummer: normalizeNullable(formData.phone),
        fuehrerscheinklasse: normalizeNullable(formData.driverLicense),
        letzteG25: formData.lastG25 ? formData.lastG25 : null,
        naechsteG25: formData.nextG25 ? formData.nextG25 : null,
        bemerkung: normalizeNullable(formData.remarks),
        aktiv: isOwnProfile ? undefined : formData.accountActive === 'true',
        fahrer: hasFahrerRole
          ? {
              bemerkung: normalizeNullable(formData.remarks),
              aktiv: isOwnProfile ? undefined : profile.fahrer?.aktiv ?? profile.aktiv,
            }
          : null,
      })

      setProfile(updatedProfile)
      setFormData(createProfileForm(updatedProfile))
      setIsEditMode(false)
      setActionSuccess('Profil wurde gespeichert.')

      if (currentUser?.id === updatedProfile.id) {
        void refreshProfile()
      }
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Profil konnte nicht gespeichert werden.')
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDeleteProfile() {
    if (!profile || !canDeleteProfile) {
      return
    }

    const shouldDelete = window.confirm(
      `Sind Sie sicher, dass Sie das Profil von ${buildDisplayName(profile)} löschen möchten?`,
    )

    if (!shouldDelete) {
      return
    }

    setIsDeleting(true)
    setActionError('')
    setActionSuccess('')

    try {
      await deleteUserProfile(profile.id)
      navigate('/rollenverteilung', { replace: true })
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Profil konnte nicht gelöscht werden.')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">
      <header className="border-b border-slate-200 bg-white/95 px-4 py-3 shadow-sm backdrop-blur sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0053a0]/40"
              aria-label="Zurück"
            >
              <ArrowLeft className="h-5 w-5" aria-hidden="true" />
            </button>
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
          {actionSuccess ? (
            <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {actionSuccess}
            </div>
          ) : null}

          {actionError ? (
            <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {actionError}
            </div>
          ) : null}

          {isLoading ? (
            <p className="text-sm text-slate-500">Profil wird geladen...</p>
          ) : error ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          ) : profile ? (
            <div>
              <div className="mb-6 flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 pb-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-800">{buildDisplayName(profile)}</h2>
                  <p className="mt-1 text-sm text-slate-600">{describeRoles(profile)}</p>
                </div>

                {canManageProfile ? (
                  <div className="flex flex-wrap gap-3">
                    {!isEditMode ? (
                      <button
                        type="button"
                        onClick={startEditing}
                        className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                      >
                        Profil bearbeiten
                      </button>
                    ) : null}

                    <button
                      type="button"
                      onClick={() => void handleDeleteProfile()}
                      disabled={!canDeleteProfile || isDeleting || isSaving}
                      title={canDeleteProfile ? 'Profil löschen' : 'Das eigene Profil kann nicht gelöscht werden.'}
                      className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                      Profil löschen
                    </button>
                  </div>
                ) : null}
              </div>

              {isEditMode ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">Benutzername</label>
                    <input
                      type="text"
                      value={formData.username}
                      onChange={(event) => handleInputChange('username', event.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-[#0053a0] focus:ring-2 focus:ring-[#0053a0]/15"
                      disabled={isSaving || isDeleting}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">E-Mail</label>
                    <input
                      type="email"
                      value={formData.email}
                      disabled
                      className="mt-1 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">Vorname</label>
                    <input
                      type="text"
                      value={formData.firstName}
                      onChange={(event) => handleInputChange('firstName', event.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-[#0053a0] focus:ring-2 focus:ring-[#0053a0]/15"
                      disabled={isSaving || isDeleting}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">Nachname</label>
                    <input
                      type="text"
                      value={formData.lastName}
                      onChange={(event) => handleInputChange('lastName', event.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-[#0053a0] focus:ring-2 focus:ring-[#0053a0]/15"
                      disabled={isSaving || isDeleting}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">Telefonnummer</label>
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={(event) => handleInputChange('phone', event.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-[#0053a0] focus:ring-2 focus:ring-[#0053a0]/15"
                      disabled={isSaving || isDeleting}
                    />
                    {phoneError ? <p className="mt-1 text-xs text-rose-600">{phoneError}</p> : null}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">Führerscheinklasse</label>
                    <input
                      type="text"
                      value={formData.driverLicense}
                      onChange={(event) => handleInputChange('driverLicense', event.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-[#0053a0] focus:ring-2 focus:ring-[#0053a0]/15"
                      disabled={isSaving || isDeleting}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">Letzte G25</label>
                    <input
                      type="date"
                      value={formData.lastG25}
                      onChange={(event) => handleInputChange('lastG25', event.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-[#0053a0] focus:ring-2 focus:ring-[#0053a0]/15"
                      disabled={isSaving || isDeleting}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">Nächste G25</label>
                    <input
                      type="date"
                      value={formData.nextG25}
                      onChange={(event) => handleInputChange('nextG25', event.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-[#0053a0] focus:ring-2 focus:ring-[#0053a0]/15"
                      disabled={isSaving || isDeleting}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">Straße</label>
                    <input
                      type="text"
                      value={formData.street}
                      onChange={(event) => handleInputChange('street', event.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-[#0053a0] focus:ring-2 focus:ring-[#0053a0]/15"
                      disabled={isSaving || isDeleting}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">Postleitzahl</label>
                    <input
                      type="text"
                      value={formData.postCode}
                      onChange={(event) => handleInputChange('postCode', event.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-[#0053a0] focus:ring-2 focus:ring-[#0053a0]/15"
                      disabled={isSaving || isDeleting}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">Ort</label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(event) => handleInputChange('city', event.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-[#0053a0] focus:ring-2 focus:ring-[#0053a0]/15"
                      disabled={isSaving || isDeleting}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">Bemerkung</label>
                    <textarea
                      value={formData.remarks}
                      onChange={(event) => handleInputChange('remarks', event.target.value)}
                      rows={4}
                      className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-[#0053a0] focus:ring-2 focus:ring-[#0053a0]/15"
                      disabled={isSaving || isDeleting}
                    />
                  </div>
                  {!isOwnProfile ? (
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">Status</label>
                      <select
                        value={formData.accountActive}
                        onChange={(event) => handleInputChange('accountActive', event.target.value)}
                        className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-[#0053a0] focus:ring-2 focus:ring-[#0053a0]/15"
                        disabled={isSaving || isDeleting}
                      >
                        <option value="true">Aktiv</option>
                        <option value="false">Inaktiv</option>
                      </select>
                    </div>
                  ) : null}

                  <div className="sm:col-span-2 flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={cancelEditing}
                      disabled={isSaving || isDeleting}
                      className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
                    >
                      Abbrechen
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleSaveProfile()}
                      disabled={isSaving || isDeleting}
                      className="rounded-xl bg-[#0053a0] px-5 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-60"
                    >
                      {isSaving ? 'Speichert...' : 'Profil speichern'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid gap-3 text-sm text-slate-700 sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Name</p>
                    <p className="mt-1 text-sm font-semibold text-slate-800">{buildDisplayName(profile)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">E-Mail</p>
                    <p className="mt-1 text-sm text-slate-700">{profile.email}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Benutzername</p>
                    <p className="mt-1 text-sm text-slate-700">{profile.username}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Initiative</p>
                    <p className="mt-1 text-sm text-slate-700">{profile.initiative?.name ?? 'Nicht gesetzt'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Telefonnummer</p>
                    <p className="mt-1 text-sm text-slate-700">{profile.telefonnummer ?? 'Nicht gesetzt'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Führerscheinklasse</p>
                    <p className="mt-1 text-sm text-slate-700">{profile.fuehrerscheinklasse ?? 'Nicht gesetzt'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Letzte G25</p>
                    <p className="mt-1 text-sm text-slate-700">{formatDateInput(profile.letzteG25) || 'Nicht gesetzt'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Nächste G25</p>
                    <p className="mt-1 text-sm text-slate-700">{formatDateInput(profile.naechsteG25) || 'Nicht gesetzt'}</p>
                  </div>
                  <div className="sm:col-span-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Adresse</p>
                    <p className="mt-1 text-sm text-slate-700">
                      {[profile.strasse, profile.postleitzahl, profile.ort].filter(Boolean).join(', ') || 'Nicht gesetzt'}
                    </p>
                  </div>
                  <div className="sm:col-span-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Rollen</p>
                    <p className="mt-1 text-sm text-slate-700">{describeRoles(profile)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Fahrerprofil</p>
                    <p className="mt-1 text-sm text-slate-700">
                      {profile.fahrer ? `ID ${profile.fahrer.id}` : 'Nicht vorhanden'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Aktiv</p>
                    <p className="mt-1 text-sm text-slate-700">{profile.aktiv ? 'Ja' : 'Nein'}</p>
                  </div>
                  <div className="sm:col-span-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Bemerkung</p>
                    <p className="mt-1 text-sm text-slate-700">{profile.bemerkung ?? 'Keine Bemerkung'}</p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-slate-500">Kein Profil geladen.</p>
          )}

          <div className="mt-6 flex justify-end">
            <button
              type="button"
              onClick={() => navigate('/rollenverteilung')}
              className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Zurück zur Rollenverteilung
            </button>
          </div>
        </section>
      </div>

      <ProtectedSideMenu isOpen={isSideMenuOpen} onClose={() => setIsSideMenuOpen(false)} />
    </main>
  )
}

export default UserProfilePage

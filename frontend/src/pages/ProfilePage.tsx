import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { PasswordChangeForm } from '../features/profile/components/PasswordChangeForm'
import { ProfileActions } from '../features/profile/components/ProfileActions'
import { ProfileHeader } from '../features/profile/components/ProfileHeader'
import { ProfileInfoCard } from '../features/profile/components/ProfileInfoCard'
import type { PasswordFormData, ProfileFormData } from '../features/profile/types'
import { formatDateInput } from '../features/profile/utils'
import { useRoleVisibility } from '../hooks/useRoleVisibility'
import { changePassword, updateUserProfile } from '../services/profile'
import { isPasswordLongEnough } from '../utils/password'
import { useAuth } from '../context/AuthContext'

function ProfilePage() {
  const navigate = useNavigate()
  const { currentUser, isLoading, error, logout, refreshProfile } = useAuth()
  const { canManageInitiatives, isFahrer } = useRoleVisibility()
  const [isSideMenuOpen, setIsSideMenuOpen] = useState(false)
  const [isAccountActive, setIsAccountActive] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [changePasswordError, setChangePasswordError] = useState<string | null>(null)
  const [changePasswordSuccess, setChangePasswordSuccess] = useState<string | null>(null)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const [formData, setFormData] = useState<ProfileFormData>({
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

  const [passwordForm, setPasswordForm] = useState<PasswordFormData>({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: '',
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
    setChangePasswordError(null)
    setChangePasswordSuccess(null)
    setPasswordForm({
      currentPassword: '',
      newPassword: '',
      confirmNewPassword: '',
    })
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

  function handleLogout() {
    closeSideMenu()
    logout()
    navigate('/', { replace: true })
  }

  function handleInputChange(field: keyof ProfileFormData, value: string) {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))

    if (field === 'phone') {
      const phoneRegex = /^[\d\s+()/-]*$/
      setPhoneError(value && !phoneRegex.test(value) ? 'Ungültige Telefonnummer' : '')
    }
  }

  function handlePasswordInputChange(field: keyof PasswordFormData, value: string) {
    setPasswordForm((prev) => ({ ...prev, [field]: value }))
    setChangePasswordError(null)
    setChangePasswordSuccess(null)
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

  async function handleChangePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const currentPassword = passwordForm.currentPassword.trim()
    const newPassword = passwordForm.newPassword.trim()
    const confirmNewPassword = passwordForm.confirmNewPassword.trim()

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      setChangePasswordError('Bitte alle Passwortfelder ausfüllen.')
      return
    }

    if (newPassword === currentPassword) {
      setChangePasswordError('Neues Passwort darf nicht dem aktuellen Passwort entsprechen.')
      return
    }

    if (newPassword !== confirmNewPassword) {
      setChangePasswordError('Neues Passwort und Bestätigung stimmen nicht überein.')
      return
    }

    if (!isPasswordLongEnough(newPassword)) {
      setChangePasswordError('Das neue Passwort muss mindestens 6 Zeichen lang sein.')
      return
    }

    setIsChangingPassword(true)
    setChangePasswordError(null)
    setChangePasswordSuccess(null)

    try {
      const response = await changePassword({
        currentPassword,
        newPassword,
      })

      setChangePasswordSuccess(response.message || 'Passwort wurde erfolgreich geändert.')
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: '',
      })
    } catch (err) {
      setChangePasswordError(err instanceof Error ? err.message : 'Passwort konnte nicht geändert werden.')
    } finally {
      setIsChangingPassword(false)
    }
  }

  function handleDeleteProfile() {
    window.confirm('Möchten Sie dieses Profil wirklich löschen?')
  }

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">
      <ProfileHeader
        isSideMenuOpen={isSideMenuOpen}
        canManageInitiatives={canManageInitiatives}
        isFahrer={isFahrer}
        onOpenSideMenu={() => setIsSideMenuOpen(true)}
        onCloseSideMenu={closeSideMenu}
        onNavigateToProfile={() => navigate('/profil')}
        onNavigateToPage={goToPage}
      />

      <div className="p-2 sm:p-3 lg:p-4">
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <ProfileInfoCard
            error={error}
            saveSuccess={saveSuccess}
            saveError={saveError}
            isLoading={isLoading}
            hasCurrentUser={Boolean(currentUser)}
            userRoles={userRoles}
            userId={userId}
            initiativeName={initiativeName}
            formData={formData}
            phoneError={phoneError}
            isAccountActive={isAccountActive}
            onInputChange={handleInputChange}
            onAccountActiveChange={setIsAccountActive}
          />

          <PasswordChangeForm
            passwordForm={passwordForm}
            showCurrentPassword={showCurrentPassword}
            showNewPassword={showNewPassword}
            showConfirmPassword={showConfirmPassword}
            changePasswordSuccess={changePasswordSuccess}
            changePasswordError={changePasswordError}
            isChangingPassword={isChangingPassword}
            onSubmit={handleChangePassword}
            onPasswordFormChange={handlePasswordInputChange}
            onToggleCurrentPassword={() => setShowCurrentPassword((value) => !value)}
            onToggleNewPassword={() => setShowNewPassword((value) => !value)}
            onToggleConfirmPassword={() => setShowConfirmPassword((value) => !value)}
          />

          <ProfileActions
            isSaving={isSaving}
            onLogout={handleLogout}
            onDeleteProfile={handleDeleteProfile}
            onSaveProfile={handleSaveProfile}
          />
        </section>
      </div>
    </main>
  )
}

export default ProfilePage

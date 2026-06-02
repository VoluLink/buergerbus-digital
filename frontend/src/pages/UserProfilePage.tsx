import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, UserRound } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import UserMenuButton from '../components/UserMenuButton'
import { fetchUserProfile } from '../services/users'
import type { UserProfile } from '../types/UserProfile'

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
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

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
          {isLoading ? (
            <p className="text-sm text-slate-500">Profil wird geladen...</p>
          ) : error ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          ) : profile ? (
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
    </main>
  )
}

export default UserProfilePage

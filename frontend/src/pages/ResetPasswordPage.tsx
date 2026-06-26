import { useState, type FormEvent } from 'react'
import { ChevronLeft, LockKeyhole } from 'lucide-react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { resetPassword } from '../services/passwordReset'
import { isPasswordLongEnough } from '../utils/password'
import { Eye, EyeOff } from 'lucide-react'

function ResetPasswordPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') ?? ''
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const trimmedPassword = password.trim()
    const trimmedConfirmPassword = confirmPassword.trim()

    if (!token) {
      setError('Der Reset-Link ist ungültig oder unvollständig.')
      return
    }

    if (!trimmedPassword || !trimmedConfirmPassword) {
      setError('Bitte beide Passwortfelder ausfüllen.')
      return
    }

    if (trimmedPassword !== trimmedConfirmPassword) {
      setError('Die Passwörter stimmen nicht überein.')
      return
    }

    if (!isPasswordLongEnough(trimmedPassword)) {
      setError('Das Passwort muss mindestens 6 Zeichen lang sein.')
      return
    }

    setError(null)
    setIsSubmitting(true)

    try {
      await resetPassword({ token, newPassword: trimmedPassword })
      setSuccessMessage('Passwort wurde erfolgreich zurückgesetzt. Du wirst zur Anmeldung weitergeleitet.')
      window.setTimeout(() => {
        navigate('/', { replace: true })
      }, 1800)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Passwort konnte nicht zurückgesetzt werden.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-white px-5 py-8 text-slate-900 sm:px-6 lg:px-8">
      <div className="relative flex min-h-[calc(100vh-4rem)] w-full items-center justify-center">
        <section className="w-full max-w-md">
          <div className="w-full rounded-[2rem] border border-sky-100 bg-white p-6 shadow-[0_30px_80px_rgba(14,116,144,0.12)] sm:p-8">
            <div className="mb-8 space-y-4">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 text-sky-700">
                <LockKeyhole className="h-6 w-6" aria-hidden="true" />
              </div>

              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-700">
                  Bürgerbus Digital
                </p>
                <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">
                  Neues Passwort setzen
                </h1>
                <p className="mt-3 text-sm leading-6 text-slate-500 sm:text-base">
                  Gib ein neues, sicheres Passwort für dein Konto ein.
                </p>
              </div>
            </div>

            {!token ? (
              <p className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                Der Reset-Link ist ungültig oder unvollständig.
              </p>
            ) : null}

            <form className="mt-6 space-y-4" onSubmit={handleSubmit} noValidate>
              <div className="space-y-2">
                <label htmlFor="new-password" className="text-sm font-medium text-slate-700">
                  Neues Passwort
                </label>

                <div className="relative">
                  <input
                    id="new-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={password}
                    onChange={(event) => {
                      setPassword(event.target.value)
                      if (error) {
                        setError(null)
                      }
                    }}
                    placeholder="Neues Passwort eingeben"
                    aria-invalid={Boolean(error)}
                    className="w-full rounded-2xl border border-sky-200 bg-white px-4 py-4 pr-12 text-base text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="confirm-password" className="text-sm font-medium text-slate-700">
                  Passwort wiederholen
                </label>

                <div className="relative">
                  <input
                    id="confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(event) => {
                      setConfirmPassword(event.target.value)
                      if (error) {
                        setError(null)
                      }
                    }}
                    placeholder="Passwort wiederholen"
                    aria-invalid={Boolean(error)}
                    className="w-full rounded-2xl border border-sky-200 bg-white px-4 py-4 pr-12 text-base text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                  />

                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((v) => !v)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              {error ? (
                <p className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {error}
                </p>
              ) : null}

              {successMessage ? (
                <p className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  {successMessage}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={isSubmitting || !token}
                className="w-full rounded-full bg-sky-600 px-6 py-4 text-base font-semibold text-white shadow-[0_18px_40px_rgba(2,132,199,0.15)] transition hover:bg-sky-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-sky-200 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? 'Passwort wird gesetzt...' : 'Passwort speichern'}
              </button>
            </form>

            <div className="mt-8 flex justify-center">
              <Link
                to="/"
                className="inline-flex items-center gap-2 text-sm font-medium text-sky-700 transition hover:text-sky-800 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-200"
              >
                <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                Zurück zum Login
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}

export default ResetPasswordPage
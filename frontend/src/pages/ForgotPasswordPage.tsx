import { useState, type FormEvent } from 'react'
import { Bus, ChevronLeft } from 'lucide-react'
import { Link } from 'react-router-dom'

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const trimmedEmail = email.trim().toLowerCase()

    setSuccessMessage(null)

    if (!trimmedEmail) {
      setError('Bitte E-Mail-Adresse eingeben.')
      return
    }

    if (!emailPattern.test(trimmedEmail)) {
      setError('Bitte eine gültige E-Mail-Adresse eingeben.')
      return
    }

    setError(null)
    setSuccessMessage(
      'Die Passwort-Zurücksetzung ist noch nicht aktiv. Die eingegebene E-Mail-Adresse wurde nur im Frontend geprüft.',
    )
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-white px-5 py-8 text-slate-900 sm:px-6 lg:px-8">
      <div className="relative flex min-h-[calc(100vh-4rem)] w-full items-center justify-center">
        <section className="w-full max-w-md">
          <div className="w-full rounded-[2rem] border border-sky-100 bg-white p-6 shadow-[0_30px_80px_rgba(14,116,144,0.12)] sm:p-8">
            <div className="mb-8 space-y-4">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 text-sky-700">
                <Bus className="h-6 w-6" aria-hidden="true" />
              </div>

              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-700">
                  Bürgerbus Digital
                </p>
                <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">
                  Passwort vergessen
                </h1>
                <p className="mt-3 text-sm leading-6 text-slate-500 sm:text-base">
                  Aktuell gibt es noch keinen Versand von E-Mails und keine Backend-Anbindung.
                </p>
              </div>
            </div>

            <form className="mt-6 space-y-4" onSubmit={handleSubmit} noValidate>
              <div className="space-y-2">
                <label
                  htmlFor="forgot-password-email"
                  className="text-sm font-medium text-slate-700"
                >
                  E-Mail-Adresse
                </label>
                <input
                  id="forgot-password-email"
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value)
                    if (error) {
                      setError(null)
                    }
                  }}
                  placeholder="name@beispiel.de"
                  aria-invalid={Boolean(error)}
                  aria-describedby={error ? 'forgot-password-email-error' : undefined}
                  className="w-full rounded-2xl border border-sky-200 bg-white px-4 py-4 text-base text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                />
                {error ? (
                  <p id="forgot-password-email-error" className="text-sm text-rose-600">
                    {error}
                  </p>
                ) : null}
              </div>

              {successMessage ? (
                <p className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  {successMessage}
                </p>
              ) : null}

              <button
                type="submit"
                className="w-full rounded-full bg-sky-600 px-6 py-4 text-base font-semibold text-white shadow-[0_18px_40px_rgba(2,132,199,0.15)] transition hover:bg-sky-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-sky-200"
              >
                Link anfordern
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

export default ForgotPasswordPage
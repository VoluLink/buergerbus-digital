import { useState } from 'react'
import { Bus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import LoginForm from '../components/LoginForm'
import type { LoginCredentials } from '../types/Login'
import { useAuth } from '../context/AuthContext'

function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  async function handleLogin(credentials: LoginCredentials) {
    setIsSubmitting(true)
    setSubmitError(null)

    try {
      await login(credentials)
      navigate('/dashboard')
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : 'Login konnte nicht abgeschlossen werden.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-white px-5 py-8 text-slate-900 sm:px-6 lg:px-8">


      <div className="relative flex min-h-[calc(100vh-4rem)] w-full items-center justify-center">
        <section className="w-full max-w-md">
          <div className="w-full rounded-[2rem] border border-[#0053a0]/15 bg-white p-6 shadow-[0_30px_80px_rgba(0,83,160,0.16)] sm:p-8">
            <div className="mb-8 space-y-3">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0053a0]/10 text-[#0053a0]">
                <Bus className="h-6 w-6" aria-hidden="true" />
              </div>

              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#0053a0]">
                  Bürgerbus Digital
                </p>
                <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">
                  Login
                </h1>
                <p className="mt-3 text-sm leading-6 text-slate-500 sm:text-base">
                  Melde dich mit deiner E-Mail-Adresse an.
                </p>
              </div>
            </div>

            <LoginForm
              isSubmitting={isSubmitting}
              submitError={submitError}
              onSubmit={handleLogin}
            />
          </div>
        </section>
      </div>
    </main>
  )
}

export default LoginPage
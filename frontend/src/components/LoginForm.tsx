import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import type { LoginCredentials, LoginErrors } from '../types/Login'
import { Eye, EyeOff } from 'lucide-react'

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

type LoginFormProps = {
  isSubmitting?: boolean
  submitError?: string | null
  submitSuccess?: string | null
  onSubmit?: (credentials: LoginCredentials) => Promise<void> | void
}

const initialValues: LoginCredentials = {
  email: '',
  password: '',
}

function LoginForm({
  isSubmitting = false,
  submitError = null,
  submitSuccess = null,
  onSubmit,
}: LoginFormProps) {
  const [values, setValues] = useState<LoginCredentials>(initialValues)
  const [errors, setErrors] = useState<LoginErrors>({})
  const [showPassword, setShowPassword] = useState(false)

  function updateValue(field: keyof LoginCredentials, nextValue: string) {
    setValues((currentValues) => ({
      ...currentValues,
      [field]: nextValue,
    }))

    setErrors((currentErrors) => {
      if (!currentErrors[field]) {
        return currentErrors
      }

      return {
        ...currentErrors,
        [field]: undefined,
      }
    })
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const trimmedEmail = values.email.trim().toLowerCase()
    const nextErrors: LoginErrors = {}

    if (!trimmedEmail) {
      nextErrors.email = 'Bitte E-Mail-Adresse eingeben.'
    } else if (!emailPattern.test(trimmedEmail)) {
      nextErrors.email = 'Bitte eine gültige E-Mail-Adresse eingeben.'
    }

    if (!values.password.trim()) {
      nextErrors.password = 'Bitte Passwort eingeben.'
    }

    setErrors(nextErrors)

    if (Object.keys(nextErrors).length > 0) {
      return
    }

    const nextValues: LoginCredentials = {
      email: trimmedEmail,
      password: values.password.trim(),
    }

    if (onSubmit) {
      await onSubmit(nextValues)
      return
    }

    console.log('Login submitted', { email: nextValues.email })
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit} noValidate>
      <div className="space-y-2">
        <label
          htmlFor="login-email"
          className="text-sm font-medium text-slate-700"
        >
          E-Mail-Adresse
        </label>
        <input
          id="login-email"
          type="email"
          autoComplete="email"
          inputMode="email"
          value={values.email}
          onChange={(event) => updateValue('email', event.target.value)}
          placeholder="name@beispiel.de"
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? 'login-email-error' : undefined}
          className="w-full rounded-2xl border border-[#0053a0]/25 bg-white px-4 py-4 text-base text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-[#0053a0] focus:ring-4 focus:ring-[#0053a0]/15"
        />
        {errors.email ? (
          <p id="login-email-error" className="text-sm text-rose-600">
            {errors.email}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <label
          htmlFor="login-password"
          className="text-sm font-medium text-slate-700"
        >
          Passwort
        </label>
        <div className="relative">
          <input
            id="login-password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            value={values.password}
            onChange={(event) => updateValue('password', event.target.value)}
            placeholder="Passwort eingeben"
            aria-invalid={Boolean(errors.password)}
            aria-describedby={errors.password ? 'login-password-error' : undefined}
            className="w-full rounded-2xl border border-[#0053a0]/25 bg-white px-4 py-4 pr-12 text-base text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-[#0053a0] focus:ring-4 focus:ring-[#0053a0]/15"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
          >
            {showPassword ? (
              <EyeOff className="h-5 w-5" />
            ) : (
              <Eye className="h-5 w-5" />
            )}
          </button>
        </div>
        {errors.password ? (
          <p id="login-password-error" className="text-sm text-rose-600">
            {errors.password}
          </p>
        ) : null}
      </div>

      {submitError ? (
        <p className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {submitError}
        </p>
      ) : null}

      {submitSuccess ? (
        <p className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {submitSuccess}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-full bg-[#0053a0] px-6 py-4 text-base font-semibold text-white shadow-[0_18px_40px_rgba(0,83,160,0.2)] transition hover:brightness-95 focus:outline-none focus-visible:ring-4 focus-visible:ring-[#0053a0]/20"
      >
        {isSubmitting ? 'Login wird geprüft...' : 'Login'}
      </button>

      <div className="flex justify-center">
        <Link
          to="/passwort-vergessen"
          className="text-sm font-medium text-[#0053a0] transition hover:brightness-90 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0053a0]/20"
        >
          Passwort vergessen
        </Link>
      </div>
    </form>
  )
}

export default LoginForm
import { Eye, EyeOff } from 'lucide-react'
import type { FormEvent } from 'react'
import type { PasswordFormData } from '../types'

type PasswordChangeFormProps = {
  passwordForm: PasswordFormData
  showCurrentPassword: boolean
  showNewPassword: boolean
  showConfirmPassword: boolean
  changePasswordSuccess: string | null
  changePasswordError: string | null
  isChangingPassword: boolean
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onPasswordFormChange: (field: keyof PasswordFormData, value: string) => void
  onToggleCurrentPassword: () => void
  onToggleNewPassword: () => void
  onToggleConfirmPassword: () => void
}

export function PasswordChangeForm({
  passwordForm,
  showCurrentPassword,
  showNewPassword,
  showConfirmPassword,
  changePasswordSuccess,
  changePasswordError,
  isChangingPassword,
  onSubmit,
  onPasswordFormChange,
  onToggleCurrentPassword,
  onToggleNewPassword,
  onToggleConfirmPassword,
}: PasswordChangeFormProps) {
  return (
    <div className="mt-6 border-t border-slate-200 pt-5">
      <div className="mb-4">
        <h2 className="text-lg font-bold text-slate-800 sm:text-xl">Passwort ändern</h2>
        <p className="mt-1 text-sm text-slate-500">
          Verwenden Sie ein neues Passwort mit mindestens 6 Zeichen.
        </p>
      </div>

      <form className="grid gap-4 lg:grid-cols-2" onSubmit={onSubmit} noValidate>
        <div className="relative lg:col-span-2">
          <label htmlFor="currentPassword" className="block text-xs font-semibold text-slate-700">
            Aktuelles Passwort
          </label>

          <input
            id="currentPassword"
            type={showCurrentPassword ? 'text' : 'password'}
            autoComplete="current-password"
            value={passwordForm.currentPassword}
            onChange={(event) => onPasswordFormChange('currentPassword', event.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 pr-10 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#0053a0] focus:ring-2 focus:ring-[#0053a0]/15"
          />

          <button
            type="button"
            onClick={onToggleCurrentPassword}
            className="absolute right-3 top-9 text-slate-500 hover:text-slate-700"
          >
            {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>

        <div className="relative">
          <label htmlFor="newPassword" className="block text-xs font-semibold text-slate-700">
            Neues Passwort
          </label>

          <input
            id="newPassword"
            type={showNewPassword ? 'text' : 'password'}
            autoComplete="new-password"
            value={passwordForm.newPassword}
            onChange={(event) => onPasswordFormChange('newPassword', event.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 pr-10 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#0053a0] focus:ring-2 focus:ring-[#0053a0]/15"
          />

          <button
            type="button"
            onClick={onToggleNewPassword}
            className="absolute right-3 top-9 text-slate-500 hover:text-slate-700"
          >
            {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>

        <div className="relative">
          <label
            htmlFor="confirmNewPassword"
            className="block text-xs font-semibold text-slate-700"
          >
            Neues Passwort bestätigen
          </label>

          <input
            id="confirmNewPassword"
            type={showConfirmPassword ? 'text' : 'password'}
            autoComplete="new-password"
            value={passwordForm.confirmNewPassword}
            onChange={(event) => onPasswordFormChange('confirmNewPassword', event.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 pr-10 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#0053a0] focus:ring-2 focus:ring-[#0053a0]/15"
          />

          <button
            type="button"
            onClick={onToggleConfirmPassword}
            className="absolute right-3 top-9 text-slate-500 hover:text-slate-700"
          >
            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>

        {changePasswordSuccess ? (
          <p className="lg:col-span-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {changePasswordSuccess}
          </p>
        ) : null}

        {changePasswordError ? (
          <p className="lg:col-span-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {changePasswordError}
          </p>
        ) : null}

        <div className="lg:col-span-2 flex justify-end">
          <button
            type="submit"
            disabled={isChangingPassword}
            className={`inline-flex items-center gap-2 rounded-lg bg-[#0053a0] px-4 py-2 text-xs font-semibold text-white shadow-md transition hover:brightness-105 ${
              isChangingPassword ? 'cursor-not-allowed opacity-60' : ''
            }`}
          >
            {isChangingPassword ? 'Ändere...' : 'Passwort ändern'}
          </button>
        </div>
      </form>
    </div>
  )
}

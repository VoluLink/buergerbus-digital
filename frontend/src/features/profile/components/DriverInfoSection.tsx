import type { ProfileFormData } from '../types'

type DriverInfoSectionProps = {
  formData: ProfileFormData
  onInputChange: (field: keyof ProfileFormData, value: string) => void
}

export function DriverInfoSection({ formData, onInputChange }: DriverInfoSectionProps) {
  return (
    <>
      <div>
        <label htmlFor="driverLicense" className="block text-xs font-semibold text-slate-700">
          Führerscheinklasse
        </label>
        <input
          id="driverLicense"
          type="text"
          value={formData.driverLicense}
          onChange={(e) => onInputChange('driverLicense', e.target.value)}
          placeholder="z. B. B, BE, D1"
          className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#0053a0] focus:ring-2 focus:ring-[#0053a0]/15"
        />
      </div>

      <div>
        <label htmlFor="lastG2s" className="block text-xs font-semibold text-slate-700">
          Letzte G2S
        </label>
        <input
          id="lastG2s"
          type="date"
          value={formData.lastG2s}
          onChange={(e) => onInputChange('lastG2s', e.target.value)}
          className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-[#0053a0] focus:ring-2 focus:ring-[#0053a0]/15"
        />
      </div>

      <div>
        <label htmlFor="nextG2s" className="block text-xs font-semibold text-slate-700">
          Nächste G2S
        </label>
        <input
          id="nextG2s"
          type="date"
          value={formData.nextG2s}
          onChange={(e) => onInputChange('nextG2s', e.target.value)}
          className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-[#0053a0] focus:ring-2 focus:ring-[#0053a0]/15"
        />
      </div>
    </>
  )
}

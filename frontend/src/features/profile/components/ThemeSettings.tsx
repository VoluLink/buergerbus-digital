import { Laptop, Moon, Sun } from 'lucide-react'
import { type ThemePreference, useTheme } from '../../../context/ThemeContext'

const options: Array<{ value: ThemePreference; label: string; Icon: typeof Sun }> = [
  { value: 'system', label: 'System', Icon: Laptop },
  { value: 'light', label: 'Hell', Icon: Sun },
  { value: 'dark', label: 'Dunkel', Icon: Moon },
]

export function ThemeSettings() {
  const { preference, setPreference } = useTheme()
  return (
    <section className="mt-8 border-t border-slate-200 pt-6">
      <h2 className="text-lg font-bold text-slate-800">Darstellung</h2>
      <p className="mt-1 text-sm text-slate-500">Wähle, ob die Anwendung dem Gerät folgt oder immer hell beziehungsweise dunkel angezeigt wird.</p>
      <div className="mt-4 grid grid-cols-3 gap-2 rounded-2xl bg-slate-100 p-1.5" role="radiogroup" aria-label="Farbschema auswählen">
        {options.map(({ value, label, Icon }) => {
          const isSelected = preference === value
          return <button key={value} type="button" role="radio" aria-checked={isSelected} onClick={() => setPreference(value)} className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0053a0] ${isSelected ? 'bg-white text-[#0053a0] shadow-sm dark:bg-slate-700 dark:text-white' : 'text-slate-600 hover:bg-white/70 dark:text-slate-300 dark:hover:bg-slate-700/60'}`}>
            <Icon className="h-4 w-4" aria-hidden="true" />{label}
          </button>
        })}
      </div>
    </section>
  )
}

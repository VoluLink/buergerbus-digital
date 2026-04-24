import { Bus } from 'lucide-react'

function Header() {
  return (
    <header className="rounded-xl bg-white px-6 py-4 shadow-sm ring-1 ring-slate-200">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-lg font-semibold tracking-tight text-slate-900">
            <Bus className="h-5 w-5 text-slate-500" aria-hidden="true" />
            Bürgerbus Digital
          </h1>
        <p className="mt-1 text-sm text-slate-600">
          Übersicht, Fahrten und Fahrer verwalten
        </p>
        </div>
      </div>
    </header>
  )
}

export default Header
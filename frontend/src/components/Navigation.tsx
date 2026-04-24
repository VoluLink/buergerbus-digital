import { Home, Map, Users, Bus } from 'lucide-react'
import { NavLink } from 'react-router-dom'

const baseItemClassName =
  'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium transition hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400'

function navItemClassName(isActive: boolean) {
  return isActive
    ? `${baseItemClassName} bg-slate-100 text-slate-900`
    : `${baseItemClassName} text-slate-700`
}

function Navigation() {
  const iconClassName = 'h-4 w-4 text-slate-500'

  return (
    <nav aria-label="Hauptnavigation" className="space-y-1">
      <div className="px-1 pb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
        Navigation
      </div>

      <NavLink
        to="/"
        end
        className={({ isActive }) => navItemClassName(isActive)}
      >
        <Home className={iconClassName} aria-hidden="true" />
        Dashboard
      </NavLink>

      <NavLink
        to="/fahrten"
        className={({ isActive }) => navItemClassName(isActive)}
      >
        <Map className={iconClassName} aria-hidden="true" />
        Fahrten
      </NavLink>

      <NavLink
        to="/fahrer"
        className={({ isActive }) => navItemClassName(isActive)}
      >
        <Users className={iconClassName} aria-hidden="true" />
        Fahrer
      </NavLink>

      <div className="mt-3 rounded-lg bg-slate-50 p-3 text-xs text-slate-600 ring-1 ring-slate-200">
        <div className="flex items-center gap-2 font-medium text-slate-900">
          <Bus className="h-4 w-4 text-slate-500" aria-hidden="true" />
          Bürgerbus
        </div>
        <div className="mt-1">Demo-Frontend mit Tailwind + Router.</div>
      </div>
    </nav>
  )
}

export default Navigation
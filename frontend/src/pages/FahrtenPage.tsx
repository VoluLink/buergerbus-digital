import { fahrtenDaten } from '../services/api'

function FahrtenPage() {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold tracking-tight text-slate-900">
          Fahrten
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Geplante Fahrten mit Start- und Zielort.
        </p>
      </div>

      <div className="overflow-hidden rounded-lg ring-1 ring-slate-200">
        <ul className="divide-y divide-slate-200 bg-white">
          {fahrtenDaten.map((fahrt) => (
            <li key={fahrt.id} className="px-4 py-3">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-slate-900">
                    {fahrt.startort} <span className="text-slate-400">→</span> {fahrt.zielort}
                  </div>
                  <div className="mt-0.5 text-sm text-slate-600">Datum</div>
                </div>
                <div className="shrink-0 rounded-md bg-slate-50 px-2 py-1 text-sm font-medium tabular-nums text-slate-900 ring-1 ring-slate-200">
                  {fahrt.datum}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

export default FahrtenPage
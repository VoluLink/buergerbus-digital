function DashboardPage() {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold tracking-tight text-slate-900">
          Dashboard
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Willkommen im Bürgerbus-System. Nutze links die Navigation, um zu Fahrten oder Fahrern zu wechseln.
        </p>
      </div>

      <div className="rounded-lg bg-slate-50 p-4 ring-1 ring-slate-200">
        <div className="text-sm font-medium text-slate-900">Tipp</div>
        <p className="mt-1 text-sm text-slate-600">
          In <span className="font-medium text-slate-900">Fahrten</span> siehst du die geplanten Strecken.
          In <span className="font-medium text-slate-900">Fahrer</span> findest du Kontaktdaten.
        </p>
      </div>
    </section>
  )
}

export default DashboardPage
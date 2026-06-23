import { Settings, FileText, Link2, ChevronLeft } from 'lucide-react'
import { Link } from 'react-router-dom'

function AdminSettingsPage() {
  return (
    <main className="min-h-screen bg-slate-100 px-5 py-8 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_30px_80px_rgba(15,23,42,0.08)]">
          <div className="border-b border-slate-200 px-6 py-5 sm:px-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#0053a0]">Einstellungen</p>
                <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">Seiten & Footer</h1>
                <p className="mt-3 text-sm leading-6 text-slate-500">Öffentliche Inhalte und Login-Footer zentral verwalten.</p>
              </div>

              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                Zum Dashboard
              </Link>
            </div>
          </div>

          <div className="grid gap-4 px-6 py-6 sm:grid-cols-2 lg:px-8">
            <Link
              to="/admin/seiten"
              className="group rounded-3xl border border-slate-200 bg-slate-50 p-6 transition hover:border-[#0053a0]/30 hover:bg-[#0053a0]/5"
            >
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0053a0]/10 text-[#0053a0]">
                <FileText className="h-5 w-5" aria-hidden="true" />
              </div>
              <h2 className="mt-4 text-xl font-semibold text-slate-900">Seiten</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">Impressum, Datenschutz, Kontakt und weitere öffentliche Seiten.</p>
            </Link>

            <Link
              to="/admin/footer-links"
              className="group rounded-3xl border border-slate-200 bg-slate-50 p-6 transition hover:border-[#0053a0]/30 hover:bg-[#0053a0]/5"
            >
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0053a0]/10 text-[#0053a0]">
                <Link2 className="h-5 w-5" aria-hidden="true" />
              </div>
              <h2 className="mt-4 text-xl font-semibold text-slate-900">Footer</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">Interne und externe Footer-Links für die Login-Seite pflegen.</p>
            </Link>
          </div>
        </section>
      </div>
    </main>
  )
}

export default AdminSettingsPage
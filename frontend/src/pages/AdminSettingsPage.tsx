import { useEffect, useState } from 'react'
import { FileText, Link2, ChevronLeft, Menu } from 'lucide-react'
import { Link } from 'react-router-dom'
import ProtectedSideMenu from '../components/ProtectedSideMenu'
import { getSettings, saveSettings, type Settings } from '../services/settingsApi'

function AdminSettingsPage() {
  const [isSideMenuOpen, setIsSideMenuOpen] = useState(false)
  const [settings, setSettings] = useState<Settings | null>(null)
  const [message, setMessage] = useState('')
  useEffect(() => { void getSettings().then(setSettings).catch(() => setMessage('Einstellungen konnten nicht geladen werden.')) }, [])
  async function save() { if (!settings) return; if (settings.temporaryParticipantRetentionDays < 1 || settings.temporaryParticipantRetentionDays > 365 || settings.defaultRideDurationMinutes < 15 || settings.defaultRideDurationMinutes > 1440) { setMessage('Bitte gültige Werte eingeben.'); return } try { setSettings(await saveSettings(settings)); setMessage('Einstellungen gespeichert.') } catch { setMessage('Einstellungen konnten nicht gespeichert werden.') } }

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

              <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
                <button
                  type="button"
                  onClick={() => setIsSideMenuOpen(true)}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                  aria-label="Navigation öffnen"
                >
                  <Menu className="h-4 w-4" aria-hidden="true" />
                  Navigation
                </button>
                <Link
                  to="/dashboard"
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                  Zum Dashboard
                </Link>
              </div>
            </div>
          </div>

          <div className="grid gap-4 px-6 py-6 sm:grid-cols-2 lg:px-8">
            <section className="sm:col-span-2 rounded-3xl border border-slate-200 bg-slate-50 p-6">
              <h2 className="text-xl font-semibold">Allgemeine Systemeinstellungen</h2>
              {settings ? <div className="mt-4 grid gap-4 sm:grid-cols-2"><label>Temporäre Teilnehmerdaten aufbewahren (1–365 Tage)<input type="number" min="1" max="365" value={settings.temporaryParticipantRetentionDays} onChange={e=>setSettings({...settings,temporaryParticipantRetentionDays:Number(e.target.value)})} className="mt-1 w-full rounded-xl border p-2"/></label><label>Standarddauer neuer Fahrten (15–1440 Minuten)<input type="number" min="15" max="1440" value={settings.defaultRideDurationMinutes} onChange={e=>setSettings({...settings,defaultRideDurationMinutes:Number(e.target.value)})} className="mt-1 w-full rounded-xl border p-2"/></label><label><input type="checkbox" checked={settings.enableDriverAssignmentEmails} onChange={e=>setSettings({...settings,enableDriverAssignmentEmails:e.target.checked})}/> E-Mail bei Fahrerzuweisung senden</label><label><input type="checkbox" checked={settings.enableSelfRegistrationEmails} onChange={e=>setSettings({...settings,enableSelfRegistrationEmails:e.target.checked})}/> E-Mail bei Selbstanmeldung senden</label><label><input type="checkbox" checked={settings.showDashboardNotifications} onChange={e=>setSettings({...settings,showDashboardNotifications:e.target.checked})}/> Administrative Mitteilungen im Dashboard anzeigen</label><button type="button" onClick={()=>void save()} className="rounded-xl bg-[#0053a0] px-4 py-2 text-white">Einstellungen speichern</button></div> : <p className="mt-4">Lade Einstellungen …</p>}{message&&<p className="mt-3 text-sm">{message}</p>}</section>
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

      <ProtectedSideMenu isOpen={isSideMenuOpen} onClose={() => setIsSideMenuOpen(false)} />
    </main>
  )
}

export default AdminSettingsPage

import { useEffect, useState } from 'react'
import { ArrowLeft, Eye, Menu, Pencil, RotateCcw, Save, Send, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import ProtectedSideMenu from '../components/ProtectedSideMenu'
import { apiFetch } from '../services/httpClient'

type Type = 'TripDriverAssigned' | 'TripSelfRegistered' | 'UserCreated'
type Template = { id: number; templateType: Type; subject: string; heading: string; intro: string; body: string; closing: string; signature: string; footer: string; updatedAtUtc: string }
type Preview = { subject: string; html: string; plainText: string }

const templates: Record<Type, { name: string; description: string; placeholders: string[] }> = {
  TripDriverAssigned: { name: 'Fahrerzuweisung', description: 'Bei Zuweisung einer Fahrt', placeholders: ['{{DriverName}}', '{{RideDate}}', '{{RideTime}}', '{{Destination}}', '{{InitiativeName}}'] },
  TripSelfRegistered: { name: 'Selbstanmeldung', description: 'Nach Anmeldung zu einer Fahrt', placeholders: ['{{DriverName}}', '{{RideDate}}', '{{RideTime}}', '{{Destination}}', '{{InitiativeName}}'] },
  UserCreated: { name: 'Account-Einladung', description: 'Bei Erstellung eines Benutzerkontos', placeholders: ['{{UserName}}', '{{ResetLink}}'] },
}

const types: Type[] = ['TripDriverAssigned', 'TripSelfRegistered', 'UserCreated']
const contentFields: (keyof Template)[] = ['subject', 'heading', 'intro', 'body', 'closing']
const senderFields: (keyof Template)[] = ['signature', 'footer']
const fieldLabels: Record<keyof Template, string> = { id: 'ID', templateType: 'Vorlagentyp', subject: 'Betreff', heading: 'Überschrift', intro: 'Einleitung', body: 'Haupttext', closing: 'Abschluss', signature: 'Signatur', footer: 'Fußzeile', updatedAtUtc: 'Letzte Änderung' }
const fieldClass = 'mt-1 min-h-20 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-normal text-slate-700 outline-none transition focus:border-[#0053a0] focus:ring-2 focus:ring-[#0053a0]/15'

function formatUpdatedAt(value: string | undefined) {
  if (!value) return 'Standardvorlage'
  const date = new Date(value)
  if (Number.isNaN(date.getTime()) || date.getFullYear() <= 1) return 'Standardvorlage'
  return date.toLocaleString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function fallbackTemplate(templateType: Type): Template {
  return { id: 0, templateType, subject: '', heading: '', intro: '', body: '', closing: '', signature: '', footer: '', updatedAtUtc: '' }
}

export default function EmailTemplatesPage() {
  const [menu, setMenu] = useState(false)
  const [items, setItems] = useState<Template[]>([])
  const [edit, setEdit] = useState<Template | null>(null)
  const [preview, setPreview] = useState<Preview | null>(null)
  const [test, setTest] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await apiFetch('/api/v1/admin/email/templates')
      if (!response.ok) throw new Error('Vorlagen konnten nicht geladen werden.')
      setItems(await response.json())
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : 'Vorlagen konnten nicht geladen werden.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void load() }, [])

  const save = async () => {
    if (!edit) return
    const response = await apiFetch(`/api/v1/admin/email/templates/${edit.templateType}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(edit) })
    if (!response.ok) { setError(await response.text()); return }
    setNotice('Vorlage gespeichert.')
    setEdit(null)
    await load()
  }

  const reset = async (type: Type) => {
    if (!confirm('Vorlage auf den Standard zurücksetzen?')) return
    const response = await apiFetch(`/api/v1/admin/email/templates/${type}/reset`, { method: 'POST' })
    if (!response.ok) { setError(await response.text()); return }
    setNotice('Standardvorlage aktiviert.')
    setEdit(null)
    await load()
  }

  const showPreview = async () => {
    if (!edit) return
    const response = await apiFetch(`/api/v1/admin/email/templates/${edit.templateType}/preview`, { method: 'POST' })
    if (!response.ok) { setError(await response.text()); return }
    setPreview(await response.json())
  }

  const sendTest = async () => {
    if (!edit || !test) return
    const response = await apiFetch(`/api/v1/admin/email/templates/${edit.templateType}/test-send?email=${encodeURIComponent(test)}`, { method: 'POST' })
    if (!response.ok) { setError(await response.text()); return }
    setNotice('Die Testmail wurde zur Versandwarteschlange hinzugefügt.')
    setTest('')
  }

  const getTemplate = (type: Type) => items.find((item) => item.templateType === type)

  return <main className="min-h-screen bg-slate-100 text-slate-900">
    <header className="border-b border-slate-200 bg-white/95 px-4 py-3 shadow-sm backdrop-blur sm:px-6">
      <button type="button" onClick={() => setMenu(true)} className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-50" aria-label="Navigation öffnen"><Menu className="h-5 w-5" /></button>
    </header>
    <div className="p-3 sm:p-4 lg:p-6">
      <header className="mb-6 px-1 sm:px-2">
        <Link to="/admin/email" className="inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-[#0053a0] transition hover:underline"><ArrowLeft className="h-4 w-4" />Zurück zu E-Mail</Link>
        <p className="mt-4 text-sm font-semibold uppercase tracking-[.2em] text-[#0053a0]">Administration / E-Mail / Vorlagen</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-800 sm:text-4xl">E-Mail-Vorlagen</h1>
        <p className="mt-2 text-sm text-slate-500">Automatische E-Mails bearbeiten, prüfen und als Test versenden.</p>
      </header>

      {error ? <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800"><span>{error}</span><button type="button" onClick={() => void load()} className="rounded-xl border border-rose-200 px-3 py-2 text-sm font-semibold">Erneut laden</button></div> : null}
      {notice ? <p className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{notice}</p> : null}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm sm:rounded-3xl">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 p-4 sm:p-6">
          <div><h2 className="text-xl font-bold text-slate-800">Automatische Vorlagen</h2><p className="mt-1 text-sm text-slate-500">Diese Vorlagen werden für systemseitig versendete E-Mails verwendet.</p></div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">3 Vorlagen</span>
        </div>
        <div className="p-4 sm:p-6">
          {loading ? <div className="space-y-3">{[1, 2, 3].map((row) => <div key={row} className="h-20 animate-pulse rounded-xl bg-slate-100" />)}</div> : null}
          {!loading && items.length === 0 ? <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center"><p className="font-semibold text-slate-800">Keine Vorlagen gefunden</p><p className="mt-1 text-sm text-slate-500">Die Übersicht wird angezeigt, sobald Vorlagen verfügbar sind.</p></div> : null}
          {!loading && items.length > 0 ? <>
            <div className="hidden overflow-x-auto md:block"><table className="w-full min-w-[760px] border-collapse text-sm"><thead><tr className="border-b border-slate-200 bg-slate-50 text-left text-slate-600"><th className="px-4 py-3 font-semibold">Vorlage</th><th className="px-4 py-3 font-semibold">Betreff</th><th className="px-4 py-3 font-semibold">Status</th><th className="px-4 py-3 font-semibold">Letzte Änderung</th><th className="px-4 py-3 text-right font-semibold">Aktionen</th></tr></thead><tbody>{types.map((type) => { const item = getTemplate(type); const customized = Boolean(item && item.id > 0); return <tr key={type} className="border-b border-slate-100 transition hover:bg-slate-50"><td className="px-4 py-4"><span className="block font-semibold text-slate-800">{templates[type].name}</span><span className="mt-1 block text-xs text-slate-500">{templates[type].description}</span></td><td className="max-w-xl px-4 py-4 text-slate-700"><span className="block truncate">{item?.subject || 'Standardvorlage'}</span></td><td className="px-4 py-4"><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">{customized ? 'Angepasst' : 'Standard'}</span></td><td className="whitespace-nowrap px-4 py-4 text-slate-600">{formatUpdatedAt(item?.updatedAtUtc)}</td><td className="px-4 py-4 text-right"><button type="button" onClick={() => setEdit(item ?? fallbackTemplate(type))} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"><Pencil className="h-4 w-4" />Bearbeiten</button></td></tr> })}</tbody></table></div>
            <div className="space-y-3 md:hidden">{types.map((type) => { const item = getTemplate(type); const customized = Boolean(item && item.id > 0); return <article key={type} className="rounded-2xl border border-slate-200 p-4"><div className="flex items-start justify-between gap-3"><div><h3 className="font-semibold text-slate-800">{templates[type].name}</h3><p className="mt-1 text-xs text-slate-500">{templates[type].description}</p></div><span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">{customized ? 'Angepasst' : 'Standard'}</span></div><p className="mt-4 text-sm text-slate-700">{item?.subject || 'Standardvorlage'}</p><p className="mt-2 text-xs text-slate-500">{formatUpdatedAt(item?.updatedAtUtc)}</p><button type="button" onClick={() => setEdit(item ?? fallbackTemplate(type))} className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700"><Pencil className="h-4 w-4" />Bearbeiten</button></article> })}</div>
          </> : null}
        </div>
      </section>
    </div>

    {edit ? <div className="fixed inset-0 z-40 overflow-y-auto bg-slate-900/50 p-3 sm:p-6"><section className="mx-auto my-3 w-full max-w-6xl rounded-2xl bg-white shadow-xl"><header className="flex items-start justify-between gap-4 border-b border-slate-200 p-5 sm:p-6"><div><p className="text-sm font-semibold uppercase tracking-[.2em] text-[#0053a0]">E-Mail-Vorlage</p><h2 className="mt-1 text-xl font-bold text-slate-800">{templates[edit.templateType].name} bearbeiten</h2><p className="mt-1 text-sm text-slate-500">Inhalte, Betreff und Platzhalter dieser automatischen E-Mail anpassen.</p></div><button type="button" onClick={() => setEdit(null)} className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-50" aria-label="Dialog schließen"><X className="h-5 w-5" /></button></header><div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_260px]"><div className="space-y-6"><FieldGroup title="Inhalt" fields={contentFields} edit={edit} onChange={setEdit} /><FieldGroup title="Absender" fields={senderFields} edit={edit} onChange={setEdit} /><section className="rounded-2xl border border-slate-200 p-4"><h3 className="font-semibold text-slate-800">Testmail senden</h3><p className="mt-1 text-sm text-slate-500">Sendet die Vorlage an die angegebene E-Mail-Adresse.</p><div className="mt-3 flex flex-wrap gap-3"><input type="email" value={test} onChange={(event) => setTest(event.target.value)} placeholder="name@beispiel.de" className="min-h-11 min-w-0 flex-1 rounded-xl border border-slate-300 px-3 text-sm outline-none focus:border-[#0053a0] focus:ring-2 focus:ring-[#0053a0]/15" /><button type="button" disabled={!test} onClick={() => void sendTest()} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 disabled:opacity-50"><Send className="h-4 w-4" />Testmail senden</button></div></section></div><aside className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><h3 className="font-semibold text-slate-800">Platzhalter</h3><p className="mt-1 text-sm text-slate-500">Ein Klick fügt den Platzhalter am Ende des Haupttexts ein.</p><div className="mt-4 flex flex-wrap gap-2">{templates[edit.templateType].placeholders.map((placeholder) => <button key={placeholder} type="button" onClick={() => setEdit({ ...edit, body: `${edit.body}${edit.body ? ' ' : ''}${placeholder}` })} className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100">{placeholder}</button>)}</div></aside></div><footer className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 p-5 sm:p-6"><button type="button" onClick={() => void reset(edit.templateType)} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50"><RotateCcw className="h-4 w-4" />Standard wiederherstellen</button><div className="flex flex-wrap justify-end gap-3"><button type="button" onClick={() => void showPreview()} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"><Eye className="h-4 w-4" />Vorschau</button><button type="button" onClick={() => void save()} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#0053a0] px-4 py-2 text-sm font-semibold text-white hover:brightness-110"><Save className="h-4 w-4" />Speichern</button></div></footer></section></div> : null}
    {preview ? <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 p-3 sm:p-6"><section className="mx-auto my-3 w-full max-w-4xl rounded-2xl bg-white shadow-xl"><header className="flex items-start justify-between gap-4 border-b border-slate-200 p-5 sm:p-6"><div><p className="text-sm font-semibold uppercase tracking-[.2em] text-[#0053a0]">Vorschau</p><h2 className="mt-1 text-xl font-bold text-slate-800">{preview.subject}</h2></div><button type="button" onClick={() => setPreview(null)} className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-50" aria-label="Vorschau schließen"><X className="h-5 w-5" /></button></header><div className="space-y-4 p-5 sm:p-6"><iframe title="Mail-Vorschau" sandbox="" srcDoc={preview.html} className="h-80 w-full rounded-xl border border-slate-200" /><pre className="whitespace-pre-wrap rounded-xl bg-slate-50 p-4 text-sm text-slate-700">{preview.plainText}</pre></div><footer className="flex justify-end border-t border-slate-200 p-5 sm:p-6"><button type="button" onClick={() => setPreview(null)} className="min-h-11 rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Schließen</button></footer></section></div> : null}
    <ProtectedSideMenu isOpen={menu} onClose={() => setMenu(false)} />
  </main>
}

function FieldGroup({ title, fields, edit, onChange }: { title: string; fields: (keyof Template)[]; edit: Template; onChange: (template: Template) => void }) {
  return <section><h3 className="text-base font-bold text-slate-800">{title}</h3><div className="mt-3 grid gap-4">{fields.map((field) => <label key={field} className="text-xs font-semibold uppercase tracking-wide text-slate-600">{fieldLabels[field]}<textarea value={edit[field] as string} onChange={(event) => onChange({ ...edit, [field]: event.target.value })} className={fieldClass} /></label>)}</div></section>
}

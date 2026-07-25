import { useEffect, useMemo, useState } from 'react'
import { CheckCircle2, Eye, Mail, Menu, Send, TriangleAlert } from 'lucide-react'
import ProtectedSideMenu from '../components/ProtectedSideMenu'
import { getInitiativen } from '../services/initiativeApi'
import { getNotificationDetails, getNotifications, sendNotification } from '../services/notifications'
import { getSettings, type Settings } from '../services/settingsApi'
import type { Initiative } from '../types/Initiative'
import type { NotificationDetails, NotificationSummary, NotificationRecipientRole } from '../types/Notifications'

const inputClass = 'mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-[#0053a0] focus:ring-2 focus:ring-[#0053a0]/15'
const statusLabel: Record<string, string> = { Pending: 'Ausstehend', Sending: 'Wird versendet', Sent: 'Versendet', PartiallyFailed: 'Teilweise fehlgeschlagen', Failed: 'Fehlgeschlagen', SkippedDisabled: 'Deaktiviert' }
const roleLabels: Record<NotificationRecipientRole, string> = { Admin: 'Administratoren', Disponent: 'Disponenten', Fahrer: 'Fahrer' }

function AdminEmailPage() {
  const [menu, setMenu] = useState(false)
  const [tab, setTab] = useState<'send' | 'history' | 'automatic'>('send')
  const [initiatives, setInitiatives] = useState<Initiative[]>([])
  const [history, setHistory] = useState<NotificationSummary[]>([])
  const [settings, setSettings] = useState<Settings | null>(null)
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [roles, setRoles] = useState<NotificationRecipientRole[]>([])
  const [initiativeId, setInitiativeId] = useState('')
  const [confirming, setConfirming] = useState(false)
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [details, setDetails] = useState<NotificationDetails | null>(null)
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [period, setPeriod] = useState('')
  const [totalCount, setTotalCount] = useState(0)
  void setPage
  void setPageSize
  void setStatusFilter
  void setTypeFilter
  void setPeriod
  void totalCount

  async function load() {
    setLoading(true)
    try {
      const fromUtc = period ? new Date(Date.now() - Number(period) * 86400000).toISOString() : ''
      const [loadedInitiatives, loadedHistory, loadedSettings] = await Promise.all([getInitiativen(), getNotifications(page, pageSize, statusFilter, typeFilter, fromUtc), getSettings()])
      setInitiatives(loadedInitiatives); setHistory(loadedHistory.items); setTotalCount(loadedHistory.totalCount); setSettings(loadedSettings)
    } catch (err) { setError(err instanceof Error ? err.message : 'E-Mail-Daten konnten nicht geladen werden.') } finally { setLoading(false) }
  }
  useEffect(() => { void load() }, [])
  const filteredHistory = useMemo(() => history.filter(item => `${item.subject} ${item.type} ${item.recipientGroup} ${item.status}`.toLowerCase().includes(query.toLowerCase())), [history, query])
  const audience = roles.length ? roles.map(role => roleLabels[role]).join(', ') : 'Alle aktiven Nutzer'
  function toggleRole(role: NotificationRecipientRole) { setRoles(current => current.includes(role) ? current.filter(item => item !== role) : [...current, role]) }
  function openConfirm() { setError(''); if (!subject.trim() || !message.trim()) { setError('Betreff und Nachricht sind erforderlich.'); return }; setConfirming(true) }
  async function send() {
    setSending(true); setError('')
    try {
      const result = await sendNotification({ subject: subject.trim(), message: message.trim(), type: 'GeneralInfo', initiativeIds: initiativeId ? [Number(initiativeId)] : [], roles })
      setNotice(`Rundmail wurde mit ${result.status === 'Pending' ? '0' : result.sentCount} sofort versendeten Empfängern zur Zustellung eingereiht.`)
      setSubject(''); setMessage(''); setRoles([]); setInitiativeId(''); setConfirming(false); setTab('history'); await load()
    } catch (err) { setError(err instanceof Error ? err.message : 'Rundmail konnte nicht versendet werden.'); setConfirming(false) } finally { setSending(false) }
  }
  async function showDetails(id: string) { try { setDetails(await getNotificationDetails(id)) } catch (err) { setError(err instanceof Error ? err.message : 'Details konnten nicht geladen werden.') } }
  const tabs = [{ id: 'send' as const, label: 'Rundmail senden' }, { id: 'history' as const, label: 'Versandhistorie' }, { id: 'automatic' as const, label: 'Automatische E-Mails' }]

  return <main className="min-h-screen bg-slate-100 text-slate-900"><header className="border-b border-slate-200 bg-white/95 px-4 py-3 shadow-sm backdrop-blur sm:px-6"><button type="button" onClick={() => setMenu(true)} className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50" aria-label="Navigation öffnen"><Menu className="h-5 w-5" /></button></header><div className="p-3 sm:p-4 lg:p-6"><section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm sm:rounded-3xl"><div className="border-b border-slate-200 p-4 sm:p-6"><p className="text-sm font-semibold uppercase tracking-[.2em] text-[#0053a0]">Administration</p><h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-800 sm:text-4xl">E-Mail</h1><p className="mt-2 text-sm text-slate-500">Rundmails versenden und Zustellung kontrolliert nachvollziehen.</p><div className="mt-5 flex flex-wrap gap-2">{tabs.map(item => <button key={item.id} type="button" onClick={() => setTab(item.id)} className={`rounded-xl px-4 py-2 text-sm font-semibold ${tab === item.id ? 'bg-[#0053a0] text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>{item.label}</button>)}</div></div>{error ? <p className="border-b border-rose-200 bg-rose-50 px-5 py-3 text-sm text-rose-800">{error}</p> : null}{notice ? <p className="border-b border-emerald-200 bg-emerald-50 px-5 py-3 text-sm text-emerald-800">{notice}</p> : null}<div className="p-4 sm:p-6">{loading ? <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">Lade E-Mail-Verwaltung ...</p> : tab === 'send' ? <div className="max-w-3xl space-y-5"><div className="grid gap-5 sm:grid-cols-2"><fieldset><legend className="text-xs font-semibold uppercase tracking-wide text-slate-600">Empfängergruppe</legend><div className="mt-2 space-y-2">{(Object.keys(roleLabels) as NotificationRecipientRole[]).map(role => <label key={role} className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={roles.includes(role)} onChange={() => toggleRole(role)} />{roleLabels[role]}</label>)}<p className="text-xs text-slate-500">Ohne Auswahl werden alle aktiven Nutzer adressiert.</p></div></fieldset><label className="text-xs font-semibold uppercase tracking-wide text-slate-600">Initiative (optional)<select value={initiativeId} onChange={event => setInitiativeId(event.target.value)} className={inputClass}><option value="">Alle Initiativen</option>{initiatives.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label></div><label className="block text-xs font-semibold uppercase tracking-wide text-slate-600">Betreff<input maxLength={150} value={subject} onChange={event => setSubject(event.target.value)} className={inputClass} /></label><label className="block text-xs font-semibold uppercase tracking-wide text-slate-600">Nachricht<textarea maxLength={4000} value={message} onChange={event => setMessage(event.target.value)} className={`${inputClass} min-h-40`} /></label><section className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><div className="flex items-center gap-2 font-semibold text-slate-800"><Eye className="h-4 w-4" />Vorschau</div><p className="mt-3 text-sm text-slate-500">An: {audience}{initiativeId ? ` · ${initiatives.find(item => item.id === Number(initiativeId))?.name ?? ''}` : ''}</p><h2 className="mt-3 font-bold text-slate-800">{subject || 'Betreff'}</h2><p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{message || 'Nachricht'}</p></section><button type="button" onClick={openConfirm} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#0053a0] px-5 py-2 text-sm font-semibold text-white hover:brightness-110"><Send className="h-4 w-4" />Versand bestätigen</button></div> : tab === 'history' ? <div><div className="mb-4 flex justify-between gap-3"><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Betreff, Typ oder Status suchen ..." className="w-full max-w-md rounded-xl border border-slate-300 px-3 py-2 text-sm" /><button type="button" onClick={() => void load()} className="rounded-xl border border-slate-300 px-4 text-sm font-semibold text-slate-700">Aktualisieren</button></div><div className="overflow-x-auto rounded-2xl border border-slate-200"><table className="w-full min-w-[850px] text-sm"><thead className="bg-slate-50 text-left text-slate-700"><tr><th className="px-4 py-3">Zeitpunkt</th><th className="px-4 py-3">Art / Betreff</th><th className="px-4 py-3">Empfängergruppe</th><th className="px-4 py-3">Ergebnis</th><th className="px-4 py-3">Status</th><th className="px-4 py-3"></th></tr></thead><tbody>{filteredHistory.map(item => <tr key={item.id} className="border-t border-slate-100"><td className="whitespace-nowrap px-4 py-3 text-slate-600">{new Date(item.createdAt).toLocaleString('de-DE')}</td><td className="px-4 py-3"><p className="font-medium text-slate-800">{item.subject}</p><p className="text-xs text-slate-500">{item.type}</p></td><td className="px-4 py-3 text-slate-700">{item.recipientGroup}</td><td className="px-4 py-3 text-slate-700">{item.sentCount} erfolgreich · {item.failedCount} fehlgeschlagen</td><td className="px-4 py-3"><span className={`rounded-full px-2 py-1 text-xs font-semibold ${item.status === 'Sent' ? 'bg-emerald-50 text-emerald-700' : item.status === 'Failed' ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-700'}`}>{statusLabel[item.status] ?? item.status}</span></td><td className="px-4 py-3"><button type="button" onClick={() => void showDetails(item.id)} className="text-sm font-semibold text-[#0053a0]">Details</button></td></tr>)}</tbody></table></div></div> : <div className="grid gap-4 sm:grid-cols-2"><article className="rounded-2xl border border-slate-200 p-5"><Mail className="h-5 w-5 text-[#0053a0]" /><h2 className="mt-3 font-bold text-slate-800">Fahrerzuweisung</h2><p className="mt-2 text-sm text-slate-600">{settings?.enableDriverAssignmentEmails ? 'Aktiviert' : 'Deaktiviert'} – wird nur bei tatsächlicher Änderung der Fahrerzuweisung ausgelöst.</p></article><article className="rounded-2xl border border-slate-200 p-5"><CheckCircle2 className="h-5 w-5 text-[#0053a0]" /><h2 className="mt-3 font-bold text-slate-800">Selbstanmeldung</h2><p className="mt-2 text-sm text-slate-600">{settings?.enableSelfRegistrationEmails ? 'Aktiviert' : 'Deaktiviert'} – die Anmeldung bleibt bei SMTP-Fehlern erfolgreich.</p></article><p className="sm:col-span-2 text-sm text-slate-500">Die Schalter werden unter Einstellungen verwaltet. SMTP-Zugangsdaten sind hier bewusst nicht sichtbar.</p></div>}</div></section></div>{confirming ? <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/50 p-4"><section className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"><TriangleAlert className="h-6 w-6 text-amber-600" /><h2 className="mt-3 text-xl font-bold">Rundmail versenden?</h2><p className="mt-2 text-sm text-slate-600">Die Mail wird an „{audience}“ gesendet. Der Versand wird in der Historie protokolliert.</p><div className="mt-5 flex justify-end gap-3"><button type="button" onClick={() => setConfirming(false)} className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold">Abbrechen</button><button type="button" disabled={sending} onClick={() => void send()} className="rounded-xl bg-[#0053a0] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">{sending ? 'Wird versendet ...' : 'Jetzt senden'}</button></div></section></div> : null}{details ? <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/50 p-4"><section className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"><div className="flex justify-between gap-4"><div><h2 className="text-xl font-bold">Versanddetails</h2><p className="mt-1 text-sm text-slate-500">{details.subject}</p></div><button type="button" onClick={() => setDetails(null)} className="text-sm font-semibold text-[#0053a0]">Schließen</button></div><p className="mt-4 whitespace-pre-wrap rounded-xl bg-slate-50 p-3 text-sm text-slate-700">{details.message}</p><div className="mt-4 space-y-2">{details.recipients.map(item => <div key={item.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 p-3 text-sm"><span>{item.displayName} · {item.email}</span><span className={item.status === 'Sent' ? 'text-emerald-700' : 'text-rose-700'}>{statusLabel[item.status] ?? item.status}</span></div>)}</div></section></div> : null}<ProtectedSideMenu isOpen={menu} onClose={() => setMenu(false)} /></main>
}

export default AdminEmailPage

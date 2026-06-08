import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Bell, ChevronLeft, LoaderCircle, Mail, Send } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useRoleVisibility } from '../hooks/useRoleVisibility'
import {
  getNotificationDetails,
  getNotifications,
  sendNotification,
} from '../services/notifications'
import type {
  NotificationDetails,
  NotificationRecipientGroup,
  NotificationSummary,
  NotificationType,
} from '../types/Notifications'

const notificationTypeOptions: Array<{ value: NotificationType; label: string; description: string }> = [
  { value: 'GeneralInfo', label: 'Allgemeine Information', description: 'Normale Systemnachricht an ausgewählte Nutzergruppen.' },
  { value: 'SystemMaintenance', label: 'Systemwartung', description: 'Hinweis auf geplante Wartung oder Ausfallzeiten.' },
  { value: 'VehicleMaintenance', label: 'Fahrzeugwartung', description: 'Hinweis zu Wartung oder technischem Fahrzeugstatus.' },
]

const recipientGroupOptions: Array<{ value: NotificationRecipientGroup; label: string; description: string }> = [
  { value: 'All', label: 'Alle aktiven Nutzer', description: 'Senden an alle aktiven Konten.' },
  { value: 'Admins', label: 'Admins', description: 'Nur Benutzer mit Admin-Rolle.' },
  { value: 'Disponents', label: 'Disponenten', description: 'Nur Benutzer mit Disponenten-Rolle.' },
  { value: 'Drivers', label: 'Fahrer', description: 'Nur Benutzer mit Fahrer-Rolle.' },
]

function formatDate(value: string | null | undefined) {
  if (!value) {
    return '—'
  }

  return new Intl.DateTimeFormat('de-DE', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function getStatusClass(status: string) {
  const normalized = status.toLowerCase()

  if (normalized === 'sent') {
    return 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100'
  }

  if (normalized === 'partiallyfailed') {
    return 'bg-amber-50 text-amber-700 ring-1 ring-amber-100'
  }

  if (normalized === 'failed') {
    return 'bg-rose-50 text-rose-700 ring-1 ring-rose-100'
  }

  return 'bg-slate-100 text-slate-600 ring-1 ring-slate-200'
}

function AdminNotificationsPage() {
  const { isAdmin } = useRoleVisibility()
  const [type, setType] = useState<NotificationType>('GeneralInfo')
  const [recipientGroup, setRecipientGroup] = useState<NotificationRecipientGroup>('All')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitMessage, setSubmitMessage] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [notifications, setNotifications] = useState<NotificationSummary[]>([])
  const [selectedNotificationId, setSelectedNotificationId] = useState<string | null>(null)
  const [selectedNotification, setSelectedNotification] = useState<NotificationDetails | null>(null)
  const [isLoadingHistory, setIsLoadingHistory] = useState(true)
  const [isLoadingDetails, setIsLoadingDetails] = useState(false)
  const [historyError, setHistoryError] = useState<string | null>(null)

  const selectedSummary = useMemo(
    () => notifications.find((notification) => notification.id === selectedNotificationId) ?? null,
    [notifications, selectedNotificationId],
  )

  useEffect(() => {
    let isCancelled = false

    async function loadNotifications() {
      setIsLoadingHistory(true)
      setHistoryError(null)

      try {
        const result = await getNotifications()
        if (!isCancelled) {
          setNotifications(result)
          setSelectedNotificationId((current) => current ?? result[0]?.id ?? null)
        }
      } catch (error) {
        if (!isCancelled) {
          setHistoryError(error instanceof Error ? error.message : 'Benachrichtigungen konnten nicht geladen werden.')
        }
      } finally {
        if (!isCancelled) {
          setIsLoadingHistory(false)
        }
      }
    }

    void loadNotifications()

    return () => {
      isCancelled = true
    }
  }, [])

  useEffect(() => {
    if (!selectedNotificationId) {
      setSelectedNotification(null)
      return
    }

    let isCancelled = false

    async function loadDetails() {
      setIsLoadingDetails(true)

      try {
        const result = await getNotificationDetails(selectedNotificationId)
        if (!isCancelled) {
          setSelectedNotification(result)
        }
      } catch (error) {
        if (!isCancelled) {
          setSubmitError(error instanceof Error ? error.message : 'Benachrichtigungsdetails konnten nicht geladen werden.')
          setSelectedNotification(null)
        }
      } finally {
        if (!isCancelled) {
          setIsLoadingDetails(false)
        }
      }
    }

    void loadDetails()

    return () => {
      isCancelled = true
    }
  }, [selectedNotificationId])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const trimmedSubject = subject.trim()
    const trimmedMessage = message.trim()

    if (!trimmedSubject) {
      setSubmitError('Bitte einen Betreff eingeben.')
      return
    }

    if (!trimmedMessage) {
      setSubmitError('Bitte eine Nachricht eingeben.')
      return
    }

    setSubmitMessage(null)
    setSubmitError(null)
    setIsSubmitting(true)

    try {
      const result = await sendNotification({
        recipientGroup,
        subject: trimmedSubject,
        message: trimmedMessage,
        type,
      })

      const nextMessage = result.status === 'Sent'
        ? 'Benachrichtigung wurde versendet.'
        : result.status === 'PartiallyFailed'
          ? 'Benachrichtigung wurde teilweise versendet. Einige Empfänger konnten nicht erreicht werden.'
          : 'Benachrichtigung konnte nicht versendet werden.'

      setSubmitMessage(nextMessage)
      setSubject('')
      setMessage('')

      const refreshed = await getNotifications()
      setNotifications(refreshed)
      setSelectedNotificationId(result.notificationId)
      setSelectedNotification(await getNotificationDetails(result.notificationId))
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Benachrichtigung konnte nicht versendet werden.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isAdmin) {
    return (
      <main className="min-h-screen bg-slate-100 px-5 py-8 text-slate-900 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Adminbereich</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">Benachrichtigungen</h1>
          <p className="mt-4 text-sm leading-6 text-slate-600">Keine Berechtigung.</p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-slate-100 px-5 py-8 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_30px_80px_rgba(15,23,42,0.08)]">
          <div className="border-b border-slate-200 px-6 py-5 sm:px-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#0053a0]">Adminbereich</p>
                <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">Benachrichtigungen</h1>
                <p className="mt-3 text-sm leading-6 text-slate-500">Rundmails an Nutzergruppen senden und Versandstatus nachvollziehen.</p>
              </div>

              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                Zurück zum Dashboard
              </Link>
            </div>
          </div>

          <div className="grid gap-6 px-6 py-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8">
            <section className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <div className="mb-5 flex items-center gap-3">
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[#0053a0]/10 text-[#0053a0]">
                  <Send className="h-5 w-5" aria-hidden="true" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">Benachrichtigung senden</h2>
                  <p className="text-sm text-slate-500">Mailpit und SMTP-Konfiguration werden automatisch verwendet.</p>
                </div>
              </div>

              <form className="space-y-4" onSubmit={handleSubmit} noValidate>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700" htmlFor="notification-type">Typ</label>
                    <select
                      id="notification-type"
                      value={type}
                      onChange={(event) => setType(event.target.value as NotificationType)}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#0053a0] focus:ring-4 focus:ring-[#0053a0]/10"
                    >
                      {notificationTypeOptions.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700" htmlFor="recipient-group">Empfängergruppe</label>
                    <select
                      id="recipient-group"
                      value={recipientGroup}
                      onChange={(event) => setRecipientGroup(event.target.value as NotificationRecipientGroup)}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#0053a0] focus:ring-4 focus:ring-[#0053a0]/10"
                    >
                      {recipientGroupOptions.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700" htmlFor="subject">Betreff</label>
                    <input
                      id="subject"
                      value={subject}
                      onChange={(event) => setSubject(event.target.value)}
                      placeholder="z. B. Geplante Wartung"
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#0053a0] focus:ring-4 focus:ring-[#0053a0]/10"
                    />
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                      <Mail className="h-4 w-4 text-slate-500" aria-hidden="true" />
                      Vorschau-Hinweise
                    </div>
                    <ul className="mt-2 space-y-1 text-sm text-slate-600">
                      <li>Betreff und Nachricht werden 1:1 per SMTP versendet.</li>
                      <li>Jeder Empfänger erhält eine eigene E-Mail.</li>
                      <li>Versandstatus wird in der Datenbank protokolliert.</li>
                    </ul>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700" htmlFor="message">Nachricht</label>
                  <textarea
                    id="message"
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                    rows={7}
                    placeholder="Das System ist am Freitag von 18:00 bis 19:00 Uhr nicht erreichbar."
                    className="w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#0053a0] focus:ring-4 focus:ring-[#0053a0]/10"
                  />
                </div>

                {submitError ? (
                  <p className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">{submitError}</p>
                ) : null}

                {submitMessage ? (
                  <p className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{submitMessage}</p>
                ) : null}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#0053a0] px-6 py-4 text-base font-semibold text-white shadow-[0_18px_40px_rgba(0,83,160,0.2)] transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting ? <LoaderCircle className="h-5 w-5 animate-spin" aria-hidden="true" /> : <Send className="h-5 w-5" aria-hidden="true" />}
                  {isSubmitting ? 'Wird gesendet...' : 'Benachrichtigung senden'}
                </button>
              </form>
            </section>

            <section className="space-y-4 rounded-3xl border border-slate-200 bg-white p-5">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Verlauf</h2>
                <p className="text-sm text-slate-500">Versendete Benachrichtigungen und Versandstatus.</p>
              </div>

              {historyError ? (
                <p className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">{historyError}</p>
              ) : null}

              <div className="max-h-[34rem] overflow-auto rounded-2xl border border-slate-200">
                {isLoadingHistory ? (
                  <div className="p-6 text-sm text-slate-500">Verlauf wird geladen...</div>
                ) : notifications.length === 0 ? (
                  <div className="p-6 text-sm text-slate-500">Noch keine Benachrichtigungen vorhanden.</div>
                ) : (
                  <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                    <thead className="sticky top-0 bg-slate-50 text-slate-500">
                      <tr>
                        <th className="px-4 py-3 font-medium">Betreff</th>
                        <th className="px-4 py-3 font-medium">Typ</th>
                        <th className="px-4 py-3 font-medium">Status</th>
                        <th className="px-4 py-3 font-medium">Datum</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {notifications.map((notification) => (
                        <tr
                          key={notification.id}
                          className={`cursor-pointer transition hover:bg-slate-50 ${selectedNotificationId === notification.id ? 'bg-slate-50' : ''}`}
                          onClick={() => setSelectedNotificationId(notification.id)}
                        >
                          <td className="px-4 py-3 align-top font-medium text-slate-900">
                            <div>{notification.subject}</div>
                            <div className="text-xs text-slate-500">{notification.recipientGroup}</div>
                          </td>
                          <td className="px-4 py-3 align-top text-slate-600">{notification.type}</td>
                          <td className="px-4 py-3 align-top">
                            <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusClass(notification.status)}`}>
                              {notification.status}
                            </span>
                            <div className="mt-1 text-xs text-slate-500">Erfolgreich: {notification.sentCount} | Fehlgeschlagen: {notification.failedCount}</div>
                          </td>
                          <td className="px-4 py-3 align-top text-slate-600">{formatDate(notification.createdAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">Detailansicht</h3>
                    <p className="text-sm text-slate-500">Versandstatus pro Empfänger.</p>
                  </div>

                  {selectedSummary ? (
                    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusClass(selectedSummary.status)}`}>
                      {selectedSummary.status}
                    </span>
                  ) : null}
                </div>

                {isLoadingDetails ? (
                  <div className="mt-4 text-sm text-slate-500">Details werden geladen...</div>
                ) : selectedNotification ? (
                  <div className="mt-4 space-y-4">
                    <div className="space-y-2 rounded-2xl bg-white p-4">
                      <div className="text-sm font-medium text-slate-500">Nachricht</div>
                      <div className="whitespace-pre-wrap text-sm leading-6 text-slate-700">{selectedNotification.message}</div>
                    </div>

                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                      <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                        <thead className="bg-slate-50 text-slate-500">
                          <tr>
                            <th className="px-4 py-3 font-medium">Empfänger</th>
                            <th className="px-4 py-3 font-medium">E-Mail</th>
                            <th className="px-4 py-3 font-medium">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {selectedNotification.recipients.map((recipient) => (
                            <tr key={recipient.id}>
                              <td className="px-4 py-3 align-top text-slate-900">{recipient.displayName}</td>
                              <td className="px-4 py-3 align-top text-slate-600">{recipient.email}</td>
                              <td className="px-4 py-3 align-top">
                                <div className="flex flex-col gap-1">
                                  <span className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold ${getStatusClass(recipient.status)}`}>{recipient.status}</span>
                                  {recipient.errorMessage ? (
                                    <span className="text-xs text-rose-600">{recipient.errorMessage}</span>
                                  ) : null}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 text-sm text-slate-500">Wähle eine Benachrichtigung aus dem Verlauf aus.</div>
                )}
              </div>
            </section>
          </div>
        </section>
      </div>
    </main>
  )
}

export default AdminNotificationsPage
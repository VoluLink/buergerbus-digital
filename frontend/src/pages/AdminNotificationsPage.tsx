import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { ChevronLeft, LoaderCircle, Mail, Menu, Send } from 'lucide-react'
import { Link } from 'react-router-dom'
import ProtectedSideMenu from '../components/ProtectedSideMenu'
import { useRoleVisibility } from '../hooks/useRoleVisibility'
import { getInitiativen } from '../services/initiativeApi'
import {
  getNotificationDetails,
  getNotifications,
  sendNotification,
} from '../services/notifications'
import { getUsers } from '../services/users'
import type { Initiative } from '../types/Initiative'
import type {
  NotificationDetails,
  NotificationSummary,
  NotificationType,
  NotificationRecipientRole,
} from '../types/Notifications'
import type { UserSummary } from '../types/UserProfile'

const notificationTypeOptions: Array<{ value: NotificationType; label: string; description: string }> = [
  { value: 'GeneralInfo', label: 'Allgemeine Information', description: 'Normale Systemnachricht an ausgewÃ¤hlte Nutzergruppen.' },
  { value: 'SystemMaintenance', label: 'Systemwartung', description: 'Hinweis auf geplante Wartung oder Ausfallzeiten.' },
  { value: 'VehicleMaintenance', label: 'Fahrzeugwartung', description: 'Hinweis zu Wartung oder technischem Fahrzeugstatus.' },
]

const recipientRoleOptions: Array<{ value: NotificationRecipientRole; label: string; description: string }> = [
  { value: 'Admin', label: 'Admins', description: 'Nur Benutzer mit Admin-Rolle.' },
  { value: 'Disponent', label: 'Disponenten', description: 'Nur Benutzer mit Disponenten-Rolle.' },
  { value: 'Fahrer', label: 'Fahrer', description: 'Nur Benutzer mit Fahrer-Rolle.' },
]

const selectAllValue = 'all'

function normalizeSelection(values: string[]) {
  const uniqueValues = Array.from(new Set(values.filter(Boolean)))

  if (uniqueValues.length === 0 || uniqueValues.includes(selectAllValue)) {
    return [selectAllValue]
  }

  return uniqueValues
}

function formatDate(value: string | null | undefined) {
  if (!value) {
    return 'â€”'
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
  const [isSideMenuOpen, setIsSideMenuOpen] = useState(false)
  const [type, setType] = useState<NotificationType>('GeneralInfo')
  const [selectedInitiativeValues, setSelectedInitiativeValues] = useState<string[]>([selectAllValue])
  const [selectedRoleValues, setSelectedRoleValues] = useState<string[]>([selectAllValue])
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitMessage, setSubmitMessage] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [initiatives, setInitiatives] = useState<Initiative[]>([])
  const [previewUsers, setPreviewUsers] = useState<UserSummary[]>([])
  const [isLoadingFilterData, setIsLoadingFilterData] = useState(true)
  const [filterDataError, setFilterDataError] = useState<string | null>(null)
  const [notifications, setNotifications] = useState<NotificationSummary[]>([])
  const [selectedNotificationId, setSelectedNotificationId] = useState<string | null>(null)
  const [selectedNotification, setSelectedNotification] = useState<NotificationDetails | null>(null)
  const [isLoadingHistory, setIsLoadingHistory] = useState(true)
  const [isLoadingDetails, setIsLoadingDetails] = useState(false)
  const [historyError, setHistoryError] = useState<string | null>(null)

  const selectedInitiativeIds = useMemo(
    () => (selectedInitiativeValues.includes(selectAllValue)
      ? []
      : selectedInitiativeValues.map((value) => Number(value)).filter((value) => Number.isFinite(value))),
    [selectedInitiativeValues],
  )

  const selectedRoles = useMemo(
    () => (selectedRoleValues.includes(selectAllValue)
      ? []
      : selectedRoleValues.filter((value) => value !== selectAllValue) as NotificationRecipientRole[]),
    [selectedRoleValues],
  )

  const selectedInitiativeLabels = useMemo(() => {
    if (selectedInitiativeIds.length === 0) {
      return ['Alle Initiativen']
    }

    return selectedInitiativeIds
      .map((initiativeId) => initiatives.find((initiative) => initiative.id === initiativeId)?.name)
      .filter((value): value is string => Boolean(value))
  }, [initiatives, selectedInitiativeIds])

  const selectedRoleLabels = useMemo(() => {
    if (selectedRoles.length === 0) {
      return ['Alle Rollen']
    }

    return selectedRoles.map((role) => {
      const option = recipientRoleOptions.find((entry) => entry.value === role)
      return option?.label ?? role
    })
  }, [selectedRoles])

  const previewLabel = useMemo(() => {
    return `Filter: Initiative ${selectedInitiativeLabels.join(', ')}, Rolle ${selectedRoleLabels.join(', ')}`
  }, [selectedInitiativeLabels, selectedRoleLabels])

  const previewCount = useMemo(() => {
    return previewUsers.filter((user) => {
      if (!user.isActive) {
        return false
      }

      const matchesInitiative = selectedInitiativeIds.length === 0
        || (user.initiative?.id != null && selectedInitiativeIds.includes(user.initiative.id))

      if (!matchesInitiative) {
        return false
      }

      if (selectedRoles.length === 0) {
        return true
      }

      return user.roles.some((role) => selectedRoles.some((selectedRole) => role.toLowerCase() === selectedRole.toLowerCase()))
    }).length
  }, [previewUsers, selectedInitiativeIds, selectedRoles])

  const selectedSummary = useMemo(
    () => notifications.find((notification) => notification.id === selectedNotificationId) ?? null,
    [notifications, selectedNotificationId],
  )

  useEffect(() => {
    let isCancelled = false

    async function loadFilterData() {
      setIsLoadingFilterData(true)
      setFilterDataError(null)

      try {
        const [loadedInitiatives, firstPage] = await Promise.all([
          getInitiativen(),
          getUsers(1, 100),
        ])

        const loadedUsers = [...firstPage.items]
        for (let page = 2; page <= firstPage.totalPages; page += 1) {
          const nextPage = await getUsers(page, 100)
          loadedUsers.push(...nextPage.items)
        }

        if (!isCancelled) {
          setInitiatives(loadedInitiatives)
          setPreviewUsers(loadedUsers)
        }
      } catch (error) {
        if (!isCancelled) {
          setFilterDataError(error instanceof Error ? error.message : 'Filterdaten konnten nicht geladen werden.')
        }
      } finally {
        if (!isCancelled) {
          setIsLoadingFilterData(false)
        }
      }
    }

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

    void loadFilterData()
    void loadNotifications()

    return () => {
      isCancelled = true
    }
  }, [])

  useEffect(() => {
    const notificationId = selectedNotificationId

    if (notificationId == null) {
      setSelectedNotification(null)
      return
    }

    const selectedNotificationIdValue: string = notificationId

    let isCancelled = false

    async function loadDetails() {
      setIsLoadingDetails(true)

      try {
        const result = await getNotificationDetails(selectedNotificationIdValue)
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
        subject: trimmedSubject,
        message: trimmedMessage,
        type,
        initiativeIds: selectedInitiativeIds,
        roles: selectedRoles,
      })

      const nextMessage = result.status === 'Sent'
        ? 'Benachrichtigung wurde versendet.'
        : result.status === 'PartiallyFailed'
          ? 'Benachrichtigung wurde teilweise versendet. Einige EmpfÃ¤nger konnten nicht erreicht werden.'
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
      <main className="min-h-screen overflow-x-hidden bg-slate-100 px-4 py-6 text-slate-900 sm:px-6 sm:py-8 lg:px-8">
        <div className="mx-auto max-w-2xl rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
          <p className="break-words text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Adminbereich</p>
          <h1 className="mt-3 break-words text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">Benachrichtigungen</h1>
          <p className="mt-4 text-sm leading-6 text-slate-600">Keine Berechtigung.</p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-slate-100 px-3 py-5 text-slate-900 sm:px-6 sm:py-8 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_30px_80px_rgba(15,23,42,0.08)] sm:rounded-[2rem]">
          <div className="border-b border-slate-200 px-4 py-4 sm:px-8 sm:py-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="break-words text-sm font-semibold uppercase tracking-[0.2em] text-[#0053a0]">Adminbereich</p>
                <h1 className="mt-2 break-words text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">Benachrichtigungen</h1>
                <p className="mt-3 max-w-2xl break-words text-sm leading-6 text-slate-500">Rundmails mit Initiative- und Rollenfiltern senden und Versandstatus nachvollziehen.</p>
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
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-center text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                  Zurück zum Dashboard
                </Link>
              </div>
            </div>
          </div>

          <div className="grid gap-4 px-4 py-4 sm:gap-6 sm:px-6 sm:py-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8">
            <section className="rounded-3xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
              <div className="mb-4 flex items-start gap-3 sm:mb-5 sm:items-center">
                <div className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#0053a0]/10 text-[#0053a0]">
                  <Send className="h-5 w-5" aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <h2 className="break-words text-lg font-semibold text-slate-900 sm:text-xl">Benachrichtigung senden</h2>
                  <p className="break-words text-sm text-slate-500">Mailpit und SMTP-Konfiguration werden automatisch verwendet.</p>
                </div>
              </div>

              <form className="space-y-3 sm:space-y-4" onSubmit={handleSubmit} noValidate>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700" htmlFor="notification-type">Typ</label>
                    <select
                      id="notification-type"
                      value={type}
                      onChange={(event) => setType(event.target.value as NotificationType)}
                      className="min-h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#0053a0] focus:ring-4 focus:ring-[#0053a0]/10"
                    >
                      {notificationTypeOptions.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700" htmlFor="initiative-filter">Initiative(n)</label>
                    <select
                      id="initiative-filter"
                      multiple
                      value={selectedInitiativeValues}
                      onChange={(event) => setSelectedInitiativeValues(normalizeSelection(Array.from(event.currentTarget.selectedOptions, (option) => option.value)))}
                      className="min-h-[8.5rem] w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#0053a0] focus:ring-4 focus:ring-[#0053a0]/10 sm:min-h-[10rem]"
                    >
                      <option value={selectAllValue}>Alle Initiativen</option>
                      {initiatives.map((initiative) => (
                        <option key={initiative.id} value={String(initiative.id)}>{initiative.name}</option>
                      ))}
                    </select>
                    <p className="text-xs text-slate-500">Mehrfachauswahl mit Strg/Cmd mÃ¶glich. Leer bzw. â€žAlle Initiativenâ€œ sendet an alle Initiativen.</p>
                  </div>
                </div>

                <div className="grid gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700" htmlFor="recipient-roles">Rolle(n)</label>
                    <select
                      id="recipient-roles"
                      multiple
                      value={selectedRoleValues}
                      onChange={(event) => setSelectedRoleValues(normalizeSelection(Array.from(event.currentTarget.selectedOptions, (option) => option.value)))}
                      className="min-h-[8rem] w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#0053a0] focus:ring-4 focus:ring-[#0053a0]/10 sm:min-h-[9rem]"
                    >
                      <option value={selectAllValue}>Alle Rollen / Alle aktiven Nutzer</option>
                      {recipientRoleOptions.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                    <p className="text-xs text-slate-500">Mehrfachauswahl mit Strg/Cmd mÃ¶glich. Leer bzw. â€žAlle Rollenâ€œ sendet an alle aktiven Nutzer.</p>
                  </div>
                </div>

                <div className="space-y-2 rounded-2xl border border-slate-200 bg-white p-3 sm:p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                    <Mail className="h-4 w-4 text-slate-500" aria-hidden="true" />
                    EmpfÃ¤ngervorschau
                  </div>
                  {isLoadingFilterData ? (
                    <p className="text-sm text-slate-500">Filterdaten werden geladen...</p>
                  ) : filterDataError ? (
                    <p className="text-sm text-rose-700">{filterDataError}</p>
                  ) : (
                    <>
                      <p className="text-sm text-slate-700">Voraussichtliche EmpfÃ¤nger: {previewCount}</p>
                      <p className="text-xs text-slate-500">{previewLabel}</p>
                    </>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700" htmlFor="subject">Betreff</label>
                  <input
                    id="subject"
                    value={subject}
                    onChange={(event) => setSubject(event.target.value)}
                    placeholder="z. B. Geplante Wartung"
                    className="min-h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#0053a0] focus:ring-4 focus:ring-[#0053a0]/10"
                    />
                  </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700" htmlFor="message">Nachricht</label>
                  <textarea
                    id="message"
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                    rows={7}
                    placeholder="Das System ist am Freitag von 18:00 bis 19:00 Uhr nicht erreichbar."
                    className="min-h-36 w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#0053a0] focus:ring-4 focus:ring-[#0053a0]/10"
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
                  className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-[#0053a0] px-6 py-3 text-base font-semibold text-white shadow-[0_18px_40px_rgba(0,83,160,0.2)] transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60 sm:py-4"
                >
                  {isSubmitting ? <LoaderCircle className="h-5 w-5 animate-spin" aria-hidden="true" /> : <Send className="h-5 w-5" aria-hidden="true" />}
                  {isSubmitting ? 'Wird gesendet...' : 'Benachrichtigung senden'}
                </button>
              </form>
            </section>

            <section className="space-y-4 rounded-3xl border border-slate-200 bg-white p-4 sm:p-5">
              <div>
                <h2 className="text-lg font-semibold text-slate-900 sm:text-xl">Verlauf</h2>
                <p className="text-sm text-slate-500">Versendete Benachrichtigungen und Versandstatus.</p>
              </div>

              {historyError ? (
                <p className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">{historyError}</p>
              ) : null}

              <div className="max-h-[34rem] overflow-y-auto rounded-2xl border border-slate-200">
                {isLoadingHistory ? (
                  <div className="p-6 text-sm text-slate-500">Verlauf wird geladen...</div>
                ) : notifications.length === 0 ? (
                  <div className="p-6 text-sm text-slate-500">Noch keine Benachrichtigungen vorhanden.</div>
                ) : (
                  <>
                    <div className="divide-y divide-slate-200 md:hidden">
                      {notifications.map((notification) => (
                        <article
                          key={notification.id}
                          className={`space-y-3 p-4 transition ${selectedNotificationId === notification.id ? 'bg-slate-50' : 'bg-white'}`}
                        >
                          <button
                            type="button"
                            className="block min-h-11 w-full text-left"
                            onClick={() => setSelectedNotificationId(notification.id)}
                          >
                            <div className="break-words font-medium text-slate-900">{notification.subject}</div>
                            <div className="mt-1 break-words text-xs text-slate-500">{notification.recipientGroup}</div>
                          </button>

                          <div className="grid gap-3 text-sm">
                            <div>
                              <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Typ</div>
                              <div className="mt-1 break-words text-slate-700">{notification.type}</div>
                            </div>
                            <div>
                              <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Status</div>
                              <span className={`mt-1 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusClass(notification.status)}`}>
                                {notification.status}
                              </span>
                              <div className="mt-1 break-words text-xs text-slate-500">Erfolgreich: {notification.sentCount} | Fehlgeschlagen: {notification.failedCount}</div>
                            </div>
                            <div>
                              <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Datum</div>
                              <div className="mt-1 text-slate-700">{formatDate(notification.createdAt)}</div>
                            </div>
                          </div>

                          <button
                            type="button"
                            className="inline-flex min-h-11 w-full items-center justify-center rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                            onClick={() => setSelectedNotificationId(notification.id)}
                          >
                            Details anzeigen
                          </button>
                        </article>
                      ))}
                    </div>

                    <table className="hidden min-w-full divide-y divide-slate-200 text-left text-sm md:table">
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
                  </>
                )}
              </div>

              <div className="max-h-[90vh] overflow-y-auto rounded-3xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">Detailansicht</h3>
                    <p className="text-sm text-slate-500">Versandstatus pro EmpfÃ¤nger.</p>
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
                    <div className="space-y-2 rounded-2xl bg-white p-3 sm:p-4">
                      <div className="text-sm font-medium text-slate-500">Nachricht</div>
                      <div className="whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">{selectedNotification.message}</div>
                    </div>

                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                      <div className="divide-y divide-slate-200 md:hidden">
                        {selectedNotification.recipients.map((recipient) => (
                          <article key={recipient.id} className="space-y-3 p-4">
                            <div>
                              <div className="text-xs font-medium uppercase tracking-wide text-slate-500">EmpfÃ¤nger</div>
                              <div className="mt-1 break-words text-sm font-medium text-slate-900">{recipient.displayName}</div>
                            </div>
                            <div>
                              <div className="text-xs font-medium uppercase tracking-wide text-slate-500">E-Mail</div>
                              <div className="mt-1 break-all text-sm text-slate-600">{recipient.email}</div>
                            </div>
                            <div>
                              <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Status</div>
                              <div className="mt-1 flex flex-col gap-1">
                                <span className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold ${getStatusClass(recipient.status)}`}>{recipient.status}</span>
                                {recipient.errorMessage ? (
                                  <span className="break-words text-xs text-rose-600">{recipient.errorMessage}</span>
                                ) : null}
                              </div>
                            </div>
                          </article>
                        ))}
                      </div>

                      <table className="hidden min-w-full divide-y divide-slate-200 text-left text-sm md:table">
                        <thead className="bg-slate-50 text-slate-500">
                          <tr>
                            <th className="px-4 py-3 font-medium">EmpfÃ¤nger</th>
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
                  <div className="mt-4 text-sm text-slate-500">WÃ¤hle eine Benachrichtigung aus dem Verlauf aus.</div>
                )}
              </div>
            </section>
          </div>
        </section>
      </div>
      <ProtectedSideMenu isOpen={isSideMenuOpen} onClose={() => setIsSideMenuOpen(false)} />
    </main>
  )
}

export default AdminNotificationsPage

import { useEffect, useMemo, useState } from 'react'
import { ChevronLeft, Menu, Plus, Save, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import ProtectedSideMenu from '../../../components/ProtectedSideMenu'
import { useRoleVisibility } from '../../../hooks/useRoleVisibility'
import { getAdminPages } from '../../pages/api/pagesApi'
import { createFooterLink, deleteFooterLink, getAdminFooterLinks, updateFooterLink } from '../api/footerApi'
import type { AdminFooterLink, FooterLinkType } from '../types'
import type { AdminPage } from '../../pages/types'

type FooterFormState = {
  label: string
  linkType: FooterLinkType
  sitePageId: string | null
  externalUrl: string
  sortOrder: number
  isActive: boolean
  openInNewTab: boolean
}

function emptyForm(): FooterFormState {
  return {
    label: '',
    linkType: 1,
    sitePageId: null,
    externalUrl: '',
    sortOrder: 1,
    isActive: true,
    openInNewTab: false,
  }
}

function AdminFooterLinksPage() {
  const { isAdmin } = useRoleVisibility()
  const [isSideMenuOpen, setIsSideMenuOpen] = useState(false)
  const [links, setLinks] = useState<AdminFooterLink[]>([])
  const [pages, setPages] = useState<AdminPage[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [selectedLinkId, setSelectedLinkId] = useState<string | null>(null)
  const [form, setForm] = useState<FooterFormState>(emptyForm())
  const [isSaving, setIsSaving] = useState(false)

  const selectedLink = useMemo(
    () => links.find((link) => link.id === selectedLinkId) ?? null,
    [links, selectedLinkId],
  )

  useEffect(() => {
    let isMounted = true

    void (async () => {
      setIsLoading(true)
      setError(null)

      try {
        const [loadedLinks, loadedPages] = await Promise.all([
          getAdminFooterLinks(),
          getAdminPages(),
        ])

        if (!isMounted) {
          return
        }

        setLinks(loadedLinks)
        setPages(loadedPages)
      } catch (err) {
        if (!isMounted) {
          return
        }

        setError(err instanceof Error ? err.message : 'Footer-Links konnten nicht geladen werden.')
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    })()

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    if (selectedLink) {
      setForm({
        label: selectedLink.label,
        linkType: selectedLink.linkType,
        sitePageId: selectedLink.sitePageId,
        externalUrl: selectedLink.externalUrl ?? '',
        sortOrder: selectedLink.sortOrder,
        isActive: selectedLink.isActive,
        openInNewTab: selectedLink.openInNewTab,
      })
      return
    }

    setForm(emptyForm())
  }, [selectedLink])

  if (!isAdmin) {
    return (
      <main className="min-h-screen bg-slate-100 px-5 py-8 text-slate-900 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Adminbereich</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">Footer</h1>
          <p className="mt-4 text-sm leading-6 text-slate-600">Keine Berechtigung.</p>
        </div>
      </main>
    )
  }

  async function handleSave() {
    const payload = {
      label: form.label.trim(),
      linkType: form.linkType,
      sitePageId: form.linkType === 1 ? form.sitePageId : null,
      externalUrl: form.linkType === 2 ? form.externalUrl.trim() : null,
      sortOrder: Number(form.sortOrder),
      isActive: form.isActive,
      openInNewTab: form.openInNewTab,
    }

    setIsSaving(true)
    setError(null)
    setMessage(null)

    try {
      if (selectedLink) {
        const updated = await updateFooterLink(selectedLink.id, payload)
        setLinks((current) => current.map((link) => (link.id === updated.id ? updated : link)).sort((left, right) => left.sortOrder - right.sortOrder))
        setMessage('Footer-Link wurde aktualisiert.')
      } else {
        const created = await createFooterLink(payload)
        setLinks((current) => [...current, created].sort((left, right) => left.sortOrder - right.sortOrder))
        setMessage('Footer-Link wurde erstellt.')
      }

      setSelectedLinkId(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Footer-Link konnte nicht gespeichert werden.')
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDelete(linkId: string) {
    if (!window.confirm('Footer-Link wirklich löschen?')) {
      return
    }

    try {
      await deleteFooterLink(linkId)
      setLinks((current) => current.filter((link) => link.id !== linkId))
      if (selectedLinkId === linkId) {
        setSelectedLinkId(null)
      }
      setMessage('Footer-Link wurde gelöscht.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Footer-Link konnte nicht gelöscht werden.')
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 px-5 py-8 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_30px_80px_rgba(15,23,42,0.08)]">
          <div className="border-b border-slate-200 px-6 py-5 sm:px-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#0053a0]">Einstellungen</p>
                <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">Footer-Links</h1>
                <p className="mt-3 text-sm leading-6 text-slate-500">Interne Seiten und externe Links für den Login-Footer verwalten.</p>
              </div>

              <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center sm:gap-3">
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
                  to="/admin/einstellungen"
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                  Zurück
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedLinkId(null)
                    setForm(emptyForm())
                  }}
                  className="inline-flex items-center gap-2 rounded-full bg-[#0053a0] px-4 py-2 text-sm font-semibold text-white transition hover:brightness-105"
                >
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  Neuer Link
                </button>
              </div>
            </div>
          </div>

          <div className="grid gap-6 px-6 py-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8">
            <section className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <h2 className="text-xl font-semibold text-slate-900">Footer-Liste</h2>
              <p className="mt-1 text-sm text-slate-500">Nur aktive Links werden öffentlich angezeigt.</p>

              {isLoading ? <p className="mt-6 text-sm text-slate-500">Lade Footer-Links...</p> : null}
              {error ? <p className="mt-6 text-sm text-rose-600">{error}</p> : null}
              {message ? <p className="mt-6 text-sm text-emerald-700">{message}</p> : null}

              <div className="mt-6 space-y-3">
                {links.map((link) => (
                  <article key={link.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900">{link.label}</h3>
                        <p className="text-sm text-slate-500">
                          {link.linkType === 1 ? `/pages/${link.sitePageSlug ?? ''}` : link.externalUrl}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2 text-xs font-semibold">
                        <span className={`rounded-full px-3 py-1 ${link.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                          {link.isActive ? 'Aktiv' : 'Inaktiv'}
                        </span>
                        <span className="rounded-full bg-[#0053a0]/10 px-3 py-1 text-[#0053a0]">
                          {link.sortOrder}
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedLinkId(link.id)}
                        className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                      >
                        Bearbeiten
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(link.id)}
                        className="inline-flex items-center gap-2 rounded-full border border-rose-200 px-4 py-2 text-sm font-medium text-rose-700 transition hover:bg-rose-50"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                        Löschen
                      </button>
                    </div>
                  </article>
                ))}

                {links.length === 0 && !isLoading ? (
                  <p className="rounded-2xl border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-500">
                    Noch keine Footer-Links angelegt.
                  </p>
                ) : null}
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[#0053a0]/10 text-[#0053a0]">
                  <Save className="h-5 w-5" aria-hidden="true" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">{selectedLink ? 'Footer-Link bearbeiten' : 'Neuer Footer-Link'}</h2>
                  <p className="text-sm text-slate-500">Interne oder externe Ziele, aktiv/inaktiv und neue Tabs.</p>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700" htmlFor="footer-label">Label</label>
                  <input
                    id="footer-label"
                    value={form.label}
                    onChange={(event) => setForm((current) => ({ ...current, label: event.target.value }))}
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-700 outline-none transition focus:border-[#0053a0] focus:ring-4 focus:ring-[#0053a0]/10"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700" htmlFor="footer-type">Link-Typ</label>
                  <select
                    id="footer-type"
                    value={form.linkType}
                    onChange={(event) => setForm((current) => ({ ...current, linkType: Number(event.target.value) as FooterLinkType }))}
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-700 outline-none transition focus:border-[#0053a0] focus:ring-4 focus:ring-[#0053a0]/10"
                  >
                    <option value={1}>Interne Seite</option>
                    <option value={2}>Externe URL</option>
                  </select>
                </div>

                {form.linkType === 1 ? (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700" htmlFor="footer-page">Interne Seite</label>
                    <select
                      id="footer-page"
                      value={form.sitePageId ?? ''}
                      onChange={(event) => setForm((current) => ({ ...current, sitePageId: event.target.value || null }))}
                      className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-700 outline-none transition focus:border-[#0053a0] focus:ring-4 focus:ring-[#0053a0]/10"
                    >
                      <option value="">Seite auswählen</option>
                      {pages.map((page) => (
                        <option key={page.id} value={page.id}>
                          {page.title} /{page.slug}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700" htmlFor="footer-url">Externe URL</label>
                    <input
                      id="footer-url"
                      value={form.externalUrl}
                      onChange={(event) => setForm((current) => ({ ...current, externalUrl: event.target.value }))}
                      placeholder="https://forum.example.de"
                      className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-700 outline-none transition focus:border-[#0053a0] focus:ring-4 focus:ring-[#0053a0]/10"
                    />
                  </div>
                )}

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700" htmlFor="footer-order">Sortierung</label>
                    <input
                      id="footer-order"
                      type="number"
                      value={form.sortOrder}
                      onChange={(event) => setForm((current) => ({ ...current, sortOrder: Number(event.target.value) }))}
                      className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-700 outline-none transition focus:border-[#0053a0] focus:ring-4 focus:ring-[#0053a0]/10"
                    />
                  </div>

                  <label className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700">
                    <input
                      type="checkbox"
                      checked={form.isActive}
                      onChange={(event) => setForm((current) => ({ ...current, isActive: event.target.checked }))}
                      className="h-4 w-4 rounded border-slate-300 text-[#0053a0] focus:ring-[#0053a0]"
                    />
                    Aktiv
                  </label>
                </div>

                <label className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={form.openInNewTab}
                    onChange={(event) => setForm((current) => ({ ...current, openInNewTab: event.target.checked }))}
                    className="h-4 w-4 rounded border-slate-300 text-[#0053a0] focus:ring-[#0053a0]"
                  />
                  Im neuen Tab öffnen
                </label>

                <div className="flex flex-wrap gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={isSaving}
                    className="inline-flex items-center gap-2 rounded-full bg-[#0053a0] px-5 py-3 text-sm font-semibold text-white transition hover:brightness-105 disabled:opacity-60"
                  >
                    <Save className="h-4 w-4" aria-hidden="true" />
                    {isSaving ? 'Speichern...' : 'Speichern'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedLinkId(null)
                      setForm(emptyForm())
                    }}
                    className="rounded-full border border-slate-200 px-5 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                  >
                    Formular leeren
                  </button>
                </div>
              </div>
            </section>
          </div>
        </section>
      </div>

      <ProtectedSideMenu isOpen={isSideMenuOpen} onClose={() => setIsSideMenuOpen(false)} />
    </main>
  )
}

export default AdminFooterLinksPage

import { useEffect, useMemo, useState } from 'react'
import { ChevronLeft, Plus, Save, Trash2 } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useRoleVisibility } from '../../../hooks/useRoleVisibility'
import { createPage, deletePage, getAdminPages, updatePage } from '../api/pagesApi'
import type { AdminPage, CreatePageRequest } from '../types'

type PageFormState = CreatePageRequest

function emptyForm(): PageFormState {
  return {
    slug: '',
    title: '',
    content: '',
    isPublished: false,
    showInFooter: false,
    footerSortOrder: null,
  }
}

function AdminPagesPage() {
  const navigate = useNavigate()
  const { isAdmin } = useRoleVisibility()
  const [pages, setPages] = useState<AdminPage[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null)
  const [form, setForm] = useState<PageFormState>(emptyForm())
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const selectedPage = useMemo(
    () => pages.find((page) => page.id === selectedPageId) ?? null,
    [pages, selectedPageId],
  )

  useEffect(() => {
    let isMounted = true

    void (async () => {
      setIsLoading(true)
      setLoadError(null)

      try {
        const data = await getAdminPages()
        if (!isMounted) return
        setPages(data)
      } catch (err) {
        if (!isMounted) return
        setLoadError(err instanceof Error ? err.message : 'Seiten konnten nicht geladen werden.')
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
    if (selectedPage) {
      setForm({
        slug: selectedPage.slug,
        title: selectedPage.title,
        content: selectedPage.content,
        isPublished: selectedPage.isPublished,
        showInFooter: selectedPage.showInFooter,
        footerSortOrder: selectedPage.footerSortOrder,
      })
      return
    }

    setForm(emptyForm())
  }, [selectedPage])

  if (!isAdmin) {
    return (
      <main className="min-h-screen bg-slate-100 px-5 py-8 text-slate-900 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Adminbereich</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">Seiten</h1>
          <p className="mt-4 text-sm leading-6 text-slate-600">Keine Berechtigung.</p>
        </div>
      </main>
    )
  }

  async function handleSave() {
    const payload: CreatePageRequest = {
      ...form,
      slug: form.slug.trim().toLowerCase(),
      title: form.title.trim(),
      content: form.content.trim(),
      footerSortOrder: form.footerSortOrder === null || Number.isNaN(Number(form.footerSortOrder))
        ? null
        : Number(form.footerSortOrder),
    }

    setIsSaving(true)
    setError(null)
    setMessage(null)

    try {
      if (selectedPage) {
        const updated = await updatePage(selectedPage.id, payload)
        setPages((current) => current.map((page) => (page.id === updated.id ? updated : page)))
        setMessage('Seite wurde aktualisiert.')
      } else {
        const created = await createPage(payload)
        setPages((current) => [...current, created].sort((left, right) => left.title.localeCompare(right.title, 'de')))
        setMessage('Seite wurde erstellt.')
      }

      setSelectedPageId(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Seite konnte nicht gespeichert werden.')
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDelete(pageId: string) {
    if (!window.confirm('Seite wirklich löschen?')) {
      return
    }

    setError(null)
    try {
      await deletePage(pageId)
      setPages((current) => current.filter((page) => page.id !== pageId))
      if (selectedPageId === pageId) {
        setSelectedPageId(null)
      }
      setMessage('Seite wurde gelöscht.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Seite konnte nicht gelöscht werden.')
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
                <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">Seiten</h1>
                <p className="mt-3 text-sm leading-6 text-slate-500">Öffentliche Seiten wie Impressum, Datenschutz und Kontakt pflegen.</p>
              </div>

              <div className="flex items-center gap-3">
                <Link
                  to="/admin/einstellungen"
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                  Zurück
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedPageId(null)
                    setForm(emptyForm())
                  }}
                  className="inline-flex items-center gap-2 rounded-full bg-[#0053a0] px-4 py-2 text-sm font-semibold text-white transition hover:brightness-105"
                >
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  Neue Seite
                </button>
              </div>
            </div>
          </div>

          <div className="grid gap-6 px-6 py-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8">
            <section className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <h2 className="text-xl font-semibold text-slate-900">Seitenliste</h2>
              <p className="mt-1 text-sm text-slate-500">Veröffentlicht, Footer-Anzeige und Reihenfolge sind hier sichtbar.</p>

              {isLoading ? <p className="mt-6 text-sm text-slate-500">Lade Seiten...</p> : null}
              {loadError ? <p className="mt-6 text-sm text-rose-600">{loadError}</p> : null}
              {message ? <p className="mt-6 text-sm text-emerald-700">{message}</p> : null}
              {error ? <p className="mt-6 text-sm text-rose-600">{error}</p> : null}

              <div className="mt-6 space-y-3">
                {pages.map((page) => (
                  <article key={page.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900">{page.title}</h3>
                        <p className="text-sm text-slate-500">/{page.slug}</p>
                      </div>
                      <div className="flex flex-wrap gap-2 text-xs font-semibold">
                        <span className={`rounded-full px-3 py-1 ${page.isPublished ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                          {page.isPublished ? 'Veröffentlicht' : 'Entwurf'}
                        </span>
                        {page.showInFooter ? (
                          <span className="rounded-full bg-[#0053a0]/10 px-3 py-1 text-[#0053a0]">
                            Footer {page.footerSortOrder ?? '—'}
                          </span>
                        ) : null}
                      </div>
                    </div>

                    <p className="mt-3 line-clamp-3 whitespace-pre-line text-sm leading-6 text-slate-600">
                      {page.content}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedPageId(page.id)}
                        className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                      >
                        Bearbeiten
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(page.id)}
                        className="inline-flex items-center gap-2 rounded-full border border-rose-200 px-4 py-2 text-sm font-medium text-rose-700 transition hover:bg-rose-50"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                        Löschen
                      </button>
                    </div>
                  </article>
                ))}

                {pages.length === 0 && !isLoading ? (
                  <p className="rounded-2xl border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-500">
                    Noch keine Seiten angelegt.
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
                  <h2 className="text-xl font-semibold text-slate-900">{selectedPage ? 'Seite bearbeiten' : 'Neue Seite'}</h2>
                  <p className="text-sm text-slate-500">Einfacher Text oder Markdown. Kein HTML-Rendering.</p>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700" htmlFor="page-title">Titel</label>
                  <input
                    id="page-title"
                    value={form.title}
                    onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-700 outline-none transition focus:border-[#0053a0] focus:ring-4 focus:ring-[#0053a0]/10"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700" htmlFor="page-slug">Slug</label>
                  <input
                    id="page-slug"
                    value={form.slug}
                    onChange={(event) => setForm((current) => ({ ...current, slug: event.target.value }))}
                    placeholder="impressum"
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-700 outline-none transition focus:border-[#0053a0] focus:ring-4 focus:ring-[#0053a0]/10"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700" htmlFor="page-content">Inhalt</label>
                  <textarea
                    id="page-content"
                    rows={12}
                    value={form.content}
                    onChange={(event) => setForm((current) => ({ ...current, content: event.target.value }))}
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#0053a0] focus:ring-4 focus:ring-[#0053a0]/10"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700">
                    <input
                      type="checkbox"
                      checked={form.isPublished}
                      onChange={(event) => setForm((current) => ({ ...current, isPublished: event.target.checked }))}
                      className="h-4 w-4 rounded border-slate-300 text-[#0053a0] focus:ring-[#0053a0]"
                    />
                    Veröffentlicht
                  </label>

                  <label className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700">
                    <input
                      type="checkbox"
                      checked={form.showInFooter}
                      onChange={(event) => setForm((current) => ({ ...current, showInFooter: event.target.checked }))}
                      className="h-4 w-4 rounded border-slate-300 text-[#0053a0] focus:ring-[#0053a0]"
                    />
                    Im Footer anzeigen
                  </label>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700" htmlFor="page-footer-order">Footer-Reihenfolge</label>
                  <input
                    id="page-footer-order"
                    type="number"
                    value={form.footerSortOrder ?? ''}
                    onChange={(event) => setForm((current) => ({
                      ...current,
                      footerSortOrder: event.target.value === '' ? null : Number(event.target.value),
                    }))}
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-700 outline-none transition focus:border-[#0053a0] focus:ring-4 focus:ring-[#0053a0]/10"
                  />
                </div>

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
                      setSelectedPageId(null)
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
    </main>
  )
}

export default AdminPagesPage
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getPublicPage } from '../api/pagesApi'
import type { PublicPage as PublicPageType } from '../types'

function PublicPage() {
  const { slug = '' } = useParams()
  const [page, setPage] = useState<PublicPageType | null | undefined>(undefined)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    void (async () => {
      try {
        const result = await getPublicPage(slug)
        if (!isMounted) {
          return
        }

        setPage(result)
        setError(null)
      } catch (err) {
        if (!isMounted) {
          return
        }

        setPage(null)
        setError(err instanceof Error ? err.message : 'Seite konnte nicht geladen werden.')
      }
    })()

    return () => {
      isMounted = false
    }
  }, [slug])

  if (page === undefined) {
    return (
      <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(0,83,160,0.12),_transparent_38%),linear-gradient(180deg,#f8fbff_0%,#ffffff_60%)] px-5 py-12 text-slate-900 sm:px-6 lg:px-8">
        <div className="mx-auto flex min-h-[70vh] max-w-3xl items-center justify-center rounded-[2rem] border border-slate-200 bg-white/90 p-8 text-slate-500 shadow-[0_30px_80px_rgba(15,23,42,0.08)]">
          Lade Seite...
        </div>
      </main>
    )
  }

  if (page === null) {
    return (
      <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(0,83,160,0.12),_transparent_38%),linear-gradient(180deg,#f8fbff_0%,#ffffff_60%)] px-5 py-12 text-slate-900 sm:px-6 lg:px-8">
        <div className="mx-auto flex min-h-[70vh] max-w-3xl flex-col justify-center rounded-[2rem] border border-slate-200 bg-white/90 p-8 shadow-[0_30px_80px_rgba(15,23,42,0.08)]">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#0053a0]">404</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">
            Seite nicht gefunden
          </h1>
          <p className="mt-4 text-sm leading-6 text-slate-600">
            Die angeforderte öffentliche Seite existiert nicht oder wurde nicht veröffentlicht.
          </p>
          {error ? <p className="mt-3 text-sm text-rose-600">{error}</p> : null}
          <Link
            to="/"
            className="mt-8 inline-flex w-fit rounded-full bg-[#0053a0] px-5 py-3 text-sm font-semibold text-white transition hover:brightness-105"
          >
            Zurück zum Login
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(0,83,160,0.12),_transparent_38%),linear-gradient(180deg,#f8fbff_0%,#ffffff_60%)] px-5 py-12 text-slate-900 sm:px-6 lg:px-8">
      <article className="mx-auto max-w-3xl rounded-[2rem] border border-slate-200 bg-white/95 p-8 shadow-[0_30px_80px_rgba(15,23,42,0.08)] sm:p-10">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#0053a0]">Öffentliche Seite</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">{page.title}</h1>
        <div className="mt-8 whitespace-pre-line text-base leading-7 text-slate-700">
          {page.content}
        </div>
        <div className="mt-10">
          <Link to="/" className="text-sm font-semibold text-[#0053a0] hover:underline">
            Zurück zum Login
          </Link>
        </div>
      </article>
    </main>
  )
}

export default PublicPage
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getPublicFooter } from '../api/footerApi'
import type { PublicFooterLink } from '../types'

function LoginFooter() {
  const [links, setLinks] = useState<PublicFooterLink[]>([])

  useEffect(() => {
    let isMounted = true

    void (async () => {
      try {
        const response = await getPublicFooter()
        if (isMounted) {
          setLinks(response.links ?? [])
        }
      } catch {
        if (isMounted) {
          setLinks([])
        }
      }
    })()

    return () => {
      isMounted = false
    }
  }, [])

  if (links.length === 0) {
    return null
  }

  return (
    <footer className="mt-8 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm text-slate-500">
      {links
        .slice()
        .sort((left, right) => left.sortOrder - right.sortOrder)
        .map((link) => (
          link.isExternal ? (
            <a
              key={`${link.label}-${link.url}`}
              href={link.url}
              target={link.openInNewTab ? '_blank' : undefined}
              rel={link.openInNewTab ? 'noopener noreferrer' : undefined}
              className="font-medium text-[#0053a0] transition hover:text-[#003d73] hover:underline"
            >
              {link.label}
            </a>
          ) : (
            <Link
              key={`${link.label}-${link.url}`}
              to={link.url}
              className="font-medium text-[#0053a0] transition hover:text-[#003d73] hover:underline"
            >
              {link.label}
            </Link>
          )
        ))}
    </footer>
  )
}

export default LoginFooter
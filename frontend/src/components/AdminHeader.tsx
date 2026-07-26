import { CircleUserRound } from 'lucide-react'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import UserMenuButton from './UserMenuButton'

const adminTitles: Record<string, string> = {
  '/admin/benachrichtigungen': 'Benachrichtigungen',
  '/admin/email': 'E-Mail-Verwaltung',
  '/admin/email/templates': 'E-Mail-Vorlagen',
  '/admin/audit-logs': 'Audit-Logs',
  '/admin/einstellungen': 'Einstellungen',
  '/admin/seiten': 'Seiten',
  '/admin/footer-links': 'Footer-Links',
}

function AdminHeader() {
  const location = useLocation()
  const navigate = useNavigate()
  const { currentUser } = useAuth()
  const title = adminTitles[location.pathname]
  const [headerTarget, setHeaderTarget] = useState<HTMLElement | null>(null)

  useEffect(() => {
    document.body.dataset.adminPage = title ? 'true' : ''
    const findHeader = () => {
      const target = title ? document.querySelector<HTMLElement>('main > header') : null
      setHeaderTarget((current) => current === target ? current : target)
    }
    findHeader()
    const observer = new MutationObserver(findHeader)
    observer.observe(document.getElementById('root')!, { childList: true, subtree: true })
    return () => {
      observer.disconnect()
      delete document.body.dataset.adminPage
      setHeaderTarget(null)
    }
  }, [title])

  if (!currentUser || !title || !headerTarget) return null

  return createPortal(
    <div className="ml-auto shrink-0">
      <span className="sr-only">Administration: {title}</span>
      <UserMenuButton onClick={() => navigate('/profil')} icon={<CircleUserRound className="h-5 w-5 sm:h-6 sm:w-6" aria-hidden="true" />} />
    </div>
    ,
    headerTarget,
  )
}

export default AdminHeader

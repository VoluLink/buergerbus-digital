import { CircleUserRound } from 'lucide-react'
import { useEffect } from 'react'
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

  useEffect(() => {
    document.body.dataset.adminPage = title ? 'true' : ''
    return () => { delete document.body.dataset.adminPage }
  }, [title])

  if (!currentUser || !title) return null

  return (
    <div className="fixed right-3 top-2 z-20 sm:right-6 sm:top-2">
      <span className="sr-only">Administration: {title}</span>
      <UserMenuButton onClick={() => navigate('/profil')} icon={<CircleUserRound className="h-5 w-5 sm:h-6 sm:w-6" aria-hidden="true" />} />
    </div>
  )
}

export default AdminHeader

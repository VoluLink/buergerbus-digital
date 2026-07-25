import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'

import { useAuth } from './context/AuthContext'
import { getStoredToken } from './services/httpClient'

const DashboardPage = lazy(() => import('./pages/DashboardPage'))
const LoginPage = lazy(() => import('./pages/LoginPage'))
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'))
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'))
const AdminNotificationsPage = lazy(() => import('./pages/AdminNotificationsPage'))
const AdminEmailPage = lazy(() => import('./pages/AdminEmailPage'))
const AdminSettingsPage = lazy(() => import('./pages/AdminSettingsPage'))
const AdminAuditLogsPage = lazy(() => import('./pages/AdminAuditLogsPage'))
const ProfilePage = lazy(() => import('./pages/ProfilePage'))
const FahrerinfosPage = lazy(() => import('./pages/FahrerinfosPage'))
const FahrzeuginfosPage = lazy(() => import('./pages/FahrzeuginfosPage'))
const FahrgastinfosPage = lazy(() => import('./pages/FahrgastinfosPage'))
const RollenverteilungPage = lazy(() => import('./pages/RollenverteilungPage'))
const InitiativenPage = lazy(() => import('./pages/InitiativenPage'))
const UserProfilePage = lazy(() => import('./pages/UserProfilePage'))
const PublicPage = lazy(() => import('./features/pages/components/PublicPage'))
const AdminPagesPage = lazy(() => import('./features/pages/admin/AdminPagesPage'))
const AdminFooterLinksPage = lazy(() => import('./features/footer/admin/AdminFooterLinksPage'))

function App() {
  const { currentUser, isLoading } = useAuth()

  if (isLoading) {return null}

  const token = getStoredToken()

  return (
    <Suspense fallback={<div className="p-6 text-sm text-slate-500">Lade Seite...</div>}>
      <Routes>
        <Route
          path="/"
          element={
            token && currentUser
              ? <Navigate to="/dashboard" replace />
              : <LoginPage />
          }
        />
        <Route path="/passwort-vergessen" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/pages/:slug" element={<PublicPage />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/profil" element={<ProfilePage />} />
          <Route path="/users/:id/profile" element={<UserProfilePage />} />
          <Route path="/fahrerinfos" element={<FahrerinfosPage />} />
          <Route path="/fahrzeuginfos" element={<FahrzeuginfosPage />} />
          <Route element={<ProtectedRoute allowedRoles={['admin', 'disponent']} />}>
            <Route path="/fahrgastinfos" element={<FahrgastinfosPage />} />
            <Route path="/rollenverteilung" element={<RollenverteilungPage />} />
          </Route>
          <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
            <Route path="/admin/benachrichtigungen" element={<AdminNotificationsPage />} />
            <Route path="/admin/email" element={<AdminEmailPage />} />
            <Route path="/admin/audit-logs" element={<AdminAuditLogsPage />} />
            <Route path="/admin/einstellungen" element={<AdminSettingsPage />} />
            <Route path="/initiativen" element={<InitiativenPage />} />
              <Route path="/admin/seiten" element={<AdminPagesPage />} />
              <Route path="/admin/footer-links" element={<AdminFooterLinksPage />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}

export default App

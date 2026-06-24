import { Navigate, Route, Routes } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import DashboardPage from './pages/DashboardPage'
import LoginPage from './pages/LoginPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import AdminNotificationsPage from './pages/AdminNotificationsPage'
import AdminSettingsPage from './pages/AdminSettingsPage'
import ProfilePage from './pages/ProfilePage'
import FahrerinfosPage from './pages/FahrerinfosPage'
import FahrzeuginfosPage from './pages/FahrzeuginfosPage'
import FahrgastinfosPage from './pages/FahrgastinfosPage'
import RollenverteilungPage from './pages/RollenverteilungPage'
import InitiativenPage from './pages/InitiativenPage'
import UserProfilePage from './pages/UserProfilePage'
import PublicPage from './features/pages/components/PublicPage'
import AdminPagesPage from './features/pages/admin/AdminPagesPage'
import AdminFooterLinksPage from './features/footer/admin/AdminFooterLinksPage'

import { useAuth } from './context/AuthContext'
import { getStoredToken } from './services/httpClient'

function App() {
  const { currentUser, isLoading } = useAuth()

  if (isLoading) {return null}

  const token = getStoredToken()

  return (
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
        <Route path="/admin/benachrichtigungen" element={<AdminNotificationsPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/profil" element={<ProfilePage />} />
        <Route path="/users/:id/profile" element={<UserProfilePage />} />
        <Route path="/fahrerinfos" element={<FahrerinfosPage />} />
        <Route path="/fahrzeuginfos" element={<FahrzeuginfosPage />} />
        <Route path="/fahrgastinfos" element={<FahrgastinfosPage />} />
        <Route path="/rollenverteilung" element={<RollenverteilungPage />} />
        <Route path="/admin/einstellungen" element={<AdminSettingsPage />} />
        <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
          <Route path="/initiativen" element={<InitiativenPage />} />
            <Route path="/admin/seiten" element={<AdminPagesPage />} />
            <Route path="/admin/footer-links" element={<AdminFooterLinksPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
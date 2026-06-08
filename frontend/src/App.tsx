import { Navigate, Route, Routes } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import DashboardPage from './pages/DashboardPage'
import LoginPage from './pages/LoginPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import ProfilePage from './pages/ProfilePage'
import FahrerinfosPage from './pages/FahrerinfosPage'
import FahrzeuginfosPage from './pages/FahrzeuginfosPage'
import FahrgastinfosPage from './pages/FahrgastinfosPage'
import RollenverteilungPage from './pages/RollenverteilungPage'
import InitiativenPage from './pages/InitiativenPage'
import UserProfilePage from './pages/UserProfilePage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/passwort-vergessen" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/profil" element={<ProfilePage />} />
        <Route path="/users/:id/profile" element={<UserProfilePage />} />
        <Route path="/fahrerinfos" element={<FahrerinfosPage />} />
        <Route path="/fahrzeuginfos" element={<FahrzeuginfosPage />} />
        <Route path="/fahrgastinfos" element={<FahrgastinfosPage />} />
        <Route path="/initiativen" element={<InitiativenPage />} />
        <Route path="/rollenverteilung" element={<RollenverteilungPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
import { Navigate, Route, Routes } from 'react-router-dom'
import DashboardPage from './pages/DashboardPage'
import LoginPage from './pages/LoginPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ProfilePage from './pages/ProfilePage'
import FahrerinfosPage from './pages/FahrerinfosPage'
import FahrzeuginfosPage from './pages/FahrzeuginfosPage'
import FahrgastinfosPage from './pages/FahrgastinfosPage'
import RollenverteilungPage from './pages/RollenverteilungPage'
import InitiativenPage from './pages/InitiativenPage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/passwort-vergessen" element={<ForgotPasswordPage />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/profil" element={<ProfilePage />} />
      <Route path="/fahrerinfos" element={<FahrerinfosPage />} />
      <Route path="/fahrzeuginfos" element={<FahrzeuginfosPage />} />
      <Route path="/fahrgastinfos" element={<FahrgastinfosPage />} />
      <Route path="/initiativen" element={<InitiativenPage />} />
      <Route path="/rollenverteilung" element={<RollenverteilungPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
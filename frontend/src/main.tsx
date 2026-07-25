import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from './context/AuthContext'
import { InitiativeProvider } from './context/InitiativeContext'
import { removeLegacyDashboardStorage } from './services/dashboardState'

removeLegacyDashboardStorage()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <InitiativeProvider>
          <App />
        </InitiativeProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)

import Header from './components/Header'
import Navigation from './components/Navigation'
import DashboardPage from './pages/DashboardPage'
import FahrerPage from './pages/FahrerPage'
import FahrtenPage from './pages/FahrtenPage'
import { Navigate, Outlet, Route, Routes } from 'react-router-dom'

function AppLayout() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto w-full max-w-6xl px-4 py-6">
        <Header />

        <div className="mt-6 grid gap-6 md:grid-cols-[240px_1fr]">
          <aside className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
            <Navigation />
          </aside>

          <main className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  )
}

function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="fahrten" element={<FahrtenPage />} />
        <Route path="fahrer" element={<FahrerPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}

export default App
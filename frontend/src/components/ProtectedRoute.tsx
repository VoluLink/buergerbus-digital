import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useRoleVisibility } from '../hooks/useRoleVisibility'
import { getStoredToken } from '../services/httpClient'

function ProtectedRoute() {
  const location = useLocation()
  const { currentUser, isLoading } = useAuth()
  const { isGast } = useRoleVisibility()

  if (isLoading) {
    return null
  }

  const token = getStoredToken()

  if (!token || !currentUser) {
    return <Navigate to="/" replace state={{ from: location.pathname }} />
  }

  if (isGast && location.pathname !== '/dashboard') {
    return <Navigate to="/dashboard" replace />
  }

  return <Outlet />
}

export default ProtectedRoute

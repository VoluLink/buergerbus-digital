import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getStoredToken } from '../services/httpClient'

function ProtectedRoute() {
  const location = useLocation()
  const { currentUser, isLoading } = useAuth()

  if (isLoading) {
    return null
  }

  const token = getStoredToken()

  if (!token || !currentUser) {
    return <Navigate to="/" replace state={{ from: location.pathname }} />
  }

  return <Outlet />
}

export default ProtectedRoute

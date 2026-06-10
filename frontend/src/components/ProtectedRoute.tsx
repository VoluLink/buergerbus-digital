import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useRoleVisibility } from '../hooks/useRoleVisibility'
import { getStoredToken } from '../services/httpClient'

type ProtectedRouteProps = {
  allowedRoles?: string[]
}

function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const location = useLocation()
  const { currentUser, isLoading } = useAuth()
  const { isGast, roles } = useRoleVisibility()

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

  if (allowedRoles && !roles.some((role) => allowedRoles.includes(role))) {
    return <Navigate to="/dashboard" replace />
  }

  return <Outlet />
}

export default ProtectedRoute

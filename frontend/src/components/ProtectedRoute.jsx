import { Navigate } from 'react-router-dom'
import useAuthStore from '../store/authStore'

/**
 * Wraps dashboard routes. Redirects to /login if no access token is stored.
 * Token validity is enforced by the backend — the axios interceptor handles
 * 401 responses and clears the store when the token is expired.
 */
export default function ProtectedRoute({ children }) {
  const accessToken  = useAuthStore(s => s.accessToken)
  const authDisabled = useAuthStore(s => s.authDisabled)
  // authDisabled = backend testing mode (no login required).
  if (!accessToken && !authDisabled) {
    return <Navigate to="/login" replace />
  }
  return children
}

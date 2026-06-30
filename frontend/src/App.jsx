import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/layout/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import { bootstrapAuth } from './utils/authBootstrap'
import Overview from './pages/Overview'
import SatkerDetail from './pages/SatkerDetail'
import SatkerManagement from './pages/SatkerManagement'
import SyncMonitoring from './pages/SyncMonitoring'
import UserManagement from './pages/UserManagement'
import LoginPage from './pages/auth/Login'
import OidcCallbackPage from './pages/auth/OidcCallback'

// Internal tool — no application-level auth in v1 per PRD.
// SSO is now implemented: access restricted via Keycloak + JWT tokens.
export default function App() {
  // Detect the backend auth mode once before rendering routes. In no-auth
  // (testing) mode this seeds a mock session so we land straight on the dashboard.
  const [ready, setReady] = useState(false)
  useEffect(() => {
    bootstrapAuth().finally(() => setReady(true))
  }, [])

  if (!ready) {
    return (
      <div className="min-h-screen bg-ikn-bg flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-ikn-green border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/auth/callback" element={<OidcCallbackPage />} />

        {/* Protected routes — redirect to /login if no JWT token */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/overview" replace />} />
          <Route path="overview"           element={<Overview />} />
          <Route path="satker-detail"      element={<SatkerDetail />} />
          <Route path="satker-management"  element={<SatkerManagement />} />
          <Route path="monitoring"         element={<SyncMonitoring />} />
          <Route path="users"              element={<UserManagement />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

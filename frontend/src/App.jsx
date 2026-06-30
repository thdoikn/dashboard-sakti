import { useEffect, useState, lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/layout/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import { bootstrapAuth } from './utils/authBootstrap'
import { ToastProvider } from './components/ui/Toast'

// Route-level code splitting: each page is fetched on demand, so the initial
// bundle no longer carries every screen (and Recharts) up front.
const Overview         = lazy(() => import('./pages/Overview'))
const SatkerDetail     = lazy(() => import('./pages/SatkerDetail'))
const SatkerManagement = lazy(() => import('./pages/SatkerManagement'))
const SyncMonitoring   = lazy(() => import('./pages/SyncMonitoring'))
const ActivityLog      = lazy(() => import('./pages/ActivityLog'))
const UserManagement   = lazy(() => import('./pages/UserManagement'))
const LoginPage        = lazy(() => import('./pages/auth/Login'))
const OidcCallbackPage = lazy(() => import('./pages/auth/OidcCallback'))

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-ikn-bg">
      <div className="w-8 h-8 border-4 border-ikn-blue-soft border-t-ikn-blue rounded-full animate-spin" />
    </div>
  )
}

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
    <ToastProvider>
      <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
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
          <Route path="activity"           element={<ActivityLog />} />
          <Route path="users"              element={<UserManagement />} />
        </Route>
      </Routes>
      </Suspense>
      </BrowserRouter>
    </ToastProvider>
  )
}

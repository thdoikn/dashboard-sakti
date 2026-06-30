import { Navigate } from 'react-router-dom'
import { buildAuthorizationUrl, isSsoEnabled } from '../../utils/oidc'
import useAuthStore from '../../store/authStore'

export default function LoginPage() {
  const authDisabled = useAuthStore(s => s.authDisabled)
  // No-auth (testing) mode: never show login, go straight to the dashboard.
  if (authDisabled) {
    return <Navigate to="/overview" replace />
  }

  const handleSsoLogin = () => {
    window.location.href = buildAuthorizationUrl()
  }

  return (
    <div className="min-h-screen bg-ikn-bg flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-lg p-10 w-full max-w-sm flex flex-col items-center gap-6">
        <div className="flex flex-col items-center gap-2">
          <div className="w-16 h-16 bg-ikn-green rounded-2xl flex items-center justify-center">
            <span className="text-white text-2xl font-bold">S</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900">SAKTI Dashboard</h1>
          <p className="text-sm text-gray-500 text-center">
            Platform Integrasi SAKTI-OIKN
          </p>
        </div>

        {isSsoEnabled() ? (
          <button
            onClick={handleSsoLogin}
            className="w-full py-3 px-4 bg-ikn-green hover:bg-ikn-green/90 text-white font-semibold rounded-lg transition-colors"
          >
            Login dengan SSO OIKN
          </button>
        ) : (
          <div className="w-full p-4 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700 text-center">
            SSO belum dikonfigurasi.
            <br />
            Hubungi administrator untuk mengatur koneksi Keycloak.
          </div>
        )}

        <p className="text-xs text-gray-400 text-center">
          Akses internal OIKN — tidak memerlukan registrasi
        </p>
      </div>
    </div>
  )
}

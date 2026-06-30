import { useEffect, useState } from 'react'
import { authService } from '../../services/auth'
import useAuthStore from '../../store/authStore'
import { getOidcRedirectUri } from '../../utils/oidc'

export default function OidcCallbackPage() {
  const setAuth  = useAuthStore(s => s.setAuth)
  const [error, setError] = useState(null)

  useEffect(() => {
    const params     = new URLSearchParams(window.location.search)
    const code       = params.get('code')
    const state      = params.get('state')
    const savedState = sessionStorage.getItem('oidc_state')

    // CSRF protection
    if (savedState && state && savedState !== state) {
      setError('State mismatch — kemungkinan serangan CSRF. Silakan coba lagi.')
      return
    }

    if (!code) {
      setError('Tidak ada authorization code dari SSO.')
      return
    }

    authService.oidcCallback(code, getOidcRedirectUri())
      .then(data => {
        sessionStorage.removeItem('oidc_state')
        setAuth({ user: data.user, access: data.access, refresh: data.refresh })
        // Use replace to avoid the callback URL staying in history
        window.location.replace('/')
      })
      .catch(err => {
        const msg = err.response?.data?.error || 'Login SSO gagal. Silakan coba lagi.'
        // 403 = authenticated with SSO but no recognised role → not authorised.
        // Route to the dedicated "no access" page instead of a generic error.
        if (err.response?.status === 403) {
          sessionStorage.removeItem('oidc_state')
          sessionStorage.setItem('access_denied_message', msg)
          window.location.replace('/no-access')
          return
        }
        setError(msg)
      })
  }, [])

  if (error) {
    return (
      <div className="min-h-screen bg-ikn-bg flex flex-col items-center justify-center gap-4 p-8">
        <div className="bg-white rounded-2xl shadow p-8 max-w-md w-full text-center">
          <h2 className="text-lg font-semibold text-red-600 mb-2">Login SSO Gagal</h2>
          <p className="text-sm text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => window.location.replace('/login')}
            className="px-4 py-2 bg-ikn-green text-white rounded-lg text-sm hover:bg-ikn-green/90"
          >
            Kembali ke Login
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-ikn-bg flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-ikn-green border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-gray-500">Memproses login SSO…</p>
      </div>
    </div>
  )
}

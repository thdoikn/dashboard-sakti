import { Navigate } from 'react-router-dom'
import {
  ArrowRightStartOnRectangleIcon,
  ShieldCheckIcon,
  LockClosedIcon,
} from '@heroicons/react/24/outline'
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
    <div className="min-h-screen bg-ikn-blue flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative brand blobs */}
      <div className="pointer-events-none absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white/5" />
      <div className="pointer-events-none absolute -bottom-32 -left-20 w-80 h-80 rounded-full bg-ikn-gold/10" />
      <div className="pointer-events-none absolute top-1/3 left-10 w-32 h-32 rounded-full bg-ikn-green/10" />

      <div className="relative z-10 w-full max-w-sm">
        {/* Brand mark */}
        <div className="flex flex-col items-center gap-4 mb-8">
          <div className="w-16 h-16 rounded-3xl bg-ikn-gold shadow-lg shadow-ikn-gold/30 flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="none" className="w-9 h-9">
              <path d="M12 3L4 8v8l8 5 8-5V8L12 3z" fill="white" fillOpacity="0.95" />
              <path d="M12 3v13M4 8l8 8 8-8" stroke="rgba(24,80,136,0.4)" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
          <div className="text-center">
            <h1 className="text-white text-2xl font-extrabold tracking-wide">SAKTI OIKN</h1>
            <p className="text-white/50 text-xs tracking-widest uppercase font-medium mt-1">
              Platform Integrasi Anggaran
            </p>
          </div>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-card-hover p-8">
          <div className="text-center mb-6">
            <h2 className="text-lg font-bold text-ikn-dark">Masuk ke Dashboard</h2>
            <p className="text-sm text-gray-400 mt-1">
              Gunakan akun SSO OIKN Anda untuk melanjutkan
            </p>
          </div>

          {isSsoEnabled() ? (
            <button
              onClick={handleSsoLogin}
              className="w-full inline-flex items-center justify-center gap-2.5 py-3.5 px-4 bg-ikn-green
                         hover:bg-ikn-green-dark text-white font-semibold rounded-xl transition-all
                         active:scale-[0.98] shadow-sm"
            >
              <ArrowRightStartOnRectangleIcon className="w-5 h-5" />
              Login dengan SSO OIKN
            </button>
          ) : (
            <div className="flex items-start gap-3 p-4 bg-ikn-gold-light border border-ikn-gold-soft rounded-xl text-sm text-ikn-gold-dark">
              <LockClosedIcon className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <p>
                SSO belum dikonfigurasi. Hubungi administrator untuk mengatur koneksi Keycloak.
              </p>
            </div>
          )}

          <div className="flex items-center gap-2 mt-6 pt-5 border-t border-gray-100 text-xs text-gray-400">
            <ShieldCheckIcon className="w-4 h-4 text-ikn-green flex-shrink-0" />
            <span>Akses internal OIKN — tidak memerlukan registrasi</span>
          </div>
        </div>

        <div className="text-center mt-6 space-y-1">
          <p className="text-white/40 text-[11px] font-medium">
            Dibangun oleh Direktorat Data dan Kecerdasan Buatan
          </p>
          <p className="text-white/30 text-[11px]">
            © 2026 Otorita Ibu Kota Nusantara · Biro POKS · v1.0.0
          </p>
        </div>
      </div>
    </div>
  )
}

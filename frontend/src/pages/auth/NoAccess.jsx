import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ShieldExclamationIcon,
  ArrowLeftIcon,
  EnvelopeIcon,
} from '@heroicons/react/24/outline'

// Shown when a user authenticates successfully with SSO but their account has
// no recognised role (staff/superadmin) — i.e. they are not authorised to use
// the dashboard. The SSO callback redirects here on a 403, stashing the
// backend message + email in sessionStorage.
const DEFAULT_MESSAGE =
  'Akun Anda belum memiliki akses ke aplikasi ini. Hubungi administrator untuk mendapatkan role yang sesuai.'

// TODO: confirm the real administrator contact for role requests.
const ADMIN_EMAIL = 'admin.sakti@ikn.go.id'

export default function NoAccessPage() {
  const navigate = useNavigate()
  const [message, setMessage] = useState(DEFAULT_MESSAGE)
  const [email, setEmail] = useState('')

  useEffect(() => {
    const stored = sessionStorage.getItem('access_denied_message')
    const storedEmail = sessionStorage.getItem('access_denied_email')
    if (stored) setMessage(stored)
    if (storedEmail) setEmail(storedEmail)
    // Consume once so a manual refresh doesn't show stale data.
    sessionStorage.removeItem('access_denied_message')
    sessionStorage.removeItem('access_denied_email')
  }, [])

  const backToLogin = () => navigate('/login', { replace: true })

  return (
    <div className="min-h-screen bg-ikn-blue flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative brand blobs */}
      <div className="pointer-events-none absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white/5" />
      <div className="pointer-events-none absolute -bottom-32 -left-20 w-80 h-80 rounded-full bg-ikn-gold/10" />

      <div className="relative z-10 w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-card-hover p-8 text-center">
          {/* Icon */}
          <div className="w-16 h-16 rounded-3xl bg-ikn-red-light flex items-center justify-center mx-auto mb-5">
            <ShieldExclamationIcon className="w-9 h-9 text-ikn-red" />
          </div>

          <h1 className="text-xl font-extrabold text-ikn-dark">Akses Tidak Diizinkan</h1>
          <p className="text-sm text-gray-500 mt-3 leading-relaxed">{message}</p>

          {email && (
            <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 bg-ikn-bg rounded-xl text-xs font-medium text-gray-500">
              <EnvelopeIcon className="w-4 h-4" />
              {email}
            </div>
          )}

          {/* Admin contact */}
          <div className="mt-6 p-4 bg-ikn-blue-light rounded-xl text-left">
            <p className="text-xs font-semibold text-ikn-blue uppercase tracking-wider mb-1">
              Butuh akses?
            </p>
            <p className="text-sm text-gray-600 leading-relaxed">
              Hubungi administrator di{' '}
              <a href={`mailto:${ADMIN_EMAIL}`} className="font-semibold text-ikn-blue hover:underline">
                {ADMIN_EMAIL}
              </a>{' '}
              dengan menyertakan nama dan unit kerja Anda untuk pemberian role.
            </p>
          </div>

          <button
            onClick={backToLogin}
            className="mt-6 w-full inline-flex items-center justify-center gap-2 py-3 px-4 bg-ikn-blue
                       hover:bg-ikn-blue-dark text-white font-semibold rounded-xl transition-all
                       active:scale-[0.98] shadow-sm"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Kembali ke Halaman Login
          </button>
        </div>

        <p className="text-center text-white/30 text-[11px] mt-6">
          © 2026 Otorita Ibu Kota Nusantara · Biro POKS
        </p>
      </div>
    </div>
  )
}

import { useEffect } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  HomeIcon,
  ChartBarIcon,
  BuildingOffice2Icon,
  ServerStackIcon,
  UsersIcon,
  ClipboardDocumentListIcon,
  ArrowRightStartOnRectangleIcon,
  UserCircleIcon,
  XMarkIcon,
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon,
} from '@heroicons/react/24/outline'
import {
  HomeIcon as HomeSolid,
  ChartBarIcon as ChartSolid,
  BuildingOffice2Icon as BuildingSolid,
  ServerStackIcon as ServerSolid,
  UsersIcon as UsersSolid,
  ClipboardDocumentListIcon as ClipboardSolid,
} from '@heroicons/react/24/solid'
import useAuthStore from '../../store/authStore'
import { authService } from '../../services/auth'

const navItems = [
  { to: '/overview',          label: 'Overview',        icon: HomeIcon,            iconActive: HomeSolid    },
  { to: '/satker-detail',     label: 'Detail Satker',   icon: ChartBarIcon,        iconActive: ChartSolid   },
  { to: '/satker-management', label: 'Kelola Satker',   icon: BuildingOffice2Icon, iconActive: BuildingSolid },
  { to: '/monitoring',        label: 'Monitoring Sync', icon: ServerStackIcon,     iconActive: ServerSolid  },
  { to: '/activity',          label: 'Log Aktivitas',   icon: ClipboardDocumentListIcon, iconActive: ClipboardSolid },
  { to: '/users',             label: 'Pengguna',        icon: UsersIcon,           iconActive: UsersSolid   },
]

const ROLE_LABEL = { superadmin: 'Super Admin', staff: 'Staff' }

export default function Sidebar({
  mobileOpen = false,
  onClose = () => {},
  collapsed = false,
  onToggleCollapse = () => {},
}) {
  const navigate    = useNavigate()
  const { user, setUser, logout, accessToken } = useAuthStore()

  // `collapsed` is a desktop-only concern: the mobile drawer always shows the
  // full layout. So collapse styles are applied with the `lg:` prefix, never
  // unconditionally — `hide` collapses an element only from lg upward.
  const hide = collapsed ? 'lg:hidden' : ''

  // Hydrate user profile from /api/auth/me/ if we have a token but no user in store
  useEffect(() => {
    if (accessToken && !user) {
      authService.getMe()
        .then(data => setUser(data))
        .catch(() => {})  // 401 handled by axios interceptor
    }
  }, [accessToken, user, setUser])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <aside
      className={`fixed lg:sticky top-0 left-0 z-40 w-64 ${collapsed ? 'lg:w-[76px]' : 'lg:w-64'} h-screen bg-ikn-blue flex flex-col
                  overflow-hidden shadow-sidebar transition-[transform,width] duration-300 ease-out
                  lg:translate-x-0 ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      aria-label="Navigasi utama"
    >
      {/* Decorative background blobs */}
      <div className="pointer-events-none absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/5" />
      <div className="pointer-events-none absolute top-32 -left-8 w-24 h-24 rounded-full bg-ikn-gold/10" />

      {/* Logo / Brand area */}
      <div className="relative z-10 px-5 pt-7 pb-6">
        <div className={`flex items-center gap-3 ${collapsed ? 'lg:justify-center' : ''}`}>
          <div className="w-10 h-10 rounded-2xl bg-ikn-gold shadow-lg shadow-ikn-gold/40 flex items-center justify-center flex-shrink-0">
            <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6">
              <path d="M12 3L4 8v8l8 5 8-5V8L12 3z" fill="white" fillOpacity="0.95"/>
              <path d="M12 3v13M4 8l8 8 8-8" stroke="rgba(24,80,136,0.4)" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <div className={`flex-1 ${hide}`}>
            <div className="text-white font-bold text-[15px] leading-tight tracking-wide">SAKTI OIKN</div>
            <div className="text-white/45 text-[10px] mt-0.5 tracking-widest uppercase font-medium">Biro POKS</div>
          </div>
          {/* Close button — mobile drawer only */}
          <button
            onClick={onClose}
            aria-label="Tutup menu navigasi"
            className="lg:hidden w-8 h-8 rounded-lg flex items-center justify-center text-white/70 hover:bg-white/10 transition-colors flex-shrink-0"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Divider */}
      <div className="mx-5 border-t border-white/10 mb-3" />

      {/* Section label */}
      <div className={`px-5 mb-2 ${hide}`}>
        <span className="text-[9px] font-bold tracking-[0.15em] uppercase text-white/30">Menu Utama</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto scrollbar-thin">
        {navItems.map(({ to, label, icon: Icon, iconActive: IconActive }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onClose}
            title={collapsed ? label : undefined}
            className={({ isActive }) =>
              `group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                collapsed ? 'lg:justify-center lg:px-2' : ''
              } ${
                isActive
                  ? 'bg-white/15 text-white'
                  : 'text-white/60 hover:bg-white/8 hover:text-white/90'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span className={`absolute left-0 w-1 h-6 rounded-r-full bg-ikn-gold transition-all duration-200 ${
                  isActive ? 'opacity-100 scale-y-100' : 'opacity-0 scale-y-0'
                }`} />
                <span className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-150 ${
                  isActive ? 'bg-ikn-gold/20' : 'bg-white/0 group-hover:bg-white/10'
                }`}>
                  {isActive
                    ? <IconActive style={{width:'18px',height:'18px'}} className="text-ikn-gold" />
                    : <Icon      style={{width:'18px',height:'18px'}} />
                  }
                </span>
                <span className={hide}>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Collapse toggle — desktop only */}
      <div className="hidden lg:block px-3 pt-2">
        <button
          onClick={onToggleCollapse}
          aria-label={collapsed ? 'Lebarkan menu' : 'Ciutkan menu'}
          title={collapsed ? 'Lebarkan menu' : 'Ciutkan menu'}
          className={`group flex items-center gap-3 w-full px-3 py-2 rounded-xl text-white/45 hover:bg-white/8 hover:text-white/80 transition-all duration-150 ${
            collapsed ? 'justify-center px-2' : ''
          }`}
        >
          <span className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0">
            {collapsed
              ? <ChevronDoubleRightIcon style={{width:'18px',height:'18px'}} />
              : <ChevronDoubleLeftIcon  style={{width:'18px',height:'18px'}} />}
          </span>
          <span className={`text-xs font-medium ${hide}`}>Ciutkan menu</span>
        </button>
      </div>

      {/* Logged-in user panel */}
      {user && (
        <>
          <div className="mx-5 border-t border-white/10 mt-2" />
          <div className="px-4 py-3">
            <div className={`flex items-center gap-3 ${collapsed ? 'lg:justify-center' : ''}`}>
              <div
                className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0"
                title={collapsed ? user.display_name : undefined}
              >
                <UserCircleIcon className="w-6 h-6 text-white/60" />
              </div>
              <div className={`flex-1 min-w-0 ${hide}`}>
                <p className="text-white text-xs font-semibold truncate leading-tight">{user.display_name}</p>
                <p className="text-white/40 text-[10px] truncate">{user.email}</p>
                {user.unit_eselon_ii && (
                  <p className="text-[10px] text-white/30 truncate mt-0.5" title={user.unit_eselon_ii.nama}>
                    {user.unit_eselon_ii.nama}
                  </p>
                )}
                <div className="flex items-center gap-1.5 mt-1.5">
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-ikn-gold/20 text-ikn-gold uppercase tracking-wide">
                    {ROLE_LABEL[user.role] || user.role}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={handleLogout}
              title={collapsed ? 'Keluar' : undefined}
              className={`mt-3 w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-white/50 hover:bg-white/8 hover:text-white/80 text-xs transition-colors ${
                collapsed ? 'lg:justify-center lg:px-0' : ''
              }`}
            >
              <ArrowRightStartOnRectangleIcon className="w-3.5 h-3.5 flex-shrink-0" />
              <span className={hide}>Keluar</span>
            </button>
          </div>
        </>
      )}

      {/* Footer */}
      <div className="mx-5 border-t border-white/10" />
      <div className="px-5 py-4">
        <div className={`flex items-center gap-2 mb-1 ${collapsed ? 'lg:justify-center' : ''}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-ikn-green animate-pulse flex-shrink-0" title="Sistem aktif" />
          <span className={`text-white/40 text-[11px] ${hide}`}>Sistem aktif</span>
        </div>
        <div className={hide}>
          <p className="text-white/30 text-[10px] leading-relaxed font-medium">
            Dibangun oleh Direktorat Data dan Kecerdasan Buatan
          </p>
          <p className="text-white/15 text-[10px] mt-1.5">© 2026 Otorita Ibu Kota Nusantara · v1.0.0</p>
        </div>
      </div>
    </aside>
  )
}

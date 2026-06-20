import { NavLink } from 'react-router-dom'
import {
  HomeIcon,
  ChartBarIcon,
  BuildingOffice2Icon,
} from '@heroicons/react/24/outline'

const navItems = [
  { to: '/overview', label: 'Overview', icon: HomeIcon },
  { to: '/satker-detail', label: 'Detail Satker', icon: ChartBarIcon },
  { to: '/satker-management', label: 'Kelola Satker', icon: BuildingOffice2Icon },
]

export default function Sidebar() {
  return (
    <aside className="w-64 min-h-screen bg-primary-900 text-white flex flex-col">
      <div className="px-6 py-5 border-b border-blue-800">
        <h1 className="text-xl font-bold leading-tight">SAKTI Dashboard</h1>
        <p className="text-xs text-blue-300 mt-1">OIKN — Biro POKS</p>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-700 text-white'
                  : 'text-blue-200 hover:bg-blue-800 hover:text-white'
              }`
            }
          >
            <Icon className="w-5 h-5 shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="px-4 py-3 text-xs text-blue-400 border-t border-blue-800">
        Akses internal — jaringan OIKN
      </div>
    </aside>
  )
}

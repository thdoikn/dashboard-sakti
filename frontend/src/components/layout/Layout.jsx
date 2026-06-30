import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Bars3Icon } from '@heroicons/react/24/outline'
import Sidebar from './Sidebar'

export default function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false)
  // Desktop collapse state, persisted so it survives reloads.
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem('sidebar_collapsed') === '1'
  )
  const toggleCollapse = () => {
    setCollapsed((c) => {
      const next = !c
      localStorage.setItem('sidebar_collapsed', next ? '1' : '0')
      return next
    })
  }

  return (
    <div className="flex min-h-screen bg-ikn-bg">
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-ikn-dark/40 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      <Sidebar
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
        collapsed={collapsed}
        onToggleCollapse={toggleCollapse}
      />

      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Mobile top bar — only visible below lg, where the sidebar is hidden */}
        <header className="lg:hidden sticky top-0 z-20 flex items-center gap-3 bg-ikn-blue px-4 py-3 shadow-sidebar">
          <button
            onClick={() => setMobileOpen(true)}
            aria-label="Buka menu navigasi"
            className="w-9 h-9 rounded-lg flex items-center justify-center text-white/90 hover:bg-white/10 active:scale-95 transition-all"
          >
            <Bars3Icon className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-ikn-gold flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4">
                <path d="M12 3L4 8v8l8 5 8-5V8L12 3z" fill="white" fillOpacity="0.95" />
                <path d="M12 3v13M4 8l8 8 8-8" stroke="rgba(24,80,136,0.4)" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
            <span className="text-white font-bold text-sm tracking-wide">SAKTI OIKN</span>
          </div>
        </header>

        <main className="flex-1 overflow-auto min-h-0">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

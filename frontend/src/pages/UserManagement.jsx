import { useEffect, useState } from 'react'
import {
  UserCircleIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
  UsersIcon,
} from '@heroicons/react/24/outline'
import { ShieldCheckIcon } from '@heroicons/react/24/solid'
import apiClient from '../api/client'
import { TableSkeleton } from '../components/ui/Skeleton'

// ── Helpers ───────────────────────────────────────────────────────────────────

const ROLE_LABEL = {
  superadmin: 'Super Admin',
  staff:      'Staff',
}

const ROLE_COLOR = {
  superadmin: 'bg-ikn-red-light text-ikn-red-dark',
  staff:      'bg-ikn-blue-light text-ikn-blue',
}

const JENIS_LABEL = {
  kedeputian:  'Kedeputian',
  sekretariat: 'Sekretariat',
  unit_kerja:  'Unit Kerja',
}

function fmtDate(iso) {
  if (!iso) return 'Belum pernah login'
  return new Date(iso).toLocaleString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function timeAgo(iso) {
  if (!iso) return null
  const diff = Date.now() - new Date(iso).getTime()
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days  = Math.floor(diff / 86400000)
  if (mins < 1)   return 'Baru saja'
  if (mins < 60)  return `${mins} menit lalu`
  if (hours < 24) return `${hours} jam lalu`
  return `${days} hari lalu`
}

// ── Components ────────────────────────────────────────────────────────────────

function RoleBadge({ role }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${ROLE_COLOR[role] || 'bg-gray-100 text-gray-500'}`}>
      {role === 'superadmin' && <ShieldCheckIcon className="w-3.5 h-3.5" />}
      {ROLE_LABEL[role] || role}
    </span>
  )
}

function UserRow({ user }) {
  const ago = timeAgo(user.last_login)
  return (
    <tr className="border-t border-gray-100 hover:bg-ikn-blue-light/30 transition-colors">
      <td className="ikn-table-td">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-ikn-green-light flex items-center justify-center flex-shrink-0">
            <UserCircleIcon className="w-6 h-6 text-ikn-green" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-ikn-dark leading-tight truncate">{user.display_name}</p>
            <p className="text-xs text-gray-400 truncate">{user.email}</p>
          </div>
        </div>
      </td>
      <td className="ikn-table-td">
        <RoleBadge role={user.role} />
      </td>
      <td className="ikn-table-td hidden md:table-cell">
        <div className="text-sm text-gray-700 leading-tight">
          {user.unit_eselon_ii?.nama || <span className="text-gray-300">—</span>}
        </div>
        {user.unit_eselon_i && (
          <div className="text-xs text-gray-400 mt-0.5">
            {JENIS_LABEL[user.unit_eselon_i.jenis] || ''} · {user.unit_eselon_i.nama}
          </div>
        )}
      </td>
      <td className="ikn-table-td hidden lg:table-cell">
        <p className="text-xs text-gray-600">{user.jabatan || <span className="text-gray-300">—</span>}</p>
        {user.nip && <p className="text-xs text-gray-400 mt-0.5">NIP {user.nip}</p>}
      </td>
      <td className="ikn-table-td text-right">
        <p className="text-xs text-gray-700">{fmtDate(user.last_login)}</p>
        {ago && <p className="text-xs text-gray-400 mt-0.5">{ago}</p>}
      </td>
    </tr>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function UserManagement() {
  const [users,   setUsers]   = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)
  const [search,  setSearch]  = useState('')

  const fetchUsers = () => {
    setLoading(true)
    setError(null)
    apiClient.get('/users/')
      .then(r => setUsers(r.data))
      .catch(e => setError(e.response?.data?.detail || 'Gagal memuat data pengguna'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchUsers() }, [])

  const filtered = users.filter(u => {
    const q = search.toLowerCase()
    return (
      u.display_name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.unit_eselon_ii?.nama || '').toLowerCase().includes(q) ||
      (u.unit_eselon_i?.nama  || '').toLowerCase().includes(q) ||
      (u.jabatan || '').toLowerCase().includes(q) ||
      (u.nip || '').includes(q)
    )
  })

  // Group by role for section headers
  const groups = [
    { key: 'superadmin', label: 'Super Admin', users: filtered.filter(u => u.role === 'superadmin') },
    { key: 'staff',      label: 'Staff',       users: filtered.filter(u => u.role === 'staff') },
  ].filter(g => g.users.length > 0)

  return (
    <div className="flex flex-col min-h-screen">
      {/* Page header */}
      <div className="bg-white border-b border-gray-100 px-4 sm:px-8 py-5 sticky top-0 z-10">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-gray-400 font-medium mb-1">
              <span className="text-ikn-blue font-semibold">SAKTI</span>
              <span>/</span>
              <span>Pengguna</span>
            </div>
            <h1 className="text-xl font-extrabold text-ikn-dark leading-tight">Manajemen Pengguna</h1>
            <p className="text-xs text-gray-400 mt-1">
              {loading ? 'Memuat…' : `${users.length} pengguna terdaftar via SSO OIKN`}
            </p>
          </div>
          <button
            onClick={fetchUsers}
            disabled={loading}
            className="ikn-btn-secondary disabled:opacity-50"
          >
            <ArrowPathIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-4 sm:px-8 py-6 space-y-5">
        {/* Search */}
        <div className="relative max-w-md">
          <MagnifyingGlassIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Cari nama, email, unit, jabatan, NIP…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="ikn-input pl-10"
          />
        </div>

        {/* Error state */}
        {error && (
          <div className="ikn-card border border-red-200 bg-ikn-red-light p-4 text-sm text-ikn-red-dark">
            {error}
          </div>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div className="ikn-card overflow-hidden">
            <TableSkeleton rows={6} cols={5} />
          </div>
        )}

        {/* Empty */}
        {!loading && !error && groups.length === 0 && (
          <div className="ikn-card p-12 text-center">
            <div className="flex flex-col items-center gap-3 text-gray-300">
              <UsersIcon className="w-12 h-12 opacity-40" />
              <p className="text-sm text-gray-400 font-medium">
                {search ? 'Tidak ada pengguna yang cocok dengan pencarian.' : 'Belum ada pengguna terdaftar.'}
              </p>
            </div>
          </div>
        )}

        {/* User groups */}
        {!loading && groups.map(group => (
          <div key={group.key} className="ikn-card overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
              <div className="w-1 h-5 rounded-full bg-ikn-blue" />
              <h3 className="font-bold text-ikn-dark text-sm">{group.label}</h3>
              <span className="ml-1 px-2 py-0.5 bg-ikn-blue-light text-ikn-blue text-xs font-bold rounded-full">
                {group.users.length}
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-ikn-bg/60">
                    <th className="ikn-table-th">Pengguna</th>
                    <th className="ikn-table-th">Role</th>
                    <th className="ikn-table-th hidden md:table-cell">Unit Organisasi</th>
                    <th className="ikn-table-th hidden lg:table-cell">Jabatan / NIP</th>
                    <th className="ikn-table-th text-right">Login Terakhir</th>
                  </tr>
                </thead>
                <tbody>
                  {group.users.map(u => <UserRow key={u.id} user={u} />)}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

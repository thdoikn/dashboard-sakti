import { useEffect, useState } from 'react'
import {
  UserCircleIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline'
import { ShieldCheckIcon } from '@heroicons/react/24/solid'
import apiClient from '../api/client'

// ── Helpers ───────────────────────────────────────────────────────────────────

const ROLE_LABEL = {
  admin:    'Admin',
  operator: 'Operator',
  viewer:   'Viewer',
}

const ROLE_COLOR = {
  admin:    'bg-red-100 text-red-700',
  operator: 'bg-blue-100 text-blue-700',
  viewer:   'bg-gray-100 text-gray-600',
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
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${ROLE_COLOR[role] || ROLE_COLOR.viewer}`}>
      {role === 'admin' && <ShieldCheckIcon className="w-3 h-3" />}
      {ROLE_LABEL[role] || role}
    </span>
  )
}

function UserRow({ user }) {
  const ago = timeAgo(user.last_login)
  return (
    <tr className="border-t border-gray-100 hover:bg-gray-50 transition-colors">
      <td className="py-3 px-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-ikn-green/10 flex items-center justify-center flex-shrink-0">
            <UserCircleIcon className="w-6 h-6 text-ikn-green" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900 leading-tight">{user.display_name}</p>
            <p className="text-xs text-gray-400">{user.email}</p>
          </div>
        </div>
      </td>
      <td className="py-3 px-4">
        <RoleBadge role={user.role} />
      </td>
      <td className="py-3 px-4 hidden md:table-cell">
        <div className="text-sm text-gray-700 leading-tight">
          {user.unit_eselon_ii?.nama || <span className="text-gray-400">—</span>}
        </div>
        {user.unit_eselon_i && (
          <div className="text-xs text-gray-400 mt-0.5">
            {JENIS_LABEL[user.unit_eselon_i.jenis] || ''} · {user.unit_eselon_i.nama}
          </div>
        )}
      </td>
      <td className="py-3 px-4 hidden lg:table-cell">
        <p className="text-xs text-gray-500">{user.jabatan || <span className="text-gray-300">—</span>}</p>
        {user.nip && <p className="text-xs text-gray-400 mt-0.5">NIP {user.nip}</p>}
      </td>
      <td className="py-3 px-4 text-right">
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
    { key: 'admin',    label: 'Admin',    users: filtered.filter(u => u.role === 'admin') },
    { key: 'operator', label: 'Operator', users: filtered.filter(u => u.role === 'operator') },
    { key: 'viewer',   label: 'Viewer',   users: filtered.filter(u => u.role === 'viewer') },
  ].filter(g => g.users.length > 0)

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Manajemen Pengguna</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {loading ? 'Memuat…' : `${users.length} pengguna terdaftar`}
          </p>
        </div>
        <button
          onClick={fetchUsers}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
        >
          <ArrowPathIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Cari nama, email, direktorat, jabatan, NIP…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-ikn-green/30 bg-white"
        />
      </div>

      {/* Error state */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700 mb-4">
          {error}
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-4 border-t border-gray-100 first:border-t-0">
              <div className="w-9 h-9 rounded-full bg-gray-100 animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-gray-100 rounded animate-pulse w-1/3" />
                <div className="h-2 bg-gray-100 rounded animate-pulse w-1/4" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* User groups */}
      {!loading && groups.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-10 text-center text-sm text-gray-400">
          {search ? 'Tidak ada pengguna yang cocok dengan pencarian.' : 'Belum ada pengguna terdaftar.'}
        </div>
      )}

      {!loading && groups.map(group => (
        <div key={group.key} className="mb-5">
          <div className="flex items-center gap-2 mb-2">
            <RoleBadge role={group.key} />
            <span className="text-xs text-gray-400">{group.users.length} pengguna</span>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="py-2 px-4 text-xs font-medium text-gray-500">Pengguna</th>
                  <th className="py-2 px-4 text-xs font-medium text-gray-500">Role</th>
                  <th className="py-2 px-4 text-xs font-medium text-gray-500 hidden md:table-cell">Unit Organisasi</th>
                  <th className="py-2 px-4 text-xs font-medium text-gray-500 hidden lg:table-cell">Jabatan / NIP</th>
                  <th className="py-2 px-4 text-xs font-medium text-gray-500 text-right">Login Terakhir</th>
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
  )
}

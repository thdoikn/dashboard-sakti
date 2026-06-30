import { useEffect, useState } from 'react'
import {
  PlusIcon,
  PencilSquareIcon,
  XCircleIcon,
  TrashIcon,
  ArrowDownTrayIcon,
  ArrowRightEndOnRectangleIcon,
  ClipboardDocumentListIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline'
import { getActivityLog } from '../api/activity'
import { TableSkeleton } from '../components/ui/Skeleton'

// ── Action presentation ────────────────────────────────────────────────────
const ACTIONS = {
  satker_create:     { label: 'Tambah Satker',       Icon: PlusIcon,                     badge: 'bg-ikn-green-light text-ikn-green-dark', dot: 'bg-ikn-green' },
  satker_update:     { label: 'Ubah Satker',         Icon: PencilSquareIcon,             badge: 'bg-ikn-blue-light text-ikn-blue',       dot: 'bg-ikn-blue' },
  satker_deactivate: { label: 'Nonaktifkan Satker',  Icon: XCircleIcon,                  badge: 'bg-ikn-gold-light text-ikn-gold-dark',  dot: 'bg-ikn-gold' },
  satker_delete:     { label: 'Hapus Satker',        Icon: TrashIcon,                    badge: 'bg-ikn-red-light text-ikn-red-dark',    dot: 'bg-ikn-red' },
  export_excel:      { label: 'Unduh Data',          Icon: ArrowDownTrayIcon,            badge: 'bg-ikn-blue-light text-ikn-blue',       dot: 'bg-ikn-blue' },
  login:             { label: 'Login',               Icon: ArrowRightEndOnRectangleIcon, badge: 'bg-gray-100 text-gray-600',             dot: 'bg-gray-400' },
}

// Filter chips — `null` value means "all".
const FILTERS = [
  { value: '',                  label: 'Semua' },
  { value: 'satker_create',     label: 'Tambah' },
  { value: 'satker_update',     label: 'Ubah' },
  { value: 'satker_deactivate', label: 'Nonaktif' },
  { value: 'export_excel',      label: 'Unduh' },
  { value: 'login',             label: 'Login' },
]

function fmtDateTime(iso) {
  if (!iso) return '—'
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
  if (days < 30)  return `${days} hari lalu`
  return null
}

function ActionBadge({ action }) {
  const cfg = ACTIONS[action] ?? { label: action, Icon: ClipboardDocumentListIcon, badge: 'bg-gray-100 text-gray-600' }
  const { Icon } = cfg
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.badge}`}>
      <Icon className="w-3.5 h-3.5" />
      {cfg.label}
    </span>
  )
}

function ActivityRow({ log }) {
  const ago = timeAgo(log.created_at)
  return (
    <tr className="border-t border-gray-100 hover:bg-ikn-blue-light/30 transition-colors">
      {/* Actor */}
      <td className="ikn-table-td">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-ikn-blue-light flex items-center justify-center flex-shrink-0">
            <UserCircleIcon className="w-6 h-6 text-ikn-blue" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-ikn-dark leading-tight truncate">
              {log.actor_name || 'Sistem'}
            </p>
            {log.description && (
              <p className="text-xs text-gray-400 truncate max-w-[320px]" title={log.description}>
                {log.description}
              </p>
            )}
          </div>
        </div>
      </td>
      {/* Jabatan / Direktorat */}
      <td className="ikn-table-td hidden md:table-cell">
        <p className="text-sm text-gray-700 leading-tight">
          {log.actor_jabatan || <span className="text-gray-300">—</span>}
        </p>
        {log.actor_unit && <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[220px]">{log.actor_unit}</p>}
      </td>
      {/* Action */}
      <td className="ikn-table-td">
        <ActionBadge action={log.action} />
      </td>
      {/* Time */}
      <td className="ikn-table-td text-right whitespace-nowrap">
        <p className="text-xs text-gray-700">{fmtDateTime(log.created_at)}</p>
        {ago && <p className="text-xs text-gray-400 mt-0.5">{ago}</p>}
      </td>
    </tr>
  )
}

// ── Page ────────────────────────────────────────────────────────────────────
export default function ActivityLog() {
  const [logs,    setLogs]    = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)
  const [action,  setAction]  = useState('')
  const [search,  setSearch]  = useState('')
  const [page,    setPage]    = useState(1)
  const [hasNext, setHasNext] = useState(false)
  const [total,   setTotal]   = useState(0)

  // Reset to page 1 whenever a filter changes.
  useEffect(() => { setPage(1) }, [action, search])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    const params = { page }
    if (action) params.action = action
    if (search) params.search = search

    getActivityLog(params)
      .then((res) => {
        if (cancelled) return
        const data = res.data
        const results = data.results ?? data
        setHasNext(Boolean(data.next))
        setTotal(data.count ?? results.length)
        // Append when paging, replace on a fresh filter/page-1 load.
        setLogs((prev) => (page > 1 ? [...prev, ...results] : results))
      })
      .catch((e) => {
        if (!cancelled) setError(e.response?.data?.detail || 'Gagal memuat log aktivitas')
      })
      .finally(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [action, search, page])

  const isInitialLoad = loading && page === 1

  return (
    <div className="flex flex-col min-h-screen">
      {/* Page header */}
      <div className="bg-white border-b border-gray-100 px-4 sm:px-8 py-5 sticky top-0 z-10">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-gray-400 font-medium mb-1">
              <span className="text-ikn-blue font-semibold">SAKTI</span>
              <span>/</span>
              <span>Log Aktivitas</span>
            </div>
            <h1 className="text-xl font-extrabold text-ikn-dark leading-tight">Log Aktivitas</h1>
            <p className="text-xs text-gray-400 mt-1">
              Jejak audit — siapa mengubah satker, mengunduh data, dan masuk ke sistem
            </p>
          </div>
          <button
            onClick={() => { setSearch(''); setAction(''); setPage(1) }}
            disabled={isInitialLoad}
            className="ikn-btn-secondary disabled:opacity-50"
          >
            <ArrowPathIcon className={`w-4 h-4 ${isInitialLoad ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Segarkan</span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-4 sm:px-8 py-6 space-y-4">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex items-center gap-1.5 p-1 bg-gray-100 rounded-xl flex-wrap">
            {FILTERS.map((f) => (
              <button
                key={f.value || 'all'}
                onClick={() => setAction(f.value)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  action === f.value ? 'bg-ikn-blue text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <div className="relative sm:ml-auto sm:max-w-xs w-full">
            <MagnifyingGlassIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Cari nama, jabatan, unit…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="ikn-input pl-10"
            />
          </div>
        </div>

        {error && (
          <div className="ikn-card border border-red-200 bg-ikn-red-light p-4 text-sm text-ikn-red-dark">
            {error}
          </div>
        )}

        {/* Table */}
        <div className="ikn-card overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
            <div className="w-1 h-5 rounded-full bg-ikn-blue" />
            <h3 className="font-bold text-ikn-dark text-sm">Aktivitas Terbaru</h3>
            {!isInitialLoad && (
              <span className="ml-1 px-2 py-0.5 bg-ikn-blue-light text-ikn-blue text-xs font-bold rounded-full">
                {total}
              </span>
            )}
          </div>

          {isInitialLoad ? (
            <TableSkeleton rows={8} cols={4} />
          ) : logs.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <div className="flex flex-col items-center gap-3 text-gray-300">
                <ClipboardDocumentListIcon className="w-12 h-12 opacity-40" />
                <p className="text-sm text-gray-400 font-medium">
                  {action || search ? 'Tidak ada aktivitas yang cocok.' : 'Belum ada aktivitas tercatat.'}
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-ikn-bg/60">
                    <th className="ikn-table-th">Pengguna</th>
                    <th className="ikn-table-th hidden md:table-cell">Jabatan / Direktorat</th>
                    <th className="ikn-table-th">Aksi</th>
                    <th className="ikn-table-th text-right">Waktu</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => <ActivityRow key={log.id} log={log} />)}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Load more */}
        {!isInitialLoad && hasNext && (
          <div className="flex justify-center">
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={loading}
              className="ikn-btn-ghost disabled:opacity-50"
            >
              {loading
                ? <span className="w-4 h-4 border-2 border-gray-300 border-t-gray-500 rounded-full animate-spin" />
                : null}
              Muat lebih banyak
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

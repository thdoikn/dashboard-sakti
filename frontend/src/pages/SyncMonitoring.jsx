import { useEffect, useState } from 'react'
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ArrowPathIcon,
  ClockIcon,
  CircleStackIcon,
  CalendarDaysIcon,
  ServerStackIcon,
} from '@heroicons/react/24/outline'
import { CheckCircleIcon as CheckSolid } from '@heroicons/react/24/solid'
import { getSyncHistory } from '../api/anggaran'

// ── Helpers ──────────────────────────────────────────────────────────────────

const fmtDuration = (sec) => {
  if (sec == null) return '—'
  if (sec < 60) return `${sec}d`
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}m ${s}d`
}

const fmtDateTime = (iso) => {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

const fmtDate = (iso) => {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

/** Return array of 'YYYY-MM-DD' strings for the last N days, oldest first */
const lastNDays = (n) => {
  const days = []
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    days.push(d.toISOString().slice(0, 10))
  }
  return days
}

// ── Status config ─────────────────────────────────────────────────────────────

const STATUS = {
  success: {
    label: 'Berhasil',
    cellBg: 'bg-ikn-green',
    badgeBg: 'bg-ikn-green-light',
    badgeText: 'text-ikn-green-dark',
    bannerBg: 'bg-ikn-green-light border-ikn-green-soft',
    bannerText: 'text-ikn-green-dark',
    Icon: CheckCircleIcon,
    dot: 'bg-ikn-green',
  },
  partial: {
    label: 'Parsial',
    cellBg: 'bg-ikn-gold',
    badgeBg: 'bg-ikn-gold-light',
    badgeText: 'text-ikn-gold-dark',
    bannerBg: 'bg-ikn-gold-light border-ikn-gold-soft',
    bannerText: 'text-ikn-gold-dark',
    Icon: ExclamationTriangleIcon,
    dot: 'bg-ikn-gold',
  },
  failed: {
    label: 'Gagal',
    cellBg: 'bg-ikn-red',
    badgeBg: 'bg-ikn-red-light',
    badgeText: 'text-ikn-red-dark',
    bannerBg: 'bg-ikn-red-light border-red-200',
    bannerText: 'text-ikn-red-dark',
    Icon: XCircleIcon,
    dot: 'bg-ikn-red',
  },
  none: {
    label: 'Tidak ada',
    cellBg: 'bg-gray-200',
    badgeBg: 'bg-gray-100',
    badgeText: 'text-gray-400',
    bannerBg: 'bg-gray-50 border-gray-200',
    bannerText: 'text-gray-500',
    Icon: ClockIcon,
    dot: 'bg-gray-300',
  },
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatusBadge({ status, size = 'sm' }) {
  const cfg = STATUS[status] ?? STATUS.none
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-semibold
                      ${cfg.badgeBg} ${cfg.badgeText}
                      ${size === 'lg' ? 'text-sm' : 'text-xs'}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  )
}

function TaskRow({ task }) {
  const isOk = task.status === 'success'
  return (
    <div className={`flex items-start gap-3 py-2.5 px-3 rounded-xl text-sm
                     ${isOk ? 'bg-ikn-green-light/50' : 'bg-ikn-red-light/50'}`}>
      {isOk
        ? <CheckSolid className="w-4 h-4 text-ikn-green mt-0.5 flex-shrink-0" />
        : <XCircleIcon className="w-4 h-4 text-ikn-red mt-0.5 flex-shrink-0" />}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <code className="text-xs font-mono font-bold text-ikn-dark">{task.task_name}</code>
          {task.satker_nama && (
            <span className="text-xs text-gray-500">— {task.satker_nama}</span>
          )}
          <span className="ml-auto text-xs text-gray-400">{fmtDuration(task.duration_seconds)}</span>
          {task.row_count != null && (
            <span className="text-xs text-ikn-blue font-semibold">{task.row_count} baris</span>
          )}
        </div>
        {task.error_message && (
          <p className="mt-1 text-xs text-ikn-red-dark bg-red-50 rounded-lg px-2 py-1 font-mono break-all">
            {task.error_message}
          </p>
        )}
      </div>
    </div>
  )
}

function RunRow({ run }) {
  const [open, setOpen] = useState(false)
  const cfg = STATUS[run.overall_status] ?? STATUS.none

  return (
    <div className="border-t border-gray-100 first:border-0">
      {/* Summary row */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-4 px-6 py-4 hover:bg-ikn-blue-light/30 transition-colors text-left"
      >
        <div className="w-36 flex-shrink-0">
          <p className="text-sm font-semibold text-ikn-dark">{fmtDate(run.date)}</p>
          <p className="text-xs text-gray-400 mt-0.5">{new Date(run.started_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB</p>
        </div>

        <StatusBadge status={run.overall_status} />

        <div className="flex items-center gap-5 ml-2 text-sm text-gray-600 flex-1">
          <span className="flex items-center gap-1">
            <CheckCircleIcon className="w-3.5 h-3.5 text-ikn-green" />
            {run.success_count}/{run.total_tasks} task
          </span>
          <span className="flex items-center gap-1">
            <ClockIcon className="w-3.5 h-3.5 text-gray-400" />
            {fmtDuration(run.duration_seconds)}
          </span>
          {run.total_rows > 0 && (
            <span className="flex items-center gap-1">
              <CircleStackIcon className="w-3.5 h-3.5 text-ikn-blue" />
              {run.total_rows.toLocaleString('id-ID')} baris
            </span>
          )}
        </div>

        <div className="flex-shrink-0 text-gray-400">
          {open ? <ChevronUpIcon className="w-4 h-4" /> : <ChevronDownIcon className="w-4 h-4" />}
        </div>
      </button>

      {/* Task detail */}
      {open && (
        <div className="px-6 pb-4 space-y-2 bg-gray-50/50">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 pt-1">
            Detail Task — {run.dag_run_id}
          </p>
          {run.tasks.map((t, i) => <TaskRow key={i} task={t} />)}
        </div>
      )}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function SyncMonitoring() {
  const [runs,    setRuns]    = useState([])
  const [loading, setLoading] = useState(true)
  const [days,    setDays]    = useState(30)

  useEffect(() => {
    setLoading(true)
    getSyncHistory({ days })
      .then((res) => setRuns(res.data))
      .catch(() => setRuns([]))
      .finally(() => setLoading(false))
  }, [days])

  // ── Derived stats ──
  const latestRun     = runs[0] ?? null
  const latestStatus  = latestRun?.overall_status ?? 'none'
  const successRuns   = runs.filter((r) => r.overall_status === 'success').length
  const successRate   = runs.length > 0 ? Math.round((successRuns / runs.length) * 100) : null
  const avgDuration   = runs.length > 0
    ? Math.round(runs.filter((r) => r.duration_seconds).reduce((s, r) => s + r.duration_seconds, 0) / runs.filter((r) => r.duration_seconds).length)
    : null
  const totalRows     = runs.reduce((s, r) => s + r.total_rows, 0)

  // ── Calendar data ──
  const calDays  = lastNDays(days)
  const runByDate = {}
  runs.forEach((r) => { runByDate[r.date] = r })

  const bannerCfg = STATUS[latestStatus]
  const BannerIcon = bannerCfg.Icon

  return (
    <div className="flex flex-col min-h-screen">
      {/* Page header */}
      <div className="bg-white border-b border-gray-100 px-4 sm:px-8 py-5 sticky top-0 z-10">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-gray-400 font-medium mb-1">
              <span className="text-ikn-blue font-semibold">SAKTI</span>
              <span>/</span>
              <span>Monitoring Sinkronisasi</span>
            </div>
            <h1 className="text-xl font-extrabold text-ikn-dark">Monitoring Sinkronisasi</h1>
          </div>
          <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-xl">
            {[7, 14, 30].map((d) => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  days === d ? 'bg-ikn-blue text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {d} hari
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 px-4 sm:px-8 py-6 space-y-6">

        {/* Health banner */}
        <div className={`ikn-card border p-5 ${bannerCfg.bannerBg}`}>
          {loading ? (
            <div className="flex items-center gap-3 text-gray-400">
              <ArrowPathIcon className="w-5 h-5 animate-spin" />
              <span className="text-sm font-medium">Memuat status sinkronisasi...</span>
            </div>
          ) : (
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <BannerIcon className={`w-8 h-8 ${bannerCfg.bannerText} flex-shrink-0`} />
                <div>
                  <p className={`font-extrabold text-base ${bannerCfg.bannerText}`}>
                    {latestStatus === 'success' && 'Sinkronisasi berjalan normal'}
                    {latestStatus === 'partial' && 'Sinkronisasi parsial — beberapa task gagal'}
                    {latestStatus === 'failed'  && 'Sinkronisasi gagal — periksa log task'}
                    {latestStatus === 'none'    && 'Belum ada data sinkronisasi'}
                  </p>
                  {latestRun && (
                    <p className={`text-sm mt-0.5 ${bannerCfg.bannerText} opacity-75`}>
                      Run terakhir: {fmtDateTime(latestRun.started_at)} · {latestRun.success_count}/{latestRun.total_tasks} task berhasil
                      {latestRun.duration_seconds != null && ` · Durasi ${fmtDuration(latestRun.duration_seconds)}`}
                    </p>
                  )}
                </div>
              </div>
              <div className={`text-xs font-semibold px-3 py-1.5 rounded-xl border ${bannerCfg.badgeBg} ${bannerCfg.badgeText}`}>
                {latestRun ? `DAG: ${latestRun.dag_run_id}` : 'Airflow belum pernah jalan'}
              </div>
            </div>
          )}
        </div>

        {/* Stats + Calendar row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* Stats cards */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Total Run',      value: loading ? '—' : runs.length,                          Icon: ServerStackIcon,  color: 'text-ikn-blue'  },
              { label: 'Tingkat Sukses', value: loading ? '—' : successRate != null ? `${successRate}%` : '—', Icon: CheckCircleIcon,   color: 'text-ikn-green' },
              { label: 'Rerata Durasi',  value: loading ? '—' : fmtDuration(avgDuration),              Icon: ClockIcon,        color: 'text-ikn-gold-dark' },
              { label: 'Total Baris',    value: loading ? '—' : totalRows.toLocaleString('id-ID'),     Icon: CircleStackIcon,  color: 'text-ikn-blue'  },
            ].map(({ label, value, Icon, color }) => (
              <div key={label} className="ikn-card p-4">
                <Icon className={`w-5 h-5 mb-2 ${color}`} />
                <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">{label}</p>
                <p className={`text-xl font-extrabold mt-0.5 ${color}`}>{value}</p>
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="lg:col-span-2 ikn-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <CalendarDaysIcon className="w-4 h-4 text-ikn-blue" />
              <h3 className="font-bold text-ikn-dark text-sm">Riwayat {days} Hari Terakhir</h3>
              <div className="ml-auto flex items-center gap-3 text-xs text-gray-400">
                {[
                  { status: 'success', label: 'Berhasil' },
                  { status: 'partial', label: 'Parsial'  },
                  { status: 'failed',  label: 'Gagal'    },
                  { status: 'none',    label: 'Tidak ada'},
                ].map(({ status, label }) => (
                  <span key={status} className="flex items-center gap-1">
                    <span className={`w-2.5 h-2.5 rounded-sm ${STATUS[status].cellBg}`} />
                    {label}
                  </span>
                ))}
              </div>
            </div>

            <div className="grid gap-1.5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(32px, 1fr))' }}>
              {calDays.map((dateStr) => {
                const run = runByDate[dateStr]
                const status = run?.overall_status ?? 'none'
                const cfg = STATUS[status]
                const dayNum = new Date(dateStr).getDate()
                return (
                  <div
                    key={dateStr}
                    title={run
                      ? `${dateStr}\n${cfg.label} · ${run.success_count}/${run.total_tasks} task · ${fmtDuration(run.duration_seconds)}`
                      : `${dateStr} — Tidak ada run`}
                    className={`aspect-square rounded-lg flex flex-col items-center justify-center
                                cursor-default transition-transform hover:scale-110 ${cfg.cellBg}`}
                  >
                    <span className={`text-[10px] font-bold leading-none
                      ${status === 'none' ? 'text-gray-400' : 'text-white'}`}>
                      {dayNum}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Run history table */}
        <div className="ikn-card overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
            <div className="w-1 h-5 rounded-full bg-ikn-blue" />
            <h3 className="font-bold text-ikn-dark text-sm">Riwayat Run</h3>
            <span className="ml-1 px-2 py-0.5 bg-ikn-blue-light text-ikn-blue text-xs font-bold rounded-full">
              {runs.length}
            </span>
            <p className="ml-1 text-xs text-gray-400">— klik baris untuk lihat detail task</p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="flex flex-col items-center gap-3 text-gray-300">
                <div className="w-8 h-8 border-2 border-ikn-blue-soft border-t-ikn-blue rounded-full animate-spin" />
                <span className="text-sm text-gray-400">Memuat riwayat...</span>
              </div>
            </div>
          ) : runs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-300">
              <ServerStackIcon className="w-12 h-12 opacity-40" />
              <div className="text-center">
                <p className="text-sm text-gray-400 font-medium">Belum ada riwayat sinkronisasi</p>
                <p className="text-xs text-gray-300 mt-1">DAG Airflow belum pernah dijalankan dalam {days} hari terakhir</p>
              </div>
            </div>
          ) : (
            <div>
              {runs.map((run) => (
                <RunRow key={run.dag_run_id} run={run} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

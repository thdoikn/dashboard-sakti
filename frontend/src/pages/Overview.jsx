import { useEffect, useState } from 'react'
import {
  BanknotesIcon,
  ArrowTrendingUpIcon,
  ChartPieIcon,
  CalendarIcon,
} from '@heroicons/react/24/outline'
import { getAnggaran, getRealisasi } from '../api/anggaran'
import StatCard from '../components/StatCard'
import SyncStatus from '../components/SyncStatus'
import ExportButton from '../components/ExportButton'
import DisbursementChart from '../components/charts/DisbursementChart'
import AbsorptionGauge from '../components/charts/AbsorptionGauge'

const formatIDR = (val) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(val)

const YEARS = [2024, 2025, 2026]

export default function Overview() {
  const [granularity, setGranularity] = useState('monthly')
  const [tahun, setTahun]             = useState(2026)
  const [anggaran, setAnggaran]       = useState([])
  const [realisasi, setRealisasi]     = useState([])
  const [loading, setLoading]         = useState(true)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      getAnggaran({ tahun_anggaran: tahun }),
      getRealisasi({ tahun_anggaran: tahun }),
    ])
      .then(([angRes, realRes]) => {
        setAnggaran(angRes.data.results ?? angRes.data)
        setRealisasi(realRes.data.results ?? realRes.data)
      })
      .finally(() => setLoading(false))
  }, [tahun])

  const totalAnggaran  = anggaran.reduce((s, a) => s + parseFloat(a.total      ?? 0), 0)
  const totalRealisasi = realisasi.reduce((s, r) => s + parseFloat(r.nilai_sp2d ?? 0), 0)
  const persen         = totalAnggaran > 0 ? (totalRealisasi / totalAnggaran) * 100 : 0

  // Group realisasi by period based on selected granularity
  const groupedMap = {}
  realisasi.forEach((r) => {
    if (!r.tgl_sp2d) return
    const key = granularity === 'monthly' ? r.tgl_sp2d.slice(0, 7) : r.tgl_sp2d.slice(0, 10)
    groupedMap[key] = (groupedMap[key] || 0) + parseFloat(r.nilai_sp2d || 0)
  })
  // Divide annual budget equally across periods (12 months or 365 days)
  const periodsInYear   = granularity === 'monthly' ? 12 : 365
  const anggaranPerPeriod = totalAnggaran / periodsInYear
  const chartData = Object.entries(groupedMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([period, realisasiVal]) => ({
      period,
      anggaran: anggaranPerPeriod,
      realisasi: realisasiVal,
      persen_serapan: anggaranPerPeriod > 0 ? (realisasiVal / anggaranPerPeriod) * 100 : 0,
    }))

  return (
    <div className="flex flex-col min-h-screen">
      {/* Page header */}
      <div className="bg-white border-b border-gray-100 px-8 py-5 sticky top-0 z-10">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-gray-400 font-medium mb-1">
              <span className="text-ikn-blue font-semibold">SAKTI</span>
              <span>/</span>
              <span>Overview</span>
            </div>
            <h1 className="text-xl font-extrabold text-ikn-dark leading-tight">
              Overview Anggaran OIKN
            </h1>
          </div>

          <div className="flex items-center gap-3 flex-wrap justify-end">
            <SyncStatus />
            <ExportButton params={{ tahun_anggaran: tahun, granularity }} />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-8 py-6 space-y-6">

        {/* Year filter row */}
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-4 h-4 text-gray-400" />
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider mr-1">Tahun Anggaran</span>
          {YEARS.map((y) => (
            <button
              key={y}
              onClick={() => setTahun(y)}
              className={`px-4 py-1.5 rounded-xl text-sm font-semibold transition-all duration-150 ${
                tahun === y
                  ? 'bg-ikn-blue text-white shadow-sm'
                  : 'bg-white text-gray-500 border border-gray-200 hover:border-ikn-blue hover:text-ikn-blue'
              }`}
            >
              {y}
            </button>
          ))}
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            title="Total Anggaran"
            value={loading ? '—' : formatIDR(totalAnggaran)}
            subtitle="Seluruh satker aktif"
            color="blue"
            icon={BanknotesIcon}
          />
          <StatCard
            title="Total Realisasi"
            value={loading ? '—' : formatIDR(totalRealisasi)}
            subtitle="SP2D diterbitkan"
            color="green"
            icon={ArrowTrendingUpIcon}
          />
          <StatCard
            title="Serapan Anggaran"
            value={loading ? '—' : `${persen.toFixed(1)}%`}
            subtitle="Realisasi ÷ Anggaran"
            color="gold"
            icon={ChartPieIcon}
          />
        </div>

        {/* Chart section */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Trend chart */}
          <div className="lg:col-span-3 ikn-card p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="font-bold text-ikn-dark text-base">Tren Realisasi</h2>
                <p className="text-xs text-gray-400 mt-0.5">Anggaran vs. realisasi per periode</p>
              </div>
              <div className="flex gap-1 p-1 bg-gray-100 rounded-xl">
                {[
                  { key: 'monthly', label: 'Bulanan' },
                  { key: 'daily',   label: 'Harian' },
                ].map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setGranularity(key)}
                    className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all duration-150 ${
                      granularity === key
                        ? 'bg-ikn-blue text-white shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            {loading ? (
              <div className="h-64 flex items-center justify-center">
                <div className="flex flex-col items-center gap-3 text-gray-300">
                  <div className="w-8 h-8 border-2 border-ikn-blue-soft border-t-ikn-blue rounded-full animate-spin" />
                  <span className="text-sm">Memuat data...</span>
                </div>
              </div>
            ) : (
              <DisbursementChart data={chartData} />
            )}
          </div>

          {/* Absorption gauge */}
          <div className="ikn-card p-6 flex flex-col items-center justify-center">
            <AbsorptionGauge percentage={persen} />
          </div>
        </div>

        {/* Summary row */}
        {!loading && totalAnggaran > 0 && (
          <div className="ikn-card p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1 h-4 rounded-full bg-ikn-blue" />
              <h3 className="font-bold text-ikn-dark text-sm">Ringkasan Eksekutif</h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              {[
                { label: 'Sisa Anggaran',  value: formatIDR(totalAnggaran - totalRealisasi), color: 'text-gray-700' },
                { label: 'Jumlah Bulan',   value: `${chartData.length} bulan`,               color: 'text-ikn-blue'  },
                { label: 'Rerata/Bulan',   value: formatIDR(totalRealisasi / Math.max(chartData.length, 1)), color: 'text-ikn-green' },
                { label: 'Target Serapan', value: '≥ 95%',                                   color: 'text-ikn-gold-dark' },
              ].map(({ label, value, color }) => (
                <div key={label} className="py-2">
                  <p className="text-xs text-gray-400 font-medium mb-1">{label}</p>
                  <p className={`text-base font-extrabold ${color}`}>{value}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

import { useEffect, useState } from 'react'
import {
  BanknotesIcon,
  ArrowTrendingUpIcon,
  ChartPieIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline'
import { getSatkerList } from '../api/satker'
import { getAnggaran, getRealisasi, getCapaianRO } from '../api/anggaran'
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

const formatIDRFull = (val) =>
  new Intl.NumberFormat('id-ID').format(parseFloat(val || 0))

const YEARS = [2024, 2025, 2026]

export default function SatkerDetail() {
  const [satkerList,     setSatkerList]     = useState([])
  const [selectedSatker, setSelectedSatker] = useState('')
  const [tahun,          setTahun]          = useState(2026)
  const [granularity,    setGranularity]    = useState('monthly')
  const [anggaran,       setAnggaran]       = useState([])
  const [realisasi,      setRealisasi]      = useState([])
  const [capaian,        setCapaian]        = useState([])
  const [loading,        setLoading]        = useState(false)

  useEffect(() => {
    getSatkerList({ aktif: true }).then((res) => {
      const list = res.data.results ?? res.data
      setSatkerList(list)
      if (list.length > 0) setSelectedSatker(list[0].id)
    })
  }, [])

  useEffect(() => {
    if (!selectedSatker) return
    setLoading(true)
    Promise.all([
      getAnggaran({ satker: selectedSatker, tahun_anggaran: tahun }),
      getRealisasi({ satker: selectedSatker, tahun_anggaran: tahun }),
      getCapaianRO({ satker: selectedSatker }),
    ])
      .then(([a, r, c]) => {
        setAnggaran(a.data.results ?? a.data)
        setRealisasi(r.data.results ?? r.data)
        setCapaian(c.data.results ?? c.data)
      })
      .finally(() => setLoading(false))
  }, [selectedSatker, tahun])

  const totalAnggaran  = anggaran.reduce((s, a)  => s + parseFloat(a.total       ?? 0), 0)
  const totalRealisasi = realisasi.reduce((s, r)  => s + parseFloat(r.nilai_sp2d  ?? 0), 0)
  const persen         = totalAnggaran > 0 ? (totalRealisasi / totalAnggaran) * 100 : 0

  // Group realisasi by period based on selected granularity
  const groupedMap = {}
  realisasi.forEach((r) => {
    if (!r.tgl_sp2d) return
    const key = granularity === 'monthly' ? r.tgl_sp2d.slice(0, 7) : r.tgl_sp2d.slice(0, 10)
    groupedMap[key] = (groupedMap[key] || 0) + parseFloat(r.nilai_sp2d || 0)
  })
  const periodsInYear     = granularity === 'monthly' ? 12 : 365
  const anggaranPerPeriod = totalAnggaran / periodsInYear
  const chartData = Object.entries(groupedMap).sort(([a], [b]) => a.localeCompare(b)).map(([period, val]) => ({
    period,
    anggaran: anggaranPerPeriod,
    realisasi: val,
    persen_serapan: anggaranPerPeriod > 0 ? (val / anggaranPerPeriod) * 100 : 0,
  }))

  const satkerNama = satkerList.find((s) => s.id === selectedSatker)?.nama_satker ?? ''

  return (
    <div className="flex flex-col min-h-screen">
      {/* Page header */}
      <div className="bg-white border-b border-gray-100 px-8 py-5 sticky top-0 z-10">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-gray-400 font-medium mb-1">
              <span className="text-ikn-blue font-semibold">SAKTI</span>
              <span>/</span>
              <span>Detail Satker</span>
            </div>
            <h1 className="text-xl font-extrabold text-ikn-dark leading-tight">Detail Satker</h1>
          </div>
          <ExportButton params={{ satker: selectedSatker, tahun_anggaran: tahun }} />
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border-b border-gray-100 px-8 py-3.5">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
            <FunnelIcon className="w-3.5 h-3.5" />
            Filter
          </div>

          <select
            value={selectedSatker}
            onChange={(e) => setSelectedSatker(Number(e.target.value))}
            className="ikn-select min-w-[220px]"
          >
            {satkerList.map((s) => (
              <option key={s.id} value={s.id}>{s.nama_satker}</option>
            ))}
          </select>

          <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-xl">
            {YEARS.map((y) => (
              <button
                key={y}
                onClick={() => setTahun(y)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  tahun === y
                    ? 'bg-ikn-blue text-white shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {y}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-8 py-6 space-y-6">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="flex flex-col items-center gap-3 text-gray-300">
              <div className="w-10 h-10 border-2 border-ikn-blue-soft border-t-ikn-blue rounded-full animate-spin" />
              <span className="text-sm text-gray-400">Memuat data satker...</span>
            </div>
          </div>
        ) : (
          <>
            {/* KPI cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { title: 'Total Anggaran',  value: formatIDR(totalAnggaran),  bg: 'bg-ikn-blue-light',  ic: 'text-ikn-blue',     Icon: BanknotesIcon },
                { title: 'Total Realisasi', value: formatIDR(totalRealisasi), bg: 'bg-ikn-green-light', ic: 'text-ikn-green',    Icon: ArrowTrendingUpIcon },
                { title: 'Serapan',         value: `${persen.toFixed(1)}%`,   bg: 'bg-ikn-gold-light',  ic: 'text-ikn-gold-dark',Icon: ChartPieIcon },
              ].map(({ title, value, bg, ic, Icon }) => (
                <div key={title} className="ikn-card p-5 flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${bg}`}>
                    <Icon className={`w-6 h-6 ${ic}`} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{title}</p>
                    <p className="text-xl font-extrabold text-ikn-dark mt-0.5">{value}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Chart + Gauge */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
              <div className="lg:col-span-3 ikn-card p-6">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h2 className="font-bold text-ikn-dark">Tren Realisasi</h2>
                    <p className="text-xs text-gray-400 mt-0.5">{satkerNama}</p>
                  </div>
                  <div className="flex gap-1 p-1 bg-gray-100 rounded-xl">
                    {[
                      { key: 'monthly', label: 'Bulanan' },
                      { key: 'daily',   label: 'Harian'  },
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
                <DisbursementChart data={chartData} />
              </div>
              <div className="ikn-card p-6 flex items-center justify-center">
                <AbsorptionGauge percentage={persen} />
              </div>
            </div>

            {/* Budget table */}
            <div className="ikn-card overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
                <div className="w-1 h-5 rounded-full bg-ikn-blue" />
                <h3 className="font-bold text-ikn-dark text-sm">Detail Anggaran per Output</h3>
                {anggaran.length > 20 && (
                  <span className="ml-auto text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                    Menampilkan 20 dari {anggaran.length}
                  </span>
                )}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-ikn-bg/60">
                      <th className="ikn-table-th">Kode Item</th>
                      <th className="ikn-table-th">Uraian Output</th>
                      <th className="ikn-table-th text-right">Total (Rp)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {anggaran.slice(0, 20).map((a, i) => (
                      <tr key={a.id}
                        className={`border-t border-gray-100 hover:bg-ikn-blue-light/40 transition-colors ${
                          i % 2 === 0 ? '' : 'bg-gray-50/40'
                        }`}
                      >
                        <td className="ikn-table-td">
                          <code className="text-xs font-mono bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md">
                            {a.kode_item}
                          </code>
                        </td>
                        <td className="ikn-table-td font-medium text-ikn-dark">{a.uraian_item}</td>
                        <td className="ikn-table-td text-right font-semibold text-ikn-blue">
                          {formatIDRFull(a.total)}
                        </td>
                      </tr>
                    ))}
                    {anggaran.length === 0 && (
                      <tr>
                        <td colSpan={3} className="px-6 py-12 text-center text-gray-300">
                          <div className="flex flex-col items-center gap-2">
                            <BanknotesIcon className="w-10 h-10 opacity-30" />
                            <span className="text-sm">Tidak ada data anggaran</span>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

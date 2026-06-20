import { useEffect, useState } from 'react'
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

export default function Overview() {
  const [granularity, setGranularity] = useState('monthly')
  const [tahun, setTahun] = useState(2026)
  const [anggaran, setAnggaran] = useState([])
  const [realisasi, setRealisasi] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      getAnggaran({ tahun_anggaran: tahun }),
      getRealisasi({ tahun_anggaran: tahun }),
    ])
      .then(([angRes, realRes]) => {
        setAnggaran(angRes.data.results || angRes.data)
        setRealisasi(realRes.data.results || realRes.data)
      })
      .finally(() => setLoading(false))
  }, [tahun])

  const totalAnggaran = anggaran.reduce((sum, a) => sum + parseFloat(a.total || 0), 0)
  const totalRealisasi = realisasi.reduce((sum, r) => sum + parseFloat(r.nilai_sp2d || 0), 0)
  const persen = totalAnggaran > 0 ? (totalRealisasi / totalAnggaran) * 100 : 0

  // Build chart data grouped by month
  const monthlyMap = {}
  realisasi.forEach((r) => {
    if (!r.tgl_sp2d) return
    const month = r.tgl_sp2d.slice(0, 7) // YYYY-MM
    monthlyMap[month] = (monthlyMap[month] || 0) + parseFloat(r.nilai_sp2d || 0)
  })
  const anggaranPerMonth = totalAnggaran / 12
  const chartData = Object.entries(monthlyMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([period, realisasiVal]) => ({
      period,
      anggaran: anggaranPerMonth,
      realisasi: realisasiVal,
      persen_serapan: anggaranPerMonth > 0 ? (realisasiVal / anggaranPerMonth) * 100 : 0,
    }))

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Overview Anggaran OIKN</h2>
          <p className="text-sm text-gray-500 mt-0.5">Seluruh satker aktif — Tahun {tahun}</p>
        </div>
        <div className="flex items-center gap-3">
          <SyncStatus />
          <ExportButton params={{ tahun_anggaran: tahun, granularity }} />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <StatCard
          title="Total Anggaran"
          value={formatIDR(totalAnggaran)}
          subtitle="Seluruh satker aktif"
          color="blue"
        />
        <StatCard
          title="Total Realisasi"
          value={formatIDR(totalRealisasi)}
          subtitle="SP2D terbit"
          color="green"
        />
        <StatCard
          title="Serapan Anggaran"
          value={`${persen.toFixed(1)}%`}
          subtitle="Realisasi / Anggaran"
          color="orange"
        />
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="col-span-3 bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800">Tren Realisasi</h3>
            <div className="flex rounded-lg overflow-hidden border border-gray-200">
              {['monthly', 'daily'].map((g) => (
                <button
                  key={g}
                  onClick={() => setGranularity(g)}
                  className={`px-3 py-1.5 text-xs font-medium ${
                    granularity === g ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {g === 'monthly' ? 'Bulanan' : 'Harian'}
                </button>
              ))}
            </div>
          </div>
          {loading ? (
            <div className="h-64 flex items-center justify-center text-gray-400">Memuat data...</div>
          ) : (
            <DisbursementChart data={chartData} />
          )}
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center justify-center">
          <AbsorptionGauge percentage={persen} />
        </div>
      </div>
    </div>
  )
}

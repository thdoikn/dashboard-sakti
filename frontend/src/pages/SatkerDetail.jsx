import { useEffect, useState } from 'react'
import { getSatkerList } from '../api/satker'
import { getAnggaran, getRealisasi, getCapaianRO } from '../api/anggaran'
import ExportButton from '../components/ExportButton'
import DisbursementChart from '../components/charts/DisbursementChart'

const formatIDR = (val) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(val)

export default function SatkerDetail() {
  const [satkerList, setSatkerList] = useState([])
  const [selectedSatker, setSelectedSatker] = useState('')
  const [tahun, setTahun] = useState(2026)
  const [anggaran, setAnggaran] = useState([])
  const [realisasi, setRealisasi] = useState([])
  const [capaian, setCapaian] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    getSatkerList({ aktif: true }).then((res) => {
      const list = res.data.results || res.data
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
        setAnggaran(a.data.results || a.data)
        setRealisasi(r.data.results || r.data)
        setCapaian(c.data.results || c.data)
      })
      .finally(() => setLoading(false))
  }, [selectedSatker, tahun])

  const totalAnggaran = anggaran.reduce((s, a) => s + parseFloat(a.total || 0), 0)
  const totalRealisasi = realisasi.reduce((s, r) => s + parseFloat(r.nilai_sp2d || 0), 0)

  // Build chart data grouped by month
  const monthlyMap = {}
  realisasi.forEach((r) => {
    if (!r.tgl_sp2d) return
    const m = r.tgl_sp2d.slice(0, 7)
    monthlyMap[m] = (monthlyMap[m] || 0) + parseFloat(r.nilai_sp2d || 0)
  })
  const chartData = Object.entries(monthlyMap).sort().map(([period, val]) => ({
    period,
    anggaran: totalAnggaran / 12,
    realisasi: val,
    persen_serapan: totalAnggaran > 0 ? (val / (totalAnggaran / 12)) * 100 : 0,
  }))

  const satkerNama = satkerList.find((s) => s.id === selectedSatker)?.nama_satker || ''

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Detail Satker</h2>
        <ExportButton params={{ satker: selectedSatker, tahun_anggaran: tahun }} label="Export Excel" />
      </div>

      <div className="flex gap-3">
        <select
          value={selectedSatker}
          onChange={(e) => setSelectedSatker(Number(e.target.value))}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
        >
          {satkerList.map((s) => (
            <option key={s.id} value={s.id}>{s.nama_satker}</option>
          ))}
        </select>
        <select
          value={tahun}
          onChange={(e) => setTahun(Number(e.target.value))}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
        >
          {[2024, 2025, 2026].map((y) => <option key={y}>{y}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="py-16 text-center text-gray-400">Memuat data...</div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
              <p className="text-sm text-blue-700 font-medium">Total Anggaran</p>
              <p className="text-xl font-bold text-blue-800 mt-1">{formatIDR(totalAnggaran)}</p>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-xl p-5">
              <p className="text-sm text-green-700 font-medium">Total Realisasi</p>
              <p className="text-xl font-bold text-green-800 mt-1">{formatIDR(totalRealisasi)}</p>
            </div>
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-5">
              <p className="text-sm text-orange-700 font-medium">Serapan</p>
              <p className="text-xl font-bold text-orange-800 mt-1">
                {totalAnggaran > 0 ? ((totalRealisasi / totalAnggaran) * 100).toFixed(1) : '0.0'}%
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-800 mb-4">Tren Realisasi — {satkerNama}</h3>
            <DisbursementChart data={chartData} />
          </div>

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100">
              <h3 className="font-semibold text-gray-800">Detail Anggaran per Output</h3>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">Kode Item</th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">Uraian</th>
                  <th className="px-4 py-2.5 text-right text-xs font-semibold text-gray-500 uppercase">Total (Rp)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {anggaran.slice(0, 20).map((a) => (
                  <tr key={a.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 text-gray-600 font-mono text-xs">{a.kode_item}</td>
                    <td className="px-4 py-2 text-gray-800">{a.uraian_item}</td>
                    <td className="px-4 py-2 text-right text-gray-800">
                      {new Intl.NumberFormat('id-ID').format(parseFloat(a.total || 0))}
                    </td>
                  </tr>
                ))}
                {anggaran.length === 0 && (
                  <tr><td colSpan={3} className="px-4 py-8 text-center text-gray-400">Tidak ada data</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}

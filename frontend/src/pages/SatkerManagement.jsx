import { useEffect, useState } from 'react'
import { getSatkerList, createSatker, updateSatker, deleteSatker } from '../api/satker'

const emptyForm = {
  kode_satker: '', nama_satker: '', kode_kementerian: '999', kode_kppn: '', aktif: true,
}

export default function SatkerManagement() {
  const [satkerList, setSatkerList] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [editId, setEditId] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)

  const load = () =>
    getSatkerList().then((res) => setSatkerList(res.data.results || res.data))

  useEffect(() => { load() }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (editId) {
        await updateSatker(editId, form)
      } else {
        await createSatker(form)
      }
      setForm(emptyForm)
      setEditId(null)
      setShowForm(false)
      await load()
    } catch (err) {
      alert('Gagal menyimpan data satker.')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (s) => {
    setForm({
      kode_satker: s.kode_satker,
      nama_satker: s.nama_satker,
      kode_kementerian: s.kode_kementerian,
      kode_kppn: s.kode_kppn,
      aktif: s.aktif,
    })
    setEditId(s.id)
    setShowForm(true)
  }

  const handleDeactivate = async (id) => {
    if (!confirm('Nonaktifkan satker ini?')) return
    const satker = satkerList.find((s) => s.id === id)
    await updateSatker(id, { ...satker, aktif: false })
    await load()
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Kelola Satker</h2>
        <button
          onClick={() => { setForm(emptyForm); setEditId(null); setShowForm(true) }}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
        >
          + Tambah Satker
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-800 mb-4">{editId ? 'Edit Satker' : 'Tambah Satker Baru'}</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Kode Satker</label>
              <input
                required value={form.kode_satker}
                onChange={(e) => setForm({ ...form, kode_satker: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                maxLength={6}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nama Satker</label>
              <input
                required value={form.nama_satker}
                onChange={(e) => setForm({ ...form, nama_satker: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Kode Kementerian</label>
              <input
                required value={form.kode_kementerian}
                onChange={(e) => setForm({ ...form, kode_kementerian: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                maxLength={3}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Kode KPPN</label>
              <input
                required value={form.kode_kppn}
                onChange={(e) => setForm({ ...form, kode_kppn: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                maxLength={3}
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox" id="aktif" checked={form.aktif}
                onChange={(e) => setForm({ ...form, aktif: e.target.checked })}
                className="w-4 h-4"
              />
              <label htmlFor="aktif" className="text-sm text-gray-700">Aktif</label>
            </div>
            <div className="col-span-2 flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Kode</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Nama Satker</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">KPPN</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {satkerList.map((s) => (
              <tr key={s.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-mono text-xs text-gray-600">{s.kode_satker}</td>
                <td className="px-4 py-3 font-medium text-gray-900">{s.nama_satker}</td>
                <td className="px-4 py-3 text-gray-600">{s.kode_kppn}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                    s.aktif ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {s.aktif ? 'Aktif' : 'Nonaktif'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button onClick={() => handleEdit(s)} className="text-blue-600 hover:text-blue-800 text-xs font-medium">Edit</button>
                    {s.aktif && (
                      <button onClick={() => handleDeactivate(s.id)} className="text-red-600 hover:text-red-800 text-xs font-medium">Nonaktifkan</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {satkerList.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">Tidak ada data satker</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

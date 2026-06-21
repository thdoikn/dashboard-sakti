import { useEffect, useState } from 'react'
import {
  PlusIcon,
  PencilSquareIcon,
  XCircleIcon,
  XMarkIcon,
  BuildingOffice2Icon,
} from '@heroicons/react/24/outline'
import { getSatkerList, createSatker, updateSatker, deleteSatker } from '../api/satker'

const emptyForm = {
  kode_satker: '', nama_satker: '', kode_kementerian: '999', kode_kppn: '', aktif: true,
}

export default function SatkerManagement() {
  const [satkerList, setSatkerList] = useState([])
  const [form,       setForm]       = useState(emptyForm)
  const [editId,     setEditId]     = useState(null)
  const [showForm,   setShowForm]   = useState(false)
  const [loading,    setLoading]    = useState(false)
  const [listLoading,setListLoading]= useState(true)

  const load = () => {
    setListLoading(true)
    return getSatkerList()
      .then((res) => setSatkerList(res.data.results ?? res.data))
      .finally(() => setListLoading(false))
  }

  useEffect(() => { load() }, [])

  const openCreate = () => {
    setForm(emptyForm)
    setEditId(null)
    setShowForm(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (editId) {
        await updateSatker(editId, form)
      } else {
        await createSatker(form)
      }
      setShowForm(false)
      setForm(emptyForm)
      setEditId(null)
      await load()
    } catch {
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

  const Field = ({ label, children }) => (
    <div>
      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">{label}</label>
      {children}
    </div>
  )

  return (
    <div className="flex flex-col min-h-screen">
      {/* Page header */}
      <div className="bg-white border-b border-gray-100 px-8 py-5 sticky top-0 z-10">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-gray-400 font-medium mb-1">
              <span className="text-ikn-blue font-semibold">SAKTI</span>
              <span>/</span>
              <span>Kelola Satker</span>
            </div>
            <h1 className="text-xl font-extrabold text-ikn-dark leading-tight">Kelola Satker</h1>
          </div>
          <button onClick={openCreate} className="ikn-btn-primary">
            <PlusIcon className="w-4 h-4" />
            Tambah Satker
          </button>
        </div>
      </div>

      {/* Slide-down form panel */}
      {showForm && (
        <div className="bg-white border-b border-gray-100 shadow-sm">
          <div className="px-8 py-6 max-w-3xl">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-ikn-blue-light flex items-center justify-center">
                  {editId ? (
                    <PencilSquareIcon className="w-4 h-4 text-ikn-blue" />
                  ) : (
                    <PlusIcon className="w-4 h-4 text-ikn-blue" />
                  )}
                </div>
                <h2 className="font-bold text-ikn-dark">
                  {editId ? 'Edit Satker' : 'Tambah Satker Baru'}
                </h2>
              </div>
              <button
                onClick={() => setShowForm(false)}
                className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
              <Field label="Kode Satker">
                <input
                  required
                  value={form.kode_satker}
                  onChange={(e) => setForm({ ...form, kode_satker: e.target.value })}
                  className="ikn-input font-mono"
                  maxLength={6}
                  placeholder="XXXXXX"
                />
              </Field>

              <Field label="Nama Satker">
                <input
                  required
                  value={form.nama_satker}
                  onChange={(e) => setForm({ ...form, nama_satker: e.target.value })}
                  className="ikn-input"
                  placeholder="Nama lengkap satker"
                />
              </Field>

              <Field label="Kode Kementerian">
                <input
                  required
                  value={form.kode_kementerian}
                  onChange={(e) => setForm({ ...form, kode_kementerian: e.target.value })}
                  className="ikn-input font-mono"
                  maxLength={3}
                  placeholder="999"
                />
              </Field>

              <Field label="Kode KPPN">
                <input
                  required
                  value={form.kode_kppn}
                  onChange={(e) => setForm({ ...form, kode_kppn: e.target.value })}
                  className="ikn-input font-mono"
                  maxLength={3}
                  placeholder="XXX"
                />
              </Field>

              <div className="col-span-2 flex items-center justify-between pt-2">
                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <div
                    onClick={() => setForm({ ...form, aktif: !form.aktif })}
                    className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${
                      form.aktif ? 'bg-ikn-green' : 'bg-gray-300'
                    }`}
                  >
                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${
                      form.aktif ? 'translate-x-5' : 'translate-x-0'
                    }`} />
                  </div>
                  <span className="text-sm font-medium text-gray-700">
                    {form.aktif ? 'Satker Aktif' : 'Satker Nonaktif'}
                  </span>
                </label>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="ikn-btn-ghost"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="ikn-btn-primary disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Menyimpan...
                      </>
                    ) : (
                      editId ? 'Simpan Perubahan' : 'Tambah Satker'
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 px-8 py-6">
        <div className="ikn-card overflow-hidden">
          {/* Table header */}
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-1 h-5 rounded-full bg-ikn-blue" />
              <h3 className="font-bold text-ikn-dark text-sm">Daftar Satker</h3>
              <span className="ml-1 px-2 py-0.5 bg-ikn-blue-light text-ikn-blue text-xs font-bold rounded-full">
                {satkerList.length}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-ikn-green" /> Aktif:&nbsp;
                <strong>{satkerList.filter((s) => s.aktif).length}</strong>
              </span>
              <span className="text-gray-200">|</span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-gray-300" /> Nonaktif:&nbsp;
                <strong>{satkerList.filter((s) => !s.aktif).length}</strong>
              </span>
            </div>
          </div>

          {listLoading ? (
            <div className="flex items-center justify-center py-16 text-gray-300">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-2 border-ikn-blue-soft border-t-ikn-blue rounded-full animate-spin" />
                <span className="text-sm text-gray-400">Memuat...</span>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-ikn-bg/60">
                    <th className="ikn-table-th">Kode</th>
                    <th className="ikn-table-th">Nama Satker</th>
                    <th className="ikn-table-th">Kementerian</th>
                    <th className="ikn-table-th">KPPN</th>
                    <th className="ikn-table-th">Status</th>
                    <th className="ikn-table-th text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {satkerList.map((s, i) => (
                    <tr
                      key={s.id}
                      className={`border-t border-gray-100 hover:bg-ikn-blue-light/30 transition-colors ${
                        !s.aktif ? 'opacity-60' : ''
                      }`}
                    >
                      <td className="ikn-table-td">
                        <code className="text-xs font-mono bg-gray-100 text-gray-600 px-2 py-1 rounded-md">
                          {s.kode_satker}
                        </code>
                      </td>
                      <td className="ikn-table-td">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                            s.aktif ? 'bg-ikn-blue-light' : 'bg-gray-100'
                          }`}>
                            <BuildingOffice2Icon className={`w-3.5 h-3.5 ${
                              s.aktif ? 'text-ikn-blue' : 'text-gray-400'
                            }`} />
                          </div>
                          <span className="font-semibold text-ikn-dark text-sm">{s.nama_satker}</span>
                        </div>
                      </td>
                      <td className="ikn-table-td font-mono text-xs text-gray-500">{s.kode_kementerian}</td>
                      <td className="ikn-table-td font-mono text-xs text-gray-500">{s.kode_kppn}</td>
                      <td className="ikn-table-td">
                        {s.aktif ? (
                          <span className="ikn-badge-active">
                            <span className="w-1.5 h-1.5 rounded-full bg-ikn-green" />
                            Aktif
                          </span>
                        ) : (
                          <span className="ikn-badge-inactive">
                            <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                            Nonaktif
                          </span>
                        )}
                      </td>
                      <td className="ikn-table-td text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleEdit(s)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-ikn-blue
                                       bg-ikn-blue-light rounded-lg hover:bg-ikn-blue-soft transition-colors"
                          >
                            <PencilSquareIcon className="w-3.5 h-3.5" />
                            Edit
                          </button>
                          {s.aktif && (
                            <button
                              onClick={() => handleDeactivate(s.id)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-ikn-red-dark
                                         bg-ikn-red-light rounded-lg hover:bg-red-100 transition-colors"
                            >
                              <XCircleIcon className="w-3.5 h-3.5" />
                              Nonaktifkan
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {satkerList.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-16 text-center">
                        <div className="flex flex-col items-center gap-3 text-gray-300">
                          <BuildingOffice2Icon className="w-12 h-12 opacity-40" />
                          <div>
                            <p className="text-sm text-gray-400 font-medium">Belum ada data satker</p>
                            <p className="text-xs text-gray-300 mt-1">Klik "Tambah Satker" untuk mulai menambahkan data</p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

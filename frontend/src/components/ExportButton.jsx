import { exportExcel } from '../api/anggaran'

export default function ExportButton({ params = {}, label = 'Export Excel' }) {
  const handleExport = async () => {
    try {
      const res = await exportExcel(params)
      const url = URL.createObjectURL(new Blob([res.data]))
      const a = document.createElement('a')
      a.href = url
      a.download = 'export_sakti.xlsx'
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      alert('Gagal mengunduh file export.')
    }
  }

  return (
    <button
      onClick={handleExport}
      className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
    >
      &#8595; {label}
    </button>
  )
}

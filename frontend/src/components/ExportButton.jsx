import { useState } from 'react'
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline'
import { exportExcel } from '../api/anggaran'
import { useToast } from './ui/Toast'

export default function ExportButton({ params = {}, label = 'Unduh Excel', className = '' }) {
  const toast = useToast()
  const [exporting, setExporting] = useState(false)

  const handleExport = async () => {
    if (exporting) return
    setExporting(true)
    try {
      const res = await exportExcel(params)
      const url = URL.createObjectURL(new Blob([res.data]))
      const a = document.createElement('a')
      a.href = url
      a.download = 'export_sakti.xlsx'
      a.click()
      URL.revokeObjectURL(url)
      toast.success('File Excel berhasil diunduh.')
    } catch {
      toast.error('Gagal mengunduh file export. Coba lagi.')
    } finally {
      setExporting(false)
    }
  }

  return (
    <button
      onClick={handleExport}
      disabled={exporting}
      className={`ikn-btn-success disabled:opacity-60 disabled:cursor-not-allowed ${className}`}
    >
      <ArrowDownTrayIcon className={`w-4 h-4 ${exporting ? 'animate-bounce' : ''}`} />
      {exporting ? 'Mengunduh...' : label}
    </button>
  )
}

import { useEffect, useState } from 'react'
import { getSyncStatus } from '../api/anggaran'
import { ArrowPathIcon } from '@heroicons/react/24/outline'

export default function SyncStatus() {
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getSyncStatus()
      .then((res) => setStatus(res.data))
      .catch(() => setStatus(null))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="inline-flex items-center gap-2 text-xs px-3 py-2 rounded-xl font-medium bg-gray-100 text-gray-400">
        <ArrowPathIcon className="w-3.5 h-3.5 animate-spin" />
        Memeriksa sinkronisasi...
      </div>
    )
  }

  if (!status) return null

  const isOk = status.latest_status === 'success'
  const syncTime = status.last_sync_time
    ? new Date(status.last_sync_time).toLocaleString('id-ID', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      })
    : 'Belum pernah'

  return (
    <div className={`inline-flex items-center gap-2 text-xs px-3.5 py-2 rounded-xl font-medium border ${
      isOk
        ? 'bg-ikn-green-light text-ikn-green-dark border-ikn-green-soft'
        : 'bg-amber-50 text-amber-700 border-amber-200'
    }`}>
      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
        isOk ? 'bg-ikn-green animate-pulse' : 'bg-amber-500 animate-pulse'
      }`} />
      <span className="hidden sm:inline">Sync:</span>
      <span className="font-semibold">{syncTime}</span>
    </div>
  )
}

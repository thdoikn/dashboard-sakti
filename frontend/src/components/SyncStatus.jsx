import { useEffect, useState } from 'react'
import { getSyncStatus } from '../api/anggaran'

export default function SyncStatus() {
  const [status, setStatus] = useState(null)

  useEffect(() => {
    getSyncStatus()
      .then((res) => setStatus(res.data))
      .catch(() => setStatus(null))
  }, [])

  if (!status) return null

  const isOk = status.latest_status === 'success'
  return (
    <div className={`inline-flex items-center gap-2 text-xs px-3 py-1.5 rounded-full font-medium ${
      isOk ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
    }`}>
      <span className={`w-2 h-2 rounded-full ${isOk ? 'bg-green-500' : 'bg-yellow-500'}`} />
      Sinkronisasi terakhir: {status.last_sync_time ? new Date(status.last_sync_time).toLocaleString('id-ID') : 'Belum pernah'}
    </div>
  )
}

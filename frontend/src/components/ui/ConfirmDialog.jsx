import { useEffect, useRef } from 'react'
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline'

// Accessible confirmation modal — replaces native confirm(). Focus-traps the
// confirm button, closes on Escape / backdrop click, and supports a "danger"
// tone for destructive actions.
export default function ConfirmDialog({
  open,
  title = 'Konfirmasi',
  message,
  confirmLabel = 'Lanjutkan',
  cancelLabel = 'Batal',
  tone = 'danger', // 'danger' | 'primary'
  loading = false,
  onConfirm,
  onCancel,
}) {
  const confirmRef = useRef(null)

  useEffect(() => {
    if (!open) return
    confirmRef.current?.focus()
    const onKey = (e) => {
      if (e.key === 'Escape' && !loading) onCancel?.()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, loading, onCancel])

  if (!open) return null

  const confirmCls =
    tone === 'danger'
      ? 'bg-ikn-red text-white hover:bg-ikn-red-dark'
      : 'bg-ikn-blue text-white hover:bg-ikn-blue-dark'

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-ikn-dark/40 backdrop-blur-sm animate-[toastIn_0.15s_ease]"
      onMouseDown={(e) => { if (e.target === e.currentTarget && !loading) onCancel?.() }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
    >
      <div className="bg-white rounded-2xl shadow-card-hover w-full max-w-sm overflow-hidden">
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0
                            ${tone === 'danger' ? 'bg-ikn-red-light' : 'bg-ikn-blue-light'}`}>
              <ExclamationTriangleIcon className={`w-6 h-6 ${tone === 'danger' ? 'text-ikn-red' : 'text-ikn-blue'}`} />
            </div>
            <div className="flex-1 min-w-0">
              <h2 id="confirm-title" className="font-bold text-ikn-dark text-base leading-tight">{title}</h2>
              {message && <p className="text-sm text-gray-500 mt-1.5 leading-relaxed">{message}</p>}
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 px-6 py-4 bg-ikn-bg/60 border-t border-gray-100">
          <button onClick={onCancel} disabled={loading} className="ikn-btn-ghost disabled:opacity-50">
            {cancelLabel}
          </button>
          <button
            ref={confirmRef}
            onClick={onConfirm}
            disabled={loading}
            className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl
                       active:scale-[0.98] transition-all duration-150 shadow-sm
                       disabled:opacity-60 disabled:cursor-not-allowed ${confirmCls}`}
          >
            {loading && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

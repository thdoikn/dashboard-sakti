import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  InformationCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'

// ── Toast context ───────────────────────────────────────────────────────────
// Lightweight, dependency-free toast system. Replaces native alert() so we get
// non-blocking, on-brand feedback that matches the IKN design language.

const ToastContext = createContext(null)

const VARIANTS = {
  success: { Icon: CheckCircleIcon,        ring: 'border-ikn-green-soft',  bar: 'bg-ikn-green',     iconC: 'text-ikn-green' },
  error:   { Icon: XCircleIcon,            ring: 'border-red-200',         bar: 'bg-ikn-red',       iconC: 'text-ikn-red' },
  warning: { Icon: ExclamationTriangleIcon,ring: 'border-ikn-gold-soft',   bar: 'bg-ikn-gold',      iconC: 'text-ikn-gold-dark' },
  info:    { Icon: InformationCircleIcon,  ring: 'border-ikn-blue-soft',   bar: 'bg-ikn-blue',      iconC: 'text-ikn-blue' },
}

let idCounter = 0

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const dismiss = useCallback((id) => {
    setToasts((t) => t.filter((x) => x.id !== id))
  }, [])

  const push = useCallback((message, variant = 'info', duration = 4000) => {
    const id = ++idCounter
    setToasts((t) => [...t, { id, message, variant, duration }])
    return id
  }, [])

  // Convenience helpers
  const toast = {
    success: (m, d) => push(m, 'success', d),
    error:   (m, d) => push(m, 'error', d),
    warning: (m, d) => push(m, 'warning', d),
    info:    (m, d) => push(m, 'info', d),
    dismiss,
  }

  return (
    <ToastContext.Provider value={toast}>
      {children}
      {/* Toast viewport — top-right, above everything */}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2.5 w-[min(360px,calc(100vw-2rem))]">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

function ToastItem({ toast, onDismiss }) {
  const { Icon, ring, bar, iconC } = VARIANTS[toast.variant] ?? VARIANTS.info
  const [leaving, setLeaving] = useState(false)

  useEffect(() => {
    if (!toast.duration) return
    const t = setTimeout(() => setLeaving(true), toast.duration)
    return () => clearTimeout(t)
  }, [toast.duration])

  useEffect(() => {
    if (!leaving) return
    const t = setTimeout(() => onDismiss(toast.id), 220)
    return () => clearTimeout(t)
  }, [leaving, toast.id, onDismiss])

  return (
    <div
      role="status"
      aria-live="polite"
      className={`relative flex items-start gap-3 bg-white rounded-xl shadow-card-hover border ${ring}
                  overflow-hidden pl-4 pr-2 py-3 transition-all duration-200
                  ${leaving ? 'opacity-0 translate-x-4' : 'opacity-100 translate-x-0 animate-[toastIn_0.2s_ease]'}`}
    >
      <span className={`absolute left-0 top-0 bottom-0 w-1 ${bar}`} />
      <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${iconC}`} />
      <p className="flex-1 text-sm text-ikn-dark leading-snug">{toast.message}</p>
      <button
        onClick={() => setLeaving(true)}
        aria-label="Tutup notifikasi"
        className="w-6 h-6 rounded-md flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors flex-shrink-0"
      >
        <XMarkIcon className="w-4 h-4" />
      </button>
    </div>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within a ToastProvider')
  return ctx
}

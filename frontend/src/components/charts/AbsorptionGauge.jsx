export default function AbsorptionGauge({ percentage = 0 }) {
  const clamped = Math.min(100, Math.max(0, percentage))
  const color = clamped >= 80 ? '#22c55e' : clamped >= 50 ? '#f97316' : '#ef4444'
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-32 h-32">
        <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
          <circle cx="18" cy="18" r="15.9" fill="none" stroke="#e5e7eb" strokeWidth="3" />
          <circle
            cx="18" cy="18" r="15.9" fill="none"
            stroke={color} strokeWidth="3"
            strokeDasharray={`${clamped} ${100 - clamped}`}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl font-bold" style={{ color }}>
            {clamped.toFixed(1)}%
          </span>
        </div>
      </div>
      <p className="text-sm text-gray-500">Tingkat Serapan</p>
    </div>
  )
}

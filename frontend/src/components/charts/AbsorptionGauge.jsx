// Radial gauge showing budget absorption percentage using IKN palette
const getColor = (pct) => {
  if (pct >= 80) return { stroke: '#428A40', text: '#2d6229', bg: '#eaf4e9', label: 'Sangat Baik' }
  if (pct >= 60) return { stroke: '#185088', text: '#185088', bg: '#eaf1f9', label: 'Baik' }
  if (pct >= 40) return { stroke: '#DBAF6C', text: '#b8893c', bg: '#faf5ec', label: 'Cukup' }
  return       { stroke: '#EE2F24', text: '#c01f16', bg: '#fde9e8', label: 'Perlu Perhatian' }
}

export default function AbsorptionGauge({ percentage = 0 }) {
  const clamped = Math.min(100, Math.max(0, percentage))
  const { stroke, text, bg, label } = getColor(clamped)

  // SVG arc math: full circle circumference = 2π×15.9 ≈ 99.9
  const circumference = 2 * Math.PI * 15.9
  const dashLen = (clamped / 100) * circumference
  const gapLen  = circumference - dashLen

  return (
    <div className="flex flex-col items-center gap-3 w-full">
      {/* Gauge */}
      <div className="relative w-36 h-36">
        {/* Background ring */}
        <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
          <circle
            cx="18" cy="18" r="15.9"
            fill="none"
            stroke="#e9e6dd"
            strokeWidth="3"
          />
          {/* Progress arc */}
          <circle
            cx="18" cy="18" r="15.9"
            fill="none"
            stroke={stroke}
            strokeWidth="3.5"
            strokeDasharray={`${dashLen} ${gapLen}`}
            strokeLinecap="round"
            style={{ transition: 'stroke-dasharray 0.8s ease' }}
          />
        </svg>

        {/* Center content */}
        <div
          className="absolute inset-2 rounded-full flex flex-col items-center justify-center"
          style={{ background: bg }}
        >
          <span className="text-2xl font-extrabold leading-none" style={{ color: text }}>
            {clamped.toFixed(1)}
          </span>
          <span className="text-[10px] font-bold mt-0.5" style={{ color: text, opacity: 0.7 }}>
            %
          </span>
        </div>
      </div>

      {/* Label */}
      <div className="text-center">
        <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Serapan Anggaran</p>
        <span
          className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold"
          style={{ background: bg, color: text }}
        >
          {label}
        </span>
      </div>

      {/* Mini progress bar */}
      <div className="w-full max-w-[140px] h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${clamped}%`, background: stroke }}
        />
      </div>
    </div>
  )
}

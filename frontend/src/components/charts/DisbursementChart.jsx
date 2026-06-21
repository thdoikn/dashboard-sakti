import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'

// IKN color palette
const COLOR_ANGGARAN  = '#d0e3f4'  // soft Khatulistiwa
const COLOR_REALISASI = '#185088'  // Khatulistiwa
const COLOR_SERAPAN   = '#DBAF6C'  // Terakota

// Legend color map — needed because fill="url(#grad)" can't render as CSS background
const LEGEND_COLORS = {
  'Anggaran':   COLOR_ANGGARAN,
  'Realisasi':  COLOR_REALISASI,
  '% Serapan':  COLOR_SERAPAN,
}

const formatIDR = (val) =>
  new Intl.NumberFormat('id-ID', {
    notation: 'compact',
    maximumFractionDigits: 1,
    style: 'currency',
    currency: 'IDR',
  }).format(val)

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-3 text-sm min-w-[180px]">
      <p className="font-bold text-ikn-dark mb-2 pb-2 border-b border-gray-100">{label}</p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center justify-between gap-4 py-0.5">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm" style={{ background: LEGEND_COLORS[entry.name] ?? entry.color }} />
            <span className="text-gray-500 text-xs">{entry.name}</span>
          </div>
          <span className="font-semibold text-ikn-dark text-xs">
            {entry.name === '% Serapan'
              ? `${Number(entry.value).toFixed(1)}%`
              : formatIDR(entry.value)}
          </span>
        </div>
      ))}
    </div>
  )
}

const CustomLegend = ({ payload }) => (
  <div className="flex items-center justify-center gap-6 mt-2">
    {payload.map((entry) => (
      <div key={entry.value} className="flex items-center gap-1.5">
        <span
          className="w-3 h-3 rounded-sm"
          style={{ background: LEGEND_COLORS[entry.value] ?? entry.color }}
        />
        <span className="text-xs text-gray-500 font-medium">{entry.value}</span>
      </div>
    ))}
  </div>
)

export default function DisbursementChart({ data = [] }) {
  if (data.length === 0) {
    return (
      <div className="h-64 flex flex-col items-center justify-center gap-2 text-gray-300">
        <svg className="w-12 h-12" fill="none" viewBox="0 0 48 48">
          <rect x="4"  y="28" width="10" height="16" rx="2" fill="currentColor" opacity=".4"/>
          <rect x="19" y="18" width="10" height="26" rx="2" fill="currentColor" opacity=".3"/>
          <rect x="34" y="10" width="10" height="34" rx="2" fill="currentColor" opacity=".2"/>
        </svg>
        <span className="text-sm">Belum ada data realisasi</span>
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <ComposedChart data={data} margin={{ top: 8, right: 50, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="realisasiGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor={COLOR_REALISASI} />
            <stop offset="100%" stopColor={COLOR_REALISASI} stopOpacity={0.75} />
          </linearGradient>
        </defs>

        <CartesianGrid strokeDasharray="3 3" stroke="#f0ede5" vertical={false} />

        {/* Left Y-axis — Rupiah */}
        <YAxis
          yAxisId="left"
          orientation="left"
          tickFormatter={formatIDR}
          tick={{ fontSize: 10, fill: '#9CA3AF', fontFamily: 'Plus Jakarta Sans' }}
          width={88}
          axisLine={false}
          tickLine={false}
        />

        {/* Right Y-axis — percentage, fixed 0–100 */}
        <YAxis
          yAxisId="right"
          orientation="right"
          tickFormatter={(v) => `${v}%`}
          tick={{ fontSize: 10, fill: COLOR_SERAPAN, fontFamily: 'Plus Jakarta Sans' }}
          domain={[0, 100]}
          axisLine={false}
          tickLine={false}
          width={42}
        />

        <XAxis
          dataKey="period"
          tick={{ fontSize: 11, fill: '#9CA3AF', fontFamily: 'Plus Jakarta Sans' }}
          axisLine={false}
          tickLine={false}
        />

        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(24,80,136,0.04)' }} />
        <Legend content={<CustomLegend />} />

        <Bar yAxisId="left"  dataKey="anggaran"       name="Anggaran"  fill={COLOR_ANGGARAN}        radius={[4,4,0,0]} maxBarSize={32} />
        <Bar yAxisId="left"  dataKey="realisasi"      name="Realisasi" fill="url(#realisasiGrad)"   radius={[4,4,0,0]} maxBarSize={32} />
        <Line
          yAxisId="right"
          dataKey="persen_serapan"
          name="% Serapan"
          stroke={COLOR_SERAPAN}
          strokeWidth={2.5}
          dot={{ r: 4, fill: COLOR_SERAPAN, strokeWidth: 2, stroke: 'white' }}
          activeDot={{ r: 6, fill: COLOR_SERAPAN, stroke: 'white', strokeWidth: 2 }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  )
}

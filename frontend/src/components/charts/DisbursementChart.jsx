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

const formatIDR = (val) =>
  new Intl.NumberFormat('id-ID', {
    notation: 'compact',
    maximumFractionDigits: 1,
    style: 'currency',
    currency: 'IDR',
  }).format(val)

export default function DisbursementChart({ data = [] }) {
  return (
    <ResponsiveContainer width="100%" height={320}>
      <ComposedChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="period" tick={{ fontSize: 12 }} />
        <YAxis tickFormatter={formatIDR} tick={{ fontSize: 11 }} width={90} />
        <Tooltip formatter={(val) => formatIDR(val)} />
        <Legend />
        <Bar dataKey="anggaran" name="Anggaran" fill="#bfdbfe" radius={[3, 3, 0, 0]} />
        <Bar dataKey="realisasi" name="Realisasi" fill="#3b82f6" radius={[3, 3, 0, 0]} />
        <Line dataKey="persen_serapan" name="% Serapan" stroke="#f97316" dot={false} yAxisId={0} />
      </ComposedChart>
    </ResponsiveContainer>
  )
}

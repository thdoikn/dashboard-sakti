// Shimmer skeleton primitives for consistent loading states across pages.

export function Skeleton({ className = '', style }) {
  return <div className={`bg-gray-200/70 rounded-md animate-pulse ${className}`} style={style} />
}

// Card-shaped placeholder that mirrors the StatCard footprint.
export function StatCardSkeleton() {
  return (
    <div className="ikn-card relative overflow-hidden p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1 space-y-3">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-3 w-20" />
        </div>
        <Skeleton className="w-11 h-11 rounded-2xl" />
      </div>
    </div>
  )
}

// Generic table-body skeleton — `cols` controls the cell count per row.
export function TableSkeleton({ rows = 6, cols = 4 }) {
  return (
    <div className="divide-y divide-gray-100">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex items-center gap-4 px-6 py-4">
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton
              key={c}
              className={`h-3.5 ${c === 0 ? 'w-28' : c === cols - 1 ? 'w-16 ml-auto' : 'flex-1 max-w-[180px]'}`}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

export function ChartSkeleton({ height = 300 }) {
  return (
    <div className="flex items-end gap-3 px-2" style={{ height }}>
      {[60, 85, 45, 95, 70, 55, 80, 40, 90, 65, 75, 50].map((h, i) => (
        <Skeleton key={i} className="flex-1 rounded-t-md" style={{ height: `${h}%` }} />
      ))}
    </div>
  )
}

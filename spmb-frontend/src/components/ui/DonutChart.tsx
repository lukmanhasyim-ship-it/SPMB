interface DonutSegment {
  label: string
  value: number
  color: string
}

interface DonutChartProps {
  data: DonutSegment[]
  size?: number
  thickness?: number
  centerLabel?: string
  showLegend?: boolean
  className?: string
}

export default function DonutChart({
  data,
  size = 168,
  thickness = 26,
  centerLabel = 'Total',
  showLegend = true,
  className = '',
}: DonutChartProps) {
  const total = data.reduce((sum, d) => sum + (d.value || 0), 0)
  const radius = (size - thickness) / 2
  const circumference = 2 * Math.PI * radius
  const gap = circumference * 0.012

  let cumulative = 0
  const segments = data.map((d) => {
    const frac = total > 0 ? (d.value || 0) / total : 0
    const len = Math.max(frac * circumference - gap, 0)
    const start = cumulative * circumference
    cumulative += frac
    return { ...d, frac, len, start }
  })

  return (
    <div className={className}>
      <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#eef2f7"
            strokeWidth={thickness}
          />
          {segments.map((seg) =>
            seg.len > 0 ? (
              <circle
                key={seg.label}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={seg.color}
                strokeWidth={thickness}
                strokeDasharray={`${seg.len} ${circumference - seg.len}`}
                strokeDashoffset={-seg.start}
                strokeLinecap="round"
              />
            ) : null,
          )}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-[26px] font-extrabold text-slate-800 leading-none tabular-nums">
            {total}
          </p>
          <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400 mt-1">
            {centerLabel}
          </p>
        </div>
      </div>

      {showLegend && (
        <div className="mt-4 space-y-2">
          {segments.map((seg) => (
            <div key={seg.label} className="flex items-center justify-between gap-3 text-sm">
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: seg.color }}
                />
                <span className="text-slate-600 truncate">{seg.label}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="font-bold text-slate-800 tabular-nums">{seg.value}</span>
                <span className="text-[11px] text-slate-400 w-10 text-right tabular-nums">
                  {Math.round(seg.frac * 100)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

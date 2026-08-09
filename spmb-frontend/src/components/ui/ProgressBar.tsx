interface ProgressBarProps {
  label: string
  count: number
  total: number
  color?: string
  suffix?: string
}

export default function ProgressBar({
  label,
  count,
  total,
  color = 'bg-brand-green',
  suffix = 'siswa',
}: ProgressBarProps) {
  const percent = total > 0 ? Math.round((count / total) * 100) : 0
  return (
    <div>
      <div className="flex justify-between items-baseline gap-2 mb-1.5">
        <span className="text-sm font-medium text-slate-600 truncate">{label}</span>
        <span className="text-xs text-slate-400 whitespace-nowrap tabular-nums">
          {count} {suffix} · {percent}%
        </span>
      </div>
      <div className="w-full h-2 rounded-full bg-slate-100/90 overflow-hidden">
        <div
          className={`h-full rounded-full ${color} transition-all duration-700`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  )
}

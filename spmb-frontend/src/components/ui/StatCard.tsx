import type { ComponentType, ReactNode } from 'react'
import Card from './Card'

type Tone = 'green' | 'amber' | 'teal' | 'blue' | 'orange' | 'red' | 'slate'

const toneGradients: Record<Tone, string> = {
  green: 'from-emerald-500 to-brand-green',
  amber: 'from-amber-400 to-orange-500',
  teal: 'from-teal-400 to-brand-teal',
  blue: 'from-sky-400 to-blue-500',
  orange: 'from-orange-400 to-amber-600',
  red: 'from-rose-400 to-red-500',
  slate: 'from-slate-400 to-slate-600',
}

interface StatCardProps {
  icon: ComponentType<{ className?: string }>
  label: string
  value: ReactNode
  tone?: Tone
  hint?: string
  className?: string
}

export default function StatCard({
  icon: Icon,
  label,
  value,
  tone = 'green',
  hint,
  className = '',
}: StatCardProps) {
  return (
    <Card glass hover className={`p-5 ${className}`}>
      <div className="flex items-center gap-4">
        <div
          className={`w-12 h-12 shrink-0 rounded-2xl bg-gradient-to-br ${toneGradients[tone]} flex items-center justify-center shadow-lg shadow-black/5`}
        >
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            {label}
          </p>
          <p className="text-2xl font-extrabold text-slate-800 leading-tight tabular-nums">
            {value}
          </p>
          {hint && <p className="text-[11px] text-slate-400 mt-0.5 truncate">{hint}</p>}
        </div>
      </div>
    </Card>
  )
}

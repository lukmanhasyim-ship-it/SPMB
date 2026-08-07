import { useEffect, useState } from 'react'
import { CalendarRange, Calendar } from 'lucide-react'
import Card from '../../../components/ui/Card'
import { api } from '../../../services/api'
import { formatWIBShort, formatWIBDateInput } from '../../../utils/dateUtils'

interface TimelineItem {
  id_timeline: string
  urutan: string
  nama_tahapan: string
  deskripsi: string
  tanggal_mulai: string
  tanggal_selesai: string
  status: string
}

function getStageState(tanggalMulai: string, tanggalSelesai: string): string {
  const today = formatWIBDateInput(new Date().toISOString())
  const mulai = formatWIBDateInput(tanggalMulai)
  const selesai = formatWIBDateInput(tanggalSelesai)
  if (!mulai) return ''
  if (!selesai) return today >= mulai ? 'Berlangsung' : 'Mendatang'
  if (today < mulai) return 'Mendatang'
  if (today > selesai) return 'Selesai'
  return 'Berlangsung'
}

const stageBadge: Record<string, string> = {
  Berlangsung: 'bg-brand-green-light text-brand-green-dark',
  Mendatang: 'bg-blue-50 text-blue-600',
  Selesai: 'bg-slate-100 text-slate-500',
}

export default function TimelineSiswa() {
  const [items, setItems] = useState<TimelineItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.timeline.get().then((res) => {
      if (res.status === 'ok') {
        const all = res.data as TimelineItem[]
        setItems(all.filter((i) => i.status === 'Aktif'))
      }
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  if (loading) return null

  if (items.length === 0) return null

  return (
    <Card className="p-4 sm:p-5">
      <div className="flex items-center gap-2 mb-4">
        <CalendarRange className="w-4 h-4 text-brand-green" />
        <h3 className="text-sm font-semibold text-slate-700">Tahapan SPMB</h3>
      </div>

      <div className="space-y-0">
        {items.map((item, index) => {
          const state = getStageState(item.tanggal_mulai, item.tanggal_selesai)
          const isLast = index === items.length - 1
          return (
            <div key={item.id_timeline} className="flex gap-3">
              <div className="flex flex-col items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                    state === 'Berlangsung'
                      ? 'bg-brand-green text-white'
                      : state === 'Selesai'
                      ? 'bg-slate-200 text-slate-500'
                      : 'bg-brand-green-light text-brand-green-dark'
                  }`}
                >
                  {item.urutan || index + 1}
                </div>
                {!isLast && <div className="w-0.5 flex-1 bg-slate-200 my-1" />}
              </div>

              <div className={`flex-1 min-w-0 pb-4 ${isLast ? 'pb-0' : ''}`}>
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <p className="text-sm font-semibold text-slate-800">{item.nama_tahapan}</p>
                  {state && (
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${stageBadge[state]}`}>
                      {state}
                    </span>
                  )}
                </div>
                {item.deskripsi && (
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">{item.deskripsi}</p>
                )}
                {(item.tanggal_mulai || item.tanggal_selesai) && (
                  <p className="flex items-center gap-1 text-[11px] text-slate-400 mt-1.5">
                    <Calendar className="w-3 h-3" />
                    {item.tanggal_mulai ? formatWIBShort(item.tanggal_mulai) : '...'}
                    {item.tanggal_selesai ? ` — ${formatWIBShort(item.tanggal_selesai)}` : ''}
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}

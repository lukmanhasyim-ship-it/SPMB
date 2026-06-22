import { useState } from 'react'
import { Edit3, Check, X, MessageCircle } from 'lucide-react'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import { DATA_GELOMBANG } from '../../data/dummy'
import type { GelombangConfig } from '../../types'

export default function AdminGelombang() {
  const [gelombangList] = useState<GelombangConfig[]>(
    DATA_GELOMBANG.map((g) => ({ ...g }))
  )

  const [editingGel, setEditingGel] = useState<string | null>(null)
  const [tahunAjaran, setTahunAjaran] = useState('2026/2027')

  const toggleStatus = (gelombang: string) => {
    alert(`Status ${gelombang} akan diubah (simulasi)`)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-800">Konfigurasi Gelombang</h1>
        <p className="text-sm text-slate-500">Atur jadwal dan status gelombang pendaftaran</p>
      </div>

      <Card className="p-5">
        <h3 className="text-sm font-semibold text-slate-700 mb-3">
          Tahun Ajaran Aktif
        </h3>
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={tahunAjaran}
            onChange={(e) => setTahunAjaran(e.target.value)}
            className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green"
          />
          <Button variant="primary" className="text-sm">
            <Check className="w-4 h-4" />
            Simpan
          </Button>
        </div>
      </Card>

      <div className="space-y-4">
        {gelombangList.map((gel) => (
          <Card key={gel.gelombang} className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-800">{gel.gelombang}</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {gel.tanggalMulai} — {gel.tanggalSelesai}
                </p>
              </div>
              <button
                onClick={() => toggleStatus(gel.gelombang)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                  gel.status === 'Aktif'
                    ? 'bg-brand-green-light text-brand-green-dark ring-2 ring-brand-green-light'
                    : 'bg-brand-green-light text-brand-green-dark hover:bg-brand-green hover:text-white border-2 border-brand-green/30'
                }`}
              >
                {gel.status === 'Aktif' ? (
                  <span className="flex items-center gap-1">
                    <Check className="w-3 h-3" /> Aktif
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    <X className="w-3 h-3" /> Non-Aktif
                  </span>
                )}
              </button>
            </div>

            <div className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-slate-400 shrink-0" />
              {editingGel === gel.gelombang ? (
                <div className="flex-1 flex gap-2">
                  <input
                    type="text"
                    defaultValue={gel.linkGroupWA}
                    className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-brand-green/30"
                    onBlur={(e) => {
                      alert(`Link WA diubah menjadi: ${e.target.value} (simulasi)`)
                      setEditingGel(null)
                    }}
                  />
                  <Button
                    variant="ghost"
                    onClick={() => setEditingGel(null)}
                    className="text-xs"
                  >
                    <Check className="w-3 h-3" />
                  </Button>
                </div>
              ) : (
                <>
                  <span className="text-xs text-blue-600 flex-1 truncate">
                    {gel.linkGroupWA}
                  </span>
                  <button
                    onClick={() => setEditingGel(gel.gelombang)}
                    className="text-brand-green hover:text-brand-green-dark transition-colors"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                </>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}

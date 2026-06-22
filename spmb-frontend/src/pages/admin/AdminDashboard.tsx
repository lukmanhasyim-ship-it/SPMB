import { Users, FileCheck, Clock, AlertTriangle } from 'lucide-react'
import Card from '../../components/ui/Card'
import { DATA_SISWA_DUMMY, DATA_GELOMBANG } from '../../data/dummy'

const statCards = [
  {
    icon: Users,
    label: 'Total Pendaftar',
    color: 'bg-blue-50 text-blue-600',
    getValue: () => DATA_SISWA_DUMMY.length,
  },
  {
    icon: FileCheck,
    label: 'Terverifikasi',
    color: 'bg-brand-green-light text-brand-green',
    getValue: () => DATA_SISWA_DUMMY.filter((s) => s.statusPendaftaran === 'Terverifikasi').length,
  },
  {
    icon: Clock,
    label: 'Selesai',
    color: 'bg-amber-50 text-amber-600',
    getValue: () => DATA_SISWA_DUMMY.filter((s) => s.statusPendaftaran === 'Selesai').length,
  },
  {
    icon: AlertTriangle,
    label: 'Draft',
    color: 'bg-slate-100 text-slate-600',
    getValue: () => DATA_SISWA_DUMMY.filter((s) => s.statusPendaftaran === 'Draft').length,
  },
]

function jurusanCount(): Record<string, number> {
  const counts: Record<string, number> = {}
  DATA_SISWA_DUMMY.forEach((s) => {
    if (s.pilihanJurusan) {
      counts[s.pilihanJurusan] = (counts[s.pilihanJurusan] || 0) + 1
    }
  })
  return counts
}

export default function AdminDashboard() {
  const counts = jurusanCount()
  const gelombangAktif = DATA_GELOMBANG.find((g) => g.status === 'Aktif')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-800">Dashboard</h1>
        <p className="text-sm text-slate-500">Ringkasan data pendaftaran SPMB</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <Card key={card.label} className="p-4">
            <div className={`w-10 h-10 rounded-xl ${card.color} flex items-center justify-center mb-2`}>
              <card.icon className="w-5 h-5" />
            </div>
            <p className="text-2xl font-bold text-slate-800">{card.getValue()}</p>
            <p className="text-xs text-slate-500">{card.label}</p>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">
            Pendaftar Per Jurusan
          </h3>
          <div className="space-y-3">
            {Object.entries(counts).map(([jurusan, count]) => {
              const total = DATA_SISWA_DUMMY.length
              const percent = total > 0 ? Math.round((count / total) * 100) : 0
              return (
                <div key={jurusan}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-700 font-medium">{jurusan}</span>
                    <span className="text-slate-500">{count} siswa</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-brand-green rounded-full transition-all"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              )
            })}
            {Object.keys(counts).length === 0 && (
              <p className="text-xs text-slate-400">Belum ada data</p>
            )}
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">
            Informasi Sistem
          </h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between border-b border-slate-100 pb-2">
              <span className="text-slate-500">Tahun Ajaran Aktif</span>
              <span className="font-medium text-slate-800">2026/2027</span>
            </div>
            <div className="flex justify-between border-b border-slate-100 pb-2">
              <span className="text-slate-500">Gelombang Aktif</span>
              <span className="font-medium text-brand-green">
                {gelombangAktif?.gelombang || '-'}
              </span>
            </div>
            <div className="flex justify-between border-b border-slate-100 pb-2">
              <span className="text-slate-500">Periode Aktif</span>
              <span className="font-medium text-slate-800">
                {gelombangAktif ? `${gelombangAktif.tanggalMulai} s.d. ${gelombangAktif.tanggalSelesai}` : '-'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Total Pendaftar</span>
              <span className="font-medium text-slate-800">{DATA_SISWA_DUMMY.length}</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}

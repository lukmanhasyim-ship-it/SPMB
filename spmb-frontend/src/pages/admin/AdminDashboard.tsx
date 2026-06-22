import { useEffect, useState } from 'react'
import { Users, FileCheck, Clock, AlertTriangle } from 'lucide-react'
import Card from '../../components/ui/Card'
import { api } from '../../services/api'

interface Stat {
  icon: React.ComponentType<{ className?: string }>
  label: string
  color: string
  value: number
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stat[]>([])
  const [jurusanCounts, setJurusanCounts] = useState<Record<string, number>>({})
  const [gelombangAktif, setGelombangAktif] = useState<{ gelombang: string; tanggalMulai: string; tanggalSelesai: string } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [siswaRes, gelombangRes] = await Promise.all([
          api.siswa.getAll(),
          api.gelombang.get(),
        ])

        if (siswaRes.status === 'ok') {
          const list = siswaRes.data as Array<Record<string, string>>
          const total = list.length
          const terverifikasi = list.filter((s) => s.status_pendaftaran === 'Terverifikasi').length
          const selesai = list.filter((s) => s.status_pendaftaran === 'Selesai').length
          const draft = list.filter((s) => s.status_pendaftaran === 'Draft').length

          setStats([
            { icon: Users, label: 'Total Pendaftar', color: 'bg-blue-50 text-blue-600', value: total },
            { icon: FileCheck, label: 'Terverifikasi', color: 'bg-brand-green-light text-brand-green', value: terverifikasi },
            { icon: Clock, label: 'Selesai', color: 'bg-amber-50 text-amber-600', value: selesai },
            { icon: AlertTriangle, label: 'Draft', color: 'bg-slate-100 text-slate-600', value: draft },
          ])

          const counts: Record<string, number> = {}
          list.forEach((s) => {
            if (s.pilihan_jurusan) {
              counts[s.pilihan_jurusan] = (counts[s.pilihan_jurusan] || 0) + 1
            }
          })
          setJurusanCounts(counts)
        }

        if (gelombangRes.status === 'ok') {
          const gelList = gelombangRes.data as Array<Record<string, string>>
          const aktif = gelList.find((g) => g.status === 'Aktif')
          if (aktif) {
            setGelombangAktif({
              gelombang: aktif.gelombang,
              tanggalMulai: aktif.tanggal_mulai,
              tanggalSelesai: aktif.tanggal_selesai,
            })
          }
        }
      } catch {
        // Handle error silently
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const totalSiswa = stats.reduce((sum, s) => (s.label === 'Total Pendaftar' ? s.value : sum), 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-800">Dashboard</h1>
        <p className="text-sm text-slate-500">Ringkasan data pendaftaran SPMB</p>
      </div>

      {loading ? (
        <p className="text-sm text-slate-400">Memuat data...</p>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((card) => (
              <Card key={card.label} className="p-4">
                <div className={`w-10 h-10 rounded-xl ${card.color} flex items-center justify-center mb-2`}>
                  <card.icon className="w-5 h-5" />
                </div>
                <p className="text-2xl font-bold text-slate-800">{card.value}</p>
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
                {Object.entries(jurusanCounts).length > 0 ? (
                  Object.entries(jurusanCounts).map(([jurusan, count]) => {
                    const percent = totalSiswa > 0 ? Math.round((count / totalSiswa) * 100) : 0
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
                  })
                ) : (
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
                  <span className="font-medium text-slate-800">{totalSiswa}</span>
                </div>
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}

import { useEffect, useState } from 'react'
import { Users, FileCheck, Clock, AlertTriangle, School } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import Card from '../../components/ui/Card'
import Loader from '../../components/ui/Loader'
import StatCard from '../../components/ui/StatCard'
import DonutChart from '../../components/ui/DonutChart'
import ProgressBar from '../../components/ui/ProgressBar'
import { api } from '../../services/api'

const JURUSAN_PALETTE = ['#007643', '#38bdf8', '#f59e0b', '#14b8a6', '#8b5cf6', '#f472b6']

function getSapaanWIB(): string {
  const h = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Jakarta' })).getHours()
  if (h < 10) return 'Selamat pagi'
  if (h < 15) return 'Selamat siang'
  if (h < 19) return 'Selamat sore'
  return 'Selamat malam'
}

export default function GuruDashboard() {
  const { user } = useAuthStore()
  const [totalSiswa, setTotalSiswa] = useState(0)
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({})
  const [jurusanCounts, setJurusanCounts] = useState<Record<string, number>>({})
  const [gelombangCounts, setGelombangCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.siswa.getAll()
        if (res.status === 'ok') {
          const list = res.data as Array<Record<string, string>>
          setTotalSiswa(list.length)

          const jurusan: Record<string, number> = {}
          const gelombang: Record<string, number> = {}
          const status: Record<string, number> = {}
          list.forEach((s) => {
            if (s.pilihan_jurusan) {
              jurusan[s.pilihan_jurusan] = (jurusan[s.pilihan_jurusan] || 0) + 1
            }
            if (s.gelombang) {
              gelombang[s.gelombang] = (gelombang[s.gelombang] || 0) + 1
            }
            const st = s.status_pendaftaran || 'Draft'
            status[st] = (status[st] || 0) + 1
          })
          setJurusanCounts(jurusan)
          setGelombangCounts(gelombang)
          setStatusCounts(status)
        }
      } catch {
        // Handle error
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const donutData = Object.entries(jurusanCounts).map(([label, value], i) => ({
    label,
    value,
    color: JURUSAN_PALETTE[i % JURUSAN_PALETTE.length],
  }))

  return (
    <div className="space-y-6">
      <Card glass className="p-5 sm:p-6 relative overflow-hidden">
        <div className="absolute -right-16 -top-16 w-56 h-56 rounded-full bg-brand-orange/15 blur-2xl pointer-events-none" />
        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-brand-green">{getSapaanWIB()}</p>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-800 mt-1">
              {user?.nama}
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Pantau perkembangan pendaftaran murid baru
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-brand-orange/10 text-orange-600 text-xs font-semibold">
            <School className="w-3.5 h-3.5" />
            Panel Guru
          </span>
        </div>
      </Card>

      {loading ? (
        <Loader />
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={Users} label="Total Pendaftar" value={totalSiswa} tone="blue" hint="Seluruh calon siswa" />
            <StatCard icon={FileCheck} label="Terverifikasi" value={statusCounts['Terverifikasi'] || 0} tone="green" />
            <StatCard icon={Clock} label="Selesai" value={statusCounts['Selesai'] || 0} tone="amber" />
            <StatCard icon={AlertTriangle} label="Draft" value={statusCounts['Draft'] || 0} tone="slate" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card glass className="p-5">
              <h3 className="text-sm font-bold text-slate-800 mb-1">Jumlah per Program Keahlian</h3>
              <p className="text-xs text-slate-400 mb-4">Distribusi pendaftar antar jurusan</p>
              {donutData.length > 0 ? (
                <DonutChart data={donutData} centerLabel="Pendaftar" />
              ) : (
                <p className="text-sm text-slate-400 text-center py-10">Belum ada data</p>
              )}
            </Card>

            <Card glass className="p-5">
              <h3 className="text-sm font-bold text-slate-800 mb-4">Jumlah per Gelombang</h3>
              {Object.entries(gelombangCounts).length > 0 ? (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-5">
                    {Object.entries(gelombangCounts).map(([gelombang, count]) => (
                      <div
                        key={gelombang}
                        className="glass-card-hover p-4 rounded-2xl glass-badge text-center"
                      >
                        <p className="text-xl font-extrabold text-slate-800 tabular-nums">{count}</p>
                        <p className="text-[11px] font-semibold text-slate-500 mt-0.5">{gelombang}</p>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-4">
                    {Object.entries(gelombangCounts).map(([gelombang, count]) => (
                      <ProgressBar
                        key={gelombang}
                        label={gelombang}
                        count={count}
                        total={totalSiswa}
                        color="bg-blue-500"
                      />
                    ))}
                  </div>
                </>
              ) : (
                <p className="text-sm text-slate-400 text-center py-10">Belum ada data</p>
              )}
            </Card>
          </div>
        </>
      )}
    </div>
  )
}

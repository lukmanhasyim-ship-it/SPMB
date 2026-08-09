import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Users, FileCheck, Clock, AlertTriangle, Calendar, Milestone, Image, FileText, ArrowUpRight } from 'lucide-react'
import Card from '../../components/ui/Card'
import Loader from '../../components/ui/Loader'
import StatCard from '../../components/ui/StatCard'
import DonutChart from '../../components/ui/DonutChart'
import ProgressBar from '../../components/ui/ProgressBar'
import { api } from '../../services/api'
import { formatWIBShort } from '../../utils/dateUtils'
import { useAuthStore } from '../../store/authStore'

const JURUSAN_PALETTE = ['#007643', '#38bdf8', '#f59e0b', '#14b8a6', '#8b5cf6', '#f472b6']

function getSapaanWIB(): string {
  const h = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Jakarta' })).getHours()
  if (h < 10) return 'Selamat pagi'
  if (h < 15) return 'Selamat siang'
  if (h < 19) return 'Selamat sore'
  return 'Selamat malam'
}

interface Stats {
  total: number
  terverifikasi: number
  selesai: number
  draft: number
}

export default function AdminDashboard() {
  const { user } = useAuthStore()
  const [stats, setStats] = useState<Stats>({ total: 0, terverifikasi: 0, selesai: 0, draft: 0 })
  const [jurusanCounts, setJurusanCounts] = useState<Record<string, number>>({})
  const [jurusanAltCounts, setJurusanAltCounts] = useState<Record<string, number>>({})
  const [gelombangCounts, setGelombangCounts] = useState<Record<string, number>>({})
  const [recent, setRecent] = useState<Array<Record<string, string>>>([])
  const [gelombangAktif, setGelombangAktif] = useState<{ gelombang: string; tanggalMulai: string; tanggalSelesai: string } | null>(null)
  const [tahunAjaran, setTahunAjaran] = useState('2026/2027')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [siswaRes, gelombangRes, configRes] = await Promise.all([
          api.siswa.getAll(),
          api.gelombang.get(),
          api.config.get(),
        ])

        if (siswaRes.status === 'ok') {
          const list = siswaRes.data as Array<Record<string, string>>
          const terverifikasi = list.filter((s) => s.status_pendaftaran === 'Terverifikasi').length
          const selesai = list.filter((s) => s.status_pendaftaran === 'Selesai').length
          const draft = list.filter((s) => s.status_pendaftaran === 'Draft').length

          setStats({
            total: list.length,
            terverifikasi,
            selesai,
            draft,
          })

          const counts: Record<string, number> = {}
          const altCounts: Record<string, number> = {}
          const gelCounts: Record<string, number> = {}
          list.forEach((s) => {
            if (s.pilihan_jurusan) {
              counts[s.pilihan_jurusan] = (counts[s.pilihan_jurusan] || 0) + 1
            }
            if (s.pilihan_alternatif) {
              altCounts[s.pilihan_alternatif] = (altCounts[s.pilihan_alternatif] || 0) + 1
            }
            if (s.gelombang) {
              gelCounts[s.gelombang] = (gelCounts[s.gelombang] || 0) + 1
            }
          })
          setJurusanCounts(counts)
          setJurusanAltCounts(altCounts)
          setGelombangCounts(gelCounts)

          const sorted = [...list].sort((a, b) => {
            const ta = new Date(String(a.waktu_daftar || '')).getTime() || 0
            const tb = new Date(String(b.waktu_daftar || '')).getTime() || 0
            return tb - ta
          })
          setRecent(sorted.slice(0, 5))
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

        if (configRes?.status === 'ok') {
          const config = configRes.data as Record<string, string>
          if (config.TAHUN_AJARAN_AKTIF) setTahunAjaran(config.TAHUN_AJARAN_AKTIF)
        }
      } catch {
        // Handle error silently
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

  const quickActions = [
    { to: '/admin/siswa', icon: Users, label: 'Data Siswa', tone: 'bg-gradient-to-br from-sky-400 to-blue-500' },
    { to: '/admin/gelombang', icon: Calendar, label: 'Gelombang', tone: 'bg-gradient-to-br from-amber-400 to-orange-500' },
    { to: '/admin/broadcast', icon: Image, label: 'Postingan', tone: 'bg-gradient-to-br from-fuchsia-400 to-purple-500' },
    { to: '/admin/formulir', icon: FileText, label: 'Formulir', tone: 'bg-gradient-to-br from-teal-400 to-brand-teal' },
  ]

  return (
    <div className="space-y-6">
      <Card glass className="p-5 sm:p-6 relative overflow-hidden">
        <div className="absolute -right-16 -top-16 w-56 h-56 rounded-full bg-brand-green/10 blur-2xl pointer-events-none" />
        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-brand-green">{getSapaanWIB()}</p>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-800 mt-1">
              {user?.nama}
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Ringkasan pendaftaran SPMB — Tahun Ajaran {tahunAjaran}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {gelombangAktif ? (
              <>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-brand-green/10 text-brand-green text-xs font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-green animate-pulse" />
                  {gelombangAktif.gelombang} Aktif
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full glass-badge text-slate-600 text-xs font-medium">
                  <Milestone className="w-3.5 h-3.5 text-brand-green" />
                  {formatWIBShort(gelombangAktif.tanggalMulai)} s.d. {formatWIBShort(gelombangAktif.tanggalSelesai)}
                </span>
              </>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 text-amber-700 text-xs font-medium">
                <AlertTriangle className="w-3.5 h-3.5" />
                Belum ada gelombang aktif
              </span>
            )}
          </div>
        </div>
      </Card>

      {loading ? (
        <Loader />
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={Users} label="Total Pendaftar" value={stats.total} tone="blue" hint="Seluruh calon siswa" />
            <StatCard icon={FileCheck} label="Terverifikasi" value={stats.terverifikasi} tone="green" hint="Berkas lolos verifikasi" />
            <StatCard icon={Clock} label="Selesai" value={stats.selesai} tone="amber" hint="Pendaftaran difinalisasi" />
            <StatCard icon={AlertTriangle} label="Draft" value={stats.draft} tone="slate" hint="Masih dilengkapi siswa" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card glass className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Pendaftar per Jurusan</h3>
                  <p className="text-xs text-slate-400">Distribusi kompetensi keahlian utama</p>
                </div>
                <Link
                  to="/admin/siswa"
                  className="flex items-center gap-1 text-xs font-medium text-brand-green hover:text-brand-green-dark transition-colors"
                >
                  Lihat data
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>
              {donutData.length > 0 ? (
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <DonutChart data={donutData} centerLabel="Pendaftar" />
                </div>
              ) : (
                <p className="text-sm text-slate-400 text-center py-10">Belum ada data</p>
              )}
            </Card>

            <Card glass className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Pendaftar per Gelombang</h3>
                  <p className="text-xs text-slate-400">Sebaran pendaftar per gelombang aktif</p>
                </div>
                <Link
                  to="/admin/gelombang"
                  className="flex items-center gap-1 text-xs font-medium text-brand-green hover:text-brand-green-dark transition-colors"
                >
                  Kelola
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>
              {Object.entries(gelombangCounts).length > 0 ? (
                <div className="space-y-4">
                  {Object.entries(gelombangCounts).map(([gelombang, count]) => (
                    <ProgressBar
                      key={gelombang}
                      label={gelombang}
                      count={count}
                      total={stats.total}
                      color="bg-blue-500"
                    />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-400 text-center py-10">Belum ada data</p>
              )}
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card glass className="p-5">
              <h3 className="text-sm font-bold text-slate-800 mb-1">Jurusan Alternatif</h3>
              <p className="text-xs text-slate-400 mb-4">Pilihan cadangan para pendaftar</p>
              {Object.entries(jurusanAltCounts).length > 0 ? (
                <div className="space-y-4">
                  {Object.entries(jurusanAltCounts).map(([jurusan, count]) => (
                    <ProgressBar
                      key={jurusan}
                      label={jurusan}
                      count={count}
                      total={stats.total}
                      color="bg-amber-400"
                    />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-400 text-center py-10">Belum ada data</p>
              )}
            </Card>

            <Card glass className="p-5">
              <h3 className="text-sm font-bold text-slate-800 mb-4">Akses Cepat</h3>
              <div className="grid grid-cols-2 gap-3 mb-5">
                {quickActions.map(({ to, icon: Icon, label, tone }) => (
                  <Link
                    key={to}
                    to={to}
                    className="glass-card-hover flex items-center gap-3 p-3.5 rounded-2xl glass-badge hover:bg-white/80"
                  >
                    <div className={`w-10 h-10 rounded-xl ${tone} flex items-center justify-center shrink-0 shadow-md shadow-black/5`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-700 leading-tight">{label}</p>
                      <p className="text-[11px] text-slate-400">Kelola sekarang</p>
                    </div>
                  </Link>
                ))}
              </div>
              <div className="rounded-2xl bg-brand-green/[0.06] border border-brand-green/10 p-4">
                <div className="space-y-2.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Tahun Ajaran</span>
                    <span className="font-bold text-slate-800">{tahunAjaran}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Gelombang Aktif</span>
                    <span className="font-bold text-brand-green">{gelombangAktif?.gelombang || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Periode Aktif</span>
                    <span className="font-semibold text-slate-700">
                      {gelombangAktif ? `${formatWIBShort(gelombangAktif.tanggalMulai)} s.d. ${formatWIBShort(gelombangAktif.tanggalSelesai)}` : '-'}
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {recent.length > 0 && (
            <Card glass className="overflow-hidden">
              <div className="p-5 pb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Pendaftar Terbaru</h3>
                  <p className="text-xs text-slate-400">Aktivitas pendaftaran paling baru</p>
                </div>
                <Link
                  to="/admin/siswa"
                  className="flex items-center gap-1 text-xs font-medium text-brand-green hover:text-brand-green-dark transition-colors"
                >
                  Semua data
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>
              <div className="overflow-x-auto dash-scroll">
                <table className="dash-table">
                  <thead>
                    <tr>
                      <th>Nama</th>
                      <th>ID Pendaftaran</th>
                      <th>Jurusan</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recent.map((s) => (
                      <tr key={s.id_pendaftaran}>
                        <td className="font-medium text-slate-800">{s.nama_lengkap || '-'}</td>
                        <td className="font-mono text-xs text-brand-green">{s.id_pendaftaran || '-'}</td>
                        <td>{s.pilihan_jurusan || '-'}</td>
                        <td>
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                              s.status_pendaftaran === 'Terverifikasi'
                                ? 'bg-brand-green/10 text-brand-green'
                                : s.status_pendaftaran === 'Selesai'
                                ? 'bg-blue-50 text-blue-600'
                                : 'bg-slate-100 text-slate-500'
                            }`}
                          >
                            {s.status_pendaftaran || 'Draft'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  )
}

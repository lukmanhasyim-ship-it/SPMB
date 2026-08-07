import { useEffect, useState } from 'react'
import { UserCheck, Users, ChevronDown, ChevronUp, Download } from 'lucide-react'
import * as XLSX from 'xlsx'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Loader from '../../components/ui/Loader'
import { api } from '../../services/api'

const kategoriColors: Record<string, string> = {
  'Guru SMKS AL AZHAR SEMPU': 'bg-brand-green-light text-brand-green-dark',
  'Siswa Kelas X': 'bg-cyan-50 text-cyan-700',
  'Siswa Kelas XI': 'bg-blue-50 text-blue-700',
  'Siswa Kelas XII': 'bg-purple-50 text-purple-700',
  'Alumni': 'bg-amber-50 text-amber-700',
  'Lainnya': 'bg-slate-100 text-slate-600',
}

const statusColors: Record<string, string> = {
  Draft: 'bg-slate-100 text-slate-600',
  Terdaftar: 'bg-blue-50 text-blue-700',
  Selesai: 'bg-blue-50 text-blue-600',
  Terverifikasi: 'bg-brand-green-light text-brand-green-dark',
}

interface PendaftarRef {
  id_pendaftaran: string
  nama_lengkap: string
  email: string
  jurusan: string
  gelombang: string
  status_pendaftaran: string
}

interface ReferralStat {
  nama: string
  kategori: string
  jumlah: number
  pendaftar: PendaftarRef[]
}

export default function AdminReferral() {
  const [stats, setStats] = useState<ReferralStat[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<Record<number, boolean>>({})
  const [search, setSearch] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.referral.getStats()
        if (res.status === 'ok') {
          setStats((res.data as ReferralStat[]) || [])
        }
      } catch {
        // Handle error
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const totalReferral = stats.reduce((sum, s) => sum + s.jumlah, 0)
  const totalOrang = stats.length
  const totalPendaftar = stats.reduce((sum, s) => sum + s.pendaftar.length, 0)

  const filtered = stats.filter((s) => {
    const q = search.toLowerCase()
    return s.nama.toLowerCase().includes(q) || s.kategori.toLowerCase().includes(q)
  })

  const toggleExpand = (index: number) => {
    setExpanded((prev) => ({ ...prev, [index]: !prev[index] }))
  }

  const handleExport = () => {
    const data = filtered.flatMap((s) =>
      s.pendaftar.map((p) => ({
        'Kategori': s.kategori,
        'Nama Perekrut': s.nama,
        'Nama Pendaftar': p.nama_lengkap,
        'ID Pendaftaran': p.id_pendaftaran,
        'Email': p.email,
        'Jurusan': p.jurusan,
        'Gelombang': p.gelombang,
        'Status': p.status_pendaftaran,
      }))
    )
    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Rekap Referral')
    XLSX.writeFile(wb, `rekap-referral-${Date.now()}.xlsx`)
  }

  return (
    <div className="page-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Rekap Referral</h1>
          <p className="text-sm text-slate-500">
            Rekap guru, siswa, dan alumni yang mendaftarkan calon siswa
          </p>
        </div>
        {stats.length > 0 && (
          <Button variant="secondary" onClick={handleExport} className="flex items-center gap-1.5 whitespace-nowrap">
            <Download className="w-4 h-4" />
            Export Excel
          </Button>
        )}
      </div>

      {loading ? (
        <Loader />
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            <Card className="p-4">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-2">
                <Users className="w-5 h-5" />
              </div>
              <p className="text-2xl font-bold text-slate-800">{totalPendaftar}</p>
              <p className="text-xs text-slate-500">Pendaftar dengan Referral</p>
            </Card>
            <Card className="p-4">
              <div className="w-10 h-10 rounded-xl bg-brand-green-light text-brand-green flex items-center justify-center mb-2">
                <UserCheck className="w-5 h-5" />
              </div>
              <p className="text-2xl font-bold text-slate-800">{totalOrang}</p>
              <p className="text-xs text-slate-500">Orang yang Direferensikan</p>
            </Card>
            <Card className="p-4">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-2">
                <Users className="w-5 h-5" />
              </div>
              <p className="text-2xl font-bold text-slate-800">{totalReferral}</p>
              <p className="text-xs text-slate-500">Total Referral</p>
            </Card>
          </div>

          <div className="relative max-w-md">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama atau kategori..."
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green"
            />
          </div>

          {filtered.length === 0 ? (
            <Card className="p-10 text-center">
              <UserCheck className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-sm text-slate-500">
                {search ? 'Tidak ada hasil yang cocok' : 'Belum ada data referral. Data muncul saat calon siswa mengisi referral pada pendaftaran.'}
              </p>
            </Card>
          ) : (
            <div className="space-y-3">
              {filtered.map((s, index) => (
                <Card key={`${s.kategori}-${s.nama}`} className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-slate-100 text-slate-600">
                        <UserCheck className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-slate-800">{s.nama}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${kategoriColors[s.kategori] || kategoriColors['Lainnya']}`}>
                            {s.kategori}
                          </span>
                          <span className="text-xs text-slate-500">{s.jumlah} pendaftar</span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => toggleExpand(index)}
                      className="flex items-center gap-1 text-xs text-brand-green hover:text-brand-green-dark font-medium transition-colors self-start sm:self-auto"
                    >
                      {expanded[index] ? (
                        <>
                          Sembunyikan <ChevronUp className="w-3.5 h-3.5" />
                        </>
                      ) : (
                        <>
                          Lihat detail <ChevronDown className="w-3.5 h-3.5" />
                        </>
                      )}
                    </button>
                  </div>

                  {expanded[index] && (
                    <div className="mt-4 overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-slate-100 bg-slate-50/50">
                            <th className="text-left px-3 py-2 font-semibold text-slate-600 text-xs uppercase">No</th>
                            <th className="text-left px-3 py-2 font-semibold text-slate-600 text-xs uppercase">Nama Pendaftar</th>
                            <th className="text-left px-3 py-2 font-semibold text-slate-600 text-xs uppercase">Jurusan</th>
                            <th className="text-left px-3 py-2 font-semibold text-slate-600 text-xs uppercase">Gelombang</th>
                            <th className="text-left px-3 py-2 font-semibold text-slate-600 text-xs uppercase">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {s.pendaftar.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="px-3 py-4 text-center text-slate-400">Tidak ada data</td>
                            </tr>
                          ) : (
                            s.pendaftar.map((p, i) => (
                              <tr key={p.id_pendaftaran} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                                <td className="px-3 py-2 text-slate-500">{i + 1}</td>
                                <td className="px-3 py-2">
                                  <p className="font-medium text-slate-800">{p.nama_lengkap || '-'}</p>
                                  <p className="text-xs font-mono text-slate-400">{p.id_pendaftaran}</p>
                                </td>
                                <td className="px-3 py-2 text-slate-700">{p.jurusan || '-'}</td>
                                <td className="px-3 py-2 text-slate-700">{p.gelombang || '-'}</td>
                                <td className="px-3 py-2">
                                  <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[p.status_pendaftaran]}`}>
                                    {p.status_pendaftaran}
                                  </span>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

import { useEffect, useState } from 'react'
import { UserCheck, Users, ChevronDown, ChevronUp, Download } from 'lucide-react'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Loader from '../../components/ui/Loader'
import ResponsiveTable from '../../components/ui/ResponsiveTable'
import { api } from '../../services/api'

const kategoriColors: Record<string, string> = {
  'Admin SPMB / Panitia SPMB': 'bg-slate-100 text-slate-700',
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

  const handleExport = async () => {
    const XLSX = await import('xlsx')
    const data = filtered.flatMap((s) =>
      s.pendaftar.map((p) => ({
        'Kategori': s.kategori,
        'Nama Perekrut': s.nama,
        'Nama Pendaftar': p.nama_lengkap,
        'ID Pendaftaran': p.id_pendaftaran,
        'Email': p.email,
        'Program Keahlian': p.jurusan,
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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Rekap Referral</h1>
          <p className="text-sm text-slate-500">
            Rekap guru, siswa, dan alumni yang mendaftarkan calon siswa
          </p>
        </div>
        {stats.length > 0 && (
          <Button
            variant="secondary"
            onClick={handleExport}
            fullWidth
            className="items-center gap-1.5 whitespace-nowrap sm:w-auto"
          >
            <Download className="w-4 h-4" />
            Export Excel
          </Button>
        )}
      </div>

      {loading ? (
        <Loader />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card className="p-4 sm:p-6">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-2">
                <Users className="w-5 h-5" />
              </div>
              <p className="text-2xl font-bold text-slate-800">{totalPendaftar}</p>
              <p className="text-xs text-slate-500">Pendaftar dengan Referral</p>
            </Card>
            <Card className="p-4 sm:p-6">
              <div className="w-10 h-10 rounded-xl bg-brand-green-light text-brand-green flex items-center justify-center mb-2">
                <UserCheck className="w-5 h-5" />
              </div>
              <p className="text-2xl font-bold text-slate-800">{totalOrang}</p>
              <p className="text-xs text-slate-500">Orang yang Direferensikan</p>
            </Card>
            <Card className="p-4 sm:p-6">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-2">
                <Users className="w-5 h-5" />
              </div>
              <p className="text-2xl font-bold text-slate-800">{totalReferral}</p>
              <p className="text-xs text-slate-500">Total Referral</p>
            </Card>
          </div>

          <div className="relative w-full max-w-md">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama atau kategori..."
              aria-label="Cari nama atau kategori"
              className="w-full min-h-touch px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green"
            />
          </div>

          {filtered.length === 0 ? (
            <Card className="p-8 text-center sm:p-10">
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
                      type="button"
                      onClick={() => toggleExpand(index)}
                      aria-expanded={!!expanded[index]}
                      aria-label={`${expanded[index] ? 'Sembunyikan' : 'Lihat'} detail pendaftar dari ${s.nama}`}
                      className="inline-flex min-h-touch min-w-touch items-center justify-center gap-1 rounded-xl px-2 text-xs text-brand-green hover:text-brand-green-dark hover:bg-brand-green-light font-medium transition-colors self-start sm:self-auto"
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
                    <div className="mt-4">
                      <ResponsiveTable
                        caption={`Daftar pendaftar dari ${s.nama}`}
                        minWidth={640}
                        columns={[
                          {
                            key: 'no',
                            header: 'No',
                            render: (_p, i) => i + 1,
                          },
                          {
                            key: 'nama',
                            header: 'Nama Pendaftar',
                            render: (p) => (
                              <div>
                                <p className="font-medium text-slate-800">{p.nama_lengkap || '-'}</p>
                                <p className="text-xs font-mono text-slate-400">{p.id_pendaftaran}</p>
                              </div>
                            ),
                          },
                          {
                            key: 'jurusan',
                            header: 'Program Keahlian',
                            render: (p) => p.jurusan || '-',
                          },
                          {
                            key: 'gelombang',
                            header: 'Gelombang',
                            render: (p) => p.gelombang || '-',
                          },
                          {
                            key: 'status',
                            header: 'Status',
                            render: (p) => (
                              <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[p.status_pendaftaran]}`}>
                                {p.status_pendaftaran}
                              </span>
                            ),
                          },
                        ]}
                        data={s.pendaftar}
                        getRowId={(p) => p.id_pendaftaran}
                        emptyMessage="Tidak ada data"
                        mobileCard={(p, i) => (
                          <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="flex items-start gap-2 text-sm font-semibold text-slate-800">
                                  <span className="shrink-0 text-slate-400">{i + 1}.</span>
                                  <span className="min-w-0">{p.nama_lengkap || '-'}</span>
                                </p>
                                <p className="mt-0.5 font-mono text-xs text-slate-400">{p.id_pendaftaran}</p>
                              </div>
                              <span className={`inline-block shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[p.status_pendaftaran]}`}>
                                {p.status_pendaftaran}
                              </span>
                            </div>
                            <div className="mt-3 space-y-1 text-xs text-slate-500">
                              <p>
                                Program Keahlian:{' '}
                                <span className="font-medium text-slate-700">{p.jurusan || '-'}</span>
                              </p>
                              <p>
                                Gelombang:{' '}
                                <span className="font-medium text-slate-700">{p.gelombang || '-'}</span>
                              </p>
                            </div>
                          </div>
                        )}
                      />
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

import { useEffect, useState, useMemo } from 'react'
import { Search, Filter, ChevronDown, Download } from 'lucide-react'
import * as XLSX from 'xlsx'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Loader from '../../components/ui/Loader'
import { api } from '../../services/api'
import type { StatusPendaftaran } from '../../types'

const statusColors: Record<string, string> = {
  Draft: 'bg-slate-100 text-slate-600',
  Terdaftar: 'bg-blue-50 text-blue-700',
  Selesai: 'bg-blue-50 text-blue-600',
  Terverifikasi: 'bg-brand-green-light text-brand-green-dark',
}

interface SiswaRow {
  idPendaftaran: string
  email: string
  namaLengkap: string
  pilihanJurusan: string
  gelombang: string
  statusPendaftaran: string
}

export default function AdminSiswa() {
  const [siswaList, setSiswaList] = useState<SiswaRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<StatusPendaftaran | 'Semua'>('Semua')

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.siswa.getAll()
        if (res.status === 'ok') {
          const list = (res.data as Array<Record<string, string>>).map((s) => ({
            idPendaftaran: s.id_pendaftaran || '',
            email: s.email || '',
            namaLengkap: s.nama_lengkap || '',
            pilihanJurusan: s.pilihan_jurusan || '-',
            gelombang: s.gelombang || '-',
            statusPendaftaran: s.status_pendaftaran || 'Draft',
          }))
          setSiswaList(list)
        }
      } catch {
        // Handle error
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return siswaList.filter((s) => {
      const matchSearch =
        s.namaLengkap.toLowerCase().includes(q) ||
        s.idPendaftaran.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q)
      const matchStatus = filterStatus === 'Semua' || s.statusPendaftaran === filterStatus
      return matchSearch && matchStatus
    })
  }, [siswaList, search, filterStatus])

  const handleExport = () => {
    const data = filtered.map((s, i) => ({
      'No': i + 1,
      'ID Pendaftaran': s.idPendaftaran,
      'Nama Lengkap': s.namaLengkap,
      'Email': s.email,
      'Jurusan': s.pilihanJurusan,
      'Gelombang': s.gelombang,
      'Status': s.statusPendaftaran,
    }))
    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Data Siswa')
    const colWidths = [
      { wch: 5 }, { wch: 18 }, { wch: 28 }, { wch: 30 }, { wch: 20 }, { wch: 12 }, { wch: 14 },
    ]
    ws['!cols'] = colWidths
    XLSX.writeFile(wb, `data-siswa-${Date.now()}.xlsx`)
  }

  return (
    <div className="page-fade-in space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-800">Data Calon Siswa</h1>
        <p className="text-sm text-slate-500">
          Total {siswaList.length} pendaftar
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama, ID, atau email..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as StatusPendaftaran | 'Semua')}
            className="pl-9 pr-8 py-2.5 rounded-xl border border-slate-200 bg-white text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green"
          >
            <option value="Semua">Semua Status</option>
            <option value="Draft">Draft</option>
            <option value="Terdaftar">Terdaftar</option>
            <option value="Selesai">Selesai</option>
            <option value="Terverifikasi">Terverifikasi</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        </div>
        {filtered.length > 0 && (
          <Button variant="secondary" onClick={handleExport} className="flex items-center gap-1.5 whitespace-nowrap">
            <Download className="w-4 h-4" />
            Export Excel
          </Button>
        )}
      </div>

      {loading ? (
        <Loader />
      ) : (
        <div className="overflow-x-auto">
          <Card className="p-0 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs uppercase">No</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs uppercase">ID</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs uppercase">Nama</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs uppercase">Jurusan</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs uppercase">Gelombang</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs uppercase">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                      Tidak ada data yang cocok
                    </td>
                  </tr>
                ) : (
                  filtered.map((siswa, index) => (
                    <tr key={siswa.idPendaftaran} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3 text-slate-500">{index + 1}</td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-700">{siswa.idPendaftaran}</td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-800">{siswa.namaLengkap}</p>
                        <p className="text-xs text-slate-400">{siswa.email}</p>
                      </td>
                      <td className="px-4 py-3 text-slate-700">{siswa.pilihanJurusan}</td>
                      <td className="px-4 py-3 text-slate-700">{siswa.gelombang}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[siswa.statusPendaftaran]}`}>
                          {siswa.statusPendaftaran}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </Card>
        </div>
      )}
    </div>
  )
}

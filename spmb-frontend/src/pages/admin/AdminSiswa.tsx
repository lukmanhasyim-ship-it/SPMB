import { useState } from 'react'
import { Search, Filter, ChevronDown } from 'lucide-react'
import Card from '../../components/ui/Card'
import { DATA_SISWA_DUMMY } from '../../data/dummy'
import type { StatusPendaftaran } from '../../types'

const statusColors: Record<string, string> = {
  Draft: 'bg-slate-100 text-slate-600',
  Selesai: 'bg-blue-50 text-blue-600',
  Terverifikasi: 'bg-brand-green-light text-brand-green-dark',
}

export default function AdminSiswa() {
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<StatusPendaftaran | 'Semua'>('Semua')

  const filtered = DATA_SISWA_DUMMY.filter((s) => {
    const matchSearch =
      s.namaLengkap.toLowerCase().includes(search.toLowerCase()) ||
      s.idPendaftaran.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase())
    const matchStatus = filterStatus === 'Semua' || s.statusPendaftaran === filterStatus
    return matchSearch && matchStatus
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-800">Data Calon Siswa</h1>
        <p className="text-sm text-slate-500">
          Total {DATA_SISWA_DUMMY.length} pendaftar
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
            <option value="Selesai">Selesai</option>
            <option value="Terverifikasi">Terverifikasi</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        </div>
      </div>

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
    </div>
  )
}

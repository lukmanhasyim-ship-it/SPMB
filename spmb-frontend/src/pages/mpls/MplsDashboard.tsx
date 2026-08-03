import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Users, CheckCircle2, ScanLine, GraduationCap, RefreshCw, FileSpreadsheet, AlertTriangle } from 'lucide-react'
import * as XLSX from 'xlsx'
import { useAuthStore } from '../../store/authStore'
import Card from '../../components/ui/Card'
import Loader from '../../components/ui/Loader'
import { api } from '../../services/api'
import type { KehadiranMpls } from '../../types'
import { formatWIBShort } from '../../utils/dateUtils'

function todayWIB(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' })
}

function buildExportSheet(rows: KehadiranMpls[]): XLSX.WorkSheet {
  const data = rows.map((k, i) => ({
    No: i + 1,
    'ID Pendaftaran': k.id_pendaftaran,
    'Nama Lengkap': k.nama_lengkap,
    Email: k.email,
    Jurusan: k.jurusan,
    Gelombang: k.gelombang,
    Tanggal: k.tanggal,
    Jam: k.jam ? String(k.jam).slice(0, 8) : k.jam,
    Keterangan: k.keterangan || '',
    'Scan Oleh': k.scan_oleh,
    'Waktu Input': k.created_at,
  }))
  const ws = XLSX.utils.json_to_sheet(data)
  ws['!cols'] = [
    { wch: 4 }, { wch: 20 }, { wch: 26 }, { wch: 26 }, { wch: 14 },
    { wch: 14 }, { wch: 12 }, { wch: 12 }, { wch: 10 }, { wch: 22 }, { wch: 22 },
  ]
  return ws
}

function groupByTanggal(rows: KehadiranMpls[]): { tanggal: string; rows: KehadiranMpls[] }[] {
  const map = new Map<string, KehadiranMpls[]>()
  for (const k of rows) {
    const key = k.tanggal || ''
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(k)
  }
  return [...map.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([tanggal, list]) => ({ tanggal, rows: list }))
}

function sheetNameFromTanggal(tanggal: string): string {
  const base = tanggal ? formatWIBShort(tanggal) : 'Tanpa Tanggal'
  return base.replace(/[\\/:?*[\]]/g, '-').slice(0, 31) || 'Tanggal'
}

export default function MplsDashboard() {
  const { user } = useAuthStore()
  const [kehadiran, setKehadiran] = useState<KehadiranMpls[]>([])
  const [totalSiswa, setTotalSiswa] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [exporting, setExporting] = useState(false)
  const [tanggal, setTanggal] = useState(todayWIB())

  const fetchData = async () => {
    setLoading(true)
    setError('')
    try {
      const [res, siswaRes] = await Promise.all([
        api.mpls.getKehadiran(tanggal),
        api.siswa.getAll(),
      ])
      if (res.status === 'ok') {
        setKehadiran((res.data as KehadiranMpls[]) || [])
      }
      if (siswaRes.status === 'ok') {
        const list = siswaRes.data as Array<Record<string, string>>
        setTotalSiswa(list.length)
      }
    } catch (err) {
      setKehadiran([])
      setError(
        err instanceof Error && err.message
          ? err.message
          : 'Gagal memuat data kehadiran. Pastikan VITE_API_URL menunjuk ke deployment backend terbaru.',
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tanggal])

  const handleExport = () => {
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, buildExportSheet(kehadiran), sheetNameFromTanggal(tanggal))
    XLSX.writeFile(wb, `absensi-mpls-${tanggal}.xlsx`)
  }

  const handleExportAll = async () => {
    setExporting(true)
    try {
      const res = await api.mpls.getKehadiran()
      if (res.status === 'ok') {
        const all = (res.data as KehadiranMpls[]) || []
        if (all.length === 0) {
          alert('Belum ada data absensi untuk diekspor')
          return
        }
        const wb = XLSX.utils.book_new()
        for (const group of groupByTanggal(all)) {
          XLSX.utils.book_append_sheet(wb, buildExportSheet(group.rows), sheetNameFromTanggal(group.tanggal))
        }
        XLSX.writeFile(wb, 'absensi-mpls-semua.xlsx')
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Gagal mengekspor data'
      alert(message)
    } finally {
      setExporting(false)
    }
  }

  const jurusanCounts = kehadiran.reduce<Record<string, number>>((acc, k) => {
    const key = k.jurusan || 'Tanpa Jurusan'
    acc[key] = (acc[key] || 0) + 1
    return acc
  }, {})

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Dashboard Panitia MPLS</h1>
          <p className="text-sm text-slate-500">
            Selamat bertugas, {user?.nama} — pantau kehadiran siswa baru
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchData()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-600 hover:bg-slate-50 transition-all"
          >
            <RefreshCw className="w-4 h-4" />
            Muat Ulang
          </button>
          <Link
            to="/mpls/scan"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-green hover:bg-brand-green-dark text-white text-sm font-medium shadow-sm hover:shadow-md transition-all"
          >
            <ScanLine className="w-4 h-4" />
            Scan Absen
          </Link>
        </div>
      </div>

      {error && (
        <Card className="p-4 border-red-100 bg-red-50/50">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-600">Gagal memuat data</p>
              <p className="text-xs text-slate-500 mt-1">{error}</p>
            </div>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{totalSiswa}</p>
              <p className="text-xs text-slate-500">Total Siswa Baru</p>
            </div>
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-green-light text-brand-green flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{kehadiran.length}</p>
              <p className="text-xs text-slate-500">Hadir Hari Ini</p>
            </div>
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800">Kehadiran per Jurusan</p>
              <p className="text-xs text-slate-500">
                {Object.entries(jurusanCounts).map(([j, c]) => `${j}: ${c}`).join(' · ') || 'Belum ada'}
              </p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-700">Rekap Kehadiran</h3>
            <p className="text-xs text-slate-500">Daftar siswa yang sudah di-scan hari ini</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="date"
              value={tanggal}
              onChange={(e) => setTanggal(e.target.value || todayWIB())}
              className="px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30"
            />
            <button
              onClick={handleExport}
              disabled={kehadiran.length === 0}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-green hover:bg-brand-green-dark text-white text-sm font-medium shadow-sm hover:shadow-md transition-all disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none disabled:cursor-not-allowed"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Export Hari Ini
            </button>
            <button
              onClick={handleExportAll}
              disabled={exporting}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-600 hover:bg-slate-50 transition-all disabled:opacity-50"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Export Semua
            </button>
          </div>
        </div>

        {loading ? (
          <Loader className="min-h-[20vh]" />
        ) : kehadiran.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-8">Belum ada siswa yang hadir pada tanggal {formatWIBShort(tanggal)}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-slate-400 border-b border-slate-100">
                  <th className="pb-2 pr-4 font-medium">No</th>
                  <th className="pb-2 pr-4 font-medium">ID Pendaftaran</th>
                  <th className="pb-2 pr-4 font-medium">Nama</th>
                  <th className="pb-2 pr-4 font-medium">Jurusan</th>
                  <th className="pb-2 pr-4 font-medium">Jam</th>
                  <th className="pb-2 pr-4 font-medium">Keterangan</th>
                  <th className="pb-2 font-medium">Petugas</th>
                </tr>
              </thead>
              <tbody>
                {kehadiran.map((k, i) => (
                  <tr key={k.id_kehadiran} className="border-b border-slate-50">
                    <td className="py-2.5 pr-4 text-slate-500">{i + 1}</td>
                    <td className="py-2.5 pr-4 font-medium text-brand-green">{k.id_pendaftaran}</td>
                    <td className="py-2.5 pr-4 text-slate-700">{k.nama_lengkap}</td>
                    <td className="py-2.5 pr-4 text-slate-600">{k.jurusan || '-'}</td>
                    <td className="py-2.5 pr-4 text-slate-600">
                      {k.jam ? String(k.jam).slice(0, 5) : k.jam}
                    </td>
                    <td className="py-2.5 pr-4 text-slate-600">{k.keterangan || '-'}</td>
                    <td className="py-2.5 text-slate-600">{k.scan_oleh || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}

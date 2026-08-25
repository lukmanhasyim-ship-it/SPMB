import { useEffect, useState, useMemo } from 'react'
import { Search, Filter, ChevronDown, Download, Trash2, AlertTriangle, X } from 'lucide-react'
import * as XLSX from 'xlsx'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Loader from '../../components/ui/Loader'
import { api } from '../../services/api'
import { DATA_JURUSAN } from '../../data/constants'
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
  pilihanJurusan: string
  pilihanAlternatif: string
  namaLengkap: string
  jenisKelamin: string
  nisn: string
  nik: string
  tempatLahir: string
  tanggalLahir: string
  agama: string
  asalSekolah: string
  dusun: string
  rtRw: string
  desa: string
  kecamatan: string
  kabupaten: string
  kodePos: string
  koordinatMaps: string
  dokumenAlamatUrl: string
  tinggalBersama: string
  namaAyah: string
  kerjaAyah: string
  namaIbu: string
  kerjaIbu: string
  teleponOrtu: string
  estimasiPenghasilanOrtu: string
  prestasi: string
  alasanPilihJurusan: string
  referralNama: string
  referralKategori: string
  gelombang: string
  tahunAjaran: string
  statusPendaftaran: string
  waktuDaftar: string
}

export default function AdminSiswa() {
  const [siswaList, setSiswaList] = useState<SiswaRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<StatusPendaftaran | 'Semua'>('Semua')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [confirmModalOpen, setConfirmModalOpen] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [deletingAll, setDeletingAll] = useState(false)

  const fetchData = async () => {
    try {
      const res = await api.siswa.getAll()
      if (res.status === 'ok') {
        const list = (res.data as Array<Record<string, string>>).map((s) => ({
          idPendaftaran: s.id_pendaftaran || '',
          email: s.email || '',
          pilihanJurusan: s.pilihan_jurusan || '',
          pilihanAlternatif: s.pilihan_alternatif || '',
          namaLengkap: s.nama_lengkap || '',
          jenisKelamin: s.jenis_kelamin || '',
          nisn: s.nisn || '',
          nik: s.nik || '',
          tempatLahir: s.tempat_lahir || '',
          tanggalLahir: s.tanggal_lahir || '',
          agama: s.agama || '',
          asalSekolah: s.asal_sekolah || '',
          dusun: s.dusun || '',
          rtRw: s.rt_rw || '',
          desa: s.desa || '',
          kecamatan: s.kecamatan || '',
          kabupaten: s.kabupaten || '',
          kodePos: s.kode_pos || '',
          koordinatMaps: s.koordinat_maps || '',
          dokumenAlamatUrl: s.dokumen_alamat_url || '',
          tinggalBersama: s.tinggal_bersama || '',
          namaAyah: s.nama_ayah || '',
          kerjaAyah: s.kerja_ayah || '',
          namaIbu: s.nama_ibu || '',
          kerjaIbu: s.kerja_ibu || '',
          teleponOrtu: s.telepon_ortu || '',
          estimasiPenghasilanOrtu: s.estimasi_penghasilan_ortu || '',
          prestasi: s.prestasi || '',
          alasanPilihJurusan: s.alasan_pilih_jurusan || '',
          referralNama: s.referral_nama || '',
          referralKategori: s.referral_kategori || '',
          gelombang: s.gelombang || '',
          tahunAjaran: s.tahun_ajaran || '',
          statusPendaftaran: s.status_pendaftaran || 'Draft',
          waktuDaftar: s.waktu_daftar || '',
        }))
        setSiswaList(list)
      }
    } catch {
      // Handle error
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
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
    const mapRow = (s: SiswaRow) => ({
      'ID Pendaftaran': s.idPendaftaran,
      'Nama Lengkap': s.namaLengkap,
      'Email': s.email,
      'Jenis Kelamin': s.jenisKelamin,
      'NISN': s.nisn,
      'NIK': s.nik,
      'Tempat Lahir': s.tempatLahir,
      'Tanggal Lahir': s.tanggalLahir,
      'Agama': s.agama,
      'Asal Sekolah': s.asalSekolah,
      'Pilihan Jurusan': s.pilihanJurusan,
      'Pilihan Alternatif': s.pilihanAlternatif,
      'Alasan Pilih Jurusan': s.alasanPilihJurusan,
      'Dusun': s.dusun,
      'RT/RW': s.rtRw,
      'Desa': s.desa,
      'Kecamatan': s.kecamatan,
      'Kabupaten': s.kabupaten,
      'Kode Pos': s.kodePos,
      'Koordinat Maps': s.koordinatMaps,
      'Link Google Maps': s.koordinatMaps ? `https://www.google.com/maps?q=${s.koordinatMaps}` : '',
      'Tinggal Bersama': s.tinggalBersama,
      'Nama Ayah': s.namaAyah,
      'Pekerjaan Ayah': s.kerjaAyah,
      'Nama Ibu': s.namaIbu,
      'Pekerjaan Ibu': s.kerjaIbu,
      'Telepon Orang Tua': s.teleponOrtu,
      'Estimasi Penghasilan': s.estimasiPenghasilanOrtu,
      'Prestasi': s.prestasi,
      'Referral (Kategori)': s.referralKategori,
      'Referral (Nama)': s.referralNama,
      'Gelombang': s.gelombang,
      'Tahun Ajaran': s.tahunAjaran,
      'Status': s.statusPendaftaran,
      'Waktu Daftar': s.waktuDaftar,
    })

    const colWidths = [
      { wch: 18 }, { wch: 25 }, { wch: 30 }, { wch: 14 }, { wch: 14 }, { wch: 18 },
      { wch: 16 }, { wch: 14 }, { wch: 12 }, { wch: 22 }, { wch: 14 }, { wch: 14 },
      { wch: 35 }, { wch: 20 }, { wch: 10 }, { wch: 18 }, { wch: 18 }, { wch: 18 },
      { wch: 10 }, { wch: 22 }, { wch: 30 }, { wch: 14 }, { wch: 20 }, { wch: 18 },
      { wch: 20 }, { wch: 18 }, { wch: 18 }, { wch: 22 }, { wch: 30 }, { wch: 16 },
      { wch: 20 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 20 },
    ]

    const jurusanOrder = DATA_JURUSAN.map((j) => j.value) as string[]
    const grouped = new Map<string, SiswaRow[]>()
    for (const s of filtered) {
      const key = s.pilihanJurusan && jurusanOrder.includes(s.pilihanJurusan) ? s.pilihanJurusan : 'Belum Ditentukan'
      const arr = grouped.get(key) || []
      arr.push(s)
      grouped.set(key, arr)
    }

    const wb = XLSX.utils.book_new()

    for (const jurusan of jurusanOrder) {
      const rows = grouped.get(jurusan)
      if (!rows || rows.length === 0) continue
      const data = rows.map((s, i) => ({ 'No': i + 1, ...mapRow(s) }))
      const ws = XLSX.utils.json_to_sheet(data)
      ws['!cols'] = [{ wch: 5 }, ...colWidths]
      XLSX.utils.book_append_sheet(wb, ws, jurusan)
    }

    const emptyRows = grouped.get('Belum Ditentukan')
    if (emptyRows && emptyRows.length > 0) {
      const data = emptyRows.map((s, i) => ({ 'No': i + 1, ...mapRow(s) }))
      const ws = XLSX.utils.json_to_sheet(data)
      ws['!cols'] = [{ wch: 5 }, ...colWidths]
      XLSX.utils.book_append_sheet(wb, ws, 'Belum Ditentukan')
    }

    XLSX.writeFile(wb, `data-siswa-${Date.now()}.xlsx`)
  }

  const handleDeleteOne = async (siswa: SiswaRow) => {
    if (!confirm(`Yakin ingin menghapus data ${siswa.namaLengkap} (${siswa.idPendaftaran})?`)) return
    setDeletingId(siswa.idPendaftaran)
    try {
      await api.siswa.remove(siswa.idPendaftaran, siswa.email)
      fetchData()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Gagal menghapus data siswa')
    } finally {
      setDeletingId(null)
    }
  }

  const handleOpenConfirmModal = () => {
    setConfirmText('')
    setConfirmModalOpen(true)
  }

  const handleDeleteAll = async () => {
    setDeletingAll(true)
    try {
      await api.siswa.deleteAll('HAPUS')
      setConfirmModalOpen(false)
      setConfirmText('')
      fetchData()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Gagal menghapus semua data siswa')
    } finally {
      setDeletingAll(false)
    }
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
        {siswaList.length > 0 && (
          <>
            {filtered.length > 0 && (
              <Button variant="secondary" onClick={handleExport} className="flex items-center gap-1.5 whitespace-nowrap">
                <Download className="w-4 h-4" />
                Export Excel
              </Button>
            )}
            <Button variant="danger" onClick={handleOpenConfirmModal} className="flex items-center gap-1.5 whitespace-nowrap">
              <Trash2 className="w-4 h-4" />
              Hapus Semua
            </Button>
          </>
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
                  <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs uppercase">Referral</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs uppercase">Status</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs uppercase">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
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
                        {siswa.referralNama ? (
                          <>
                            <p className="font-medium text-slate-800">{siswa.referralNama}</p>
                            <p className="text-xs text-slate-400">{siswa.referralKategori || '-'}</p>
                          </>
                        ) : (
                          <span className="text-xs text-slate-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[siswa.statusPendaftaran]}`}>
                          {siswa.statusPendaftaran}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleDeleteOne(siswa)}
                          disabled={deletingId !== null}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
                          title="Hapus data siswa"
                        >
                          {deletingId === siswa.idPendaftaran ? (
                            <svg className="animate-spin w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </Card>
        </div>
      )}

      {confirmModalOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-800">Hapus Semua Data Siswa</h3>
              <button onClick={() => setConfirmModalOpen(false)} disabled={deletingAll}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="p-4 rounded-xl bg-red-50 border border-red-100 mb-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-red-600 mb-1">
                <AlertTriangle className="w-4 h-4" />
                Tindakan ini tidak dapat dibatalkan
              </div>
              <p className="text-xs text-red-500">
                Semua data calon siswa ({siswaList.length}) beserta data terkait
                (MPLS kehadiran/izin, like/komentar/pengingat event) akan dihapus permanen.
                Akun admin, guru, dan panitia tidak terpengaruh.
              </p>
            </div>

            <label className="text-xs font-medium text-slate-600 mb-1 block">
              Ketik <span className="font-bold tracking-wide">HAPUS</span> untuk konfirmasi
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              disabled={deletingAll}
              placeholder="HAPUS"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500"
            />

            <div className="flex gap-2 mt-6">
              <Button variant="ghost" className="flex-1" onClick={() => setConfirmModalOpen(false)} disabled={deletingAll}>
                Batal
              </Button>
              <Button
                variant="danger"
                className="flex-1"
                onClick={handleDeleteAll}
                disabled={confirmText.trim().toUpperCase() !== 'HAPUS'}
                loading={deletingAll}
              >
                <Trash2 className="w-4 h-4" />
                Hapus Semua
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

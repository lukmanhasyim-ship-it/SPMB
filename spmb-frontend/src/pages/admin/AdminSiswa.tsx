import { useEffect, useState, useMemo } from 'react'
import type { ChangeEvent } from 'react'
import { Search, Filter, ChevronDown, Download, Trash2, AlertTriangle, Pencil, Loader2 } from 'lucide-react'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Loader from '../../components/ui/Loader'
import InputField from '../../components/ui/InputField'
import Modal from '../../components/ui/Modal'
import ResponsiveTable from '../../components/ui/ResponsiveTable'
import ReferralFields from '../student/components/ReferralFields'
import { api } from '../../services/api'
import { DATA_JURUSAN, DATA_AGAMA, DATA_TINGGAL_BERSAMA, DATA_ESTIMASI_PENGHASILAN } from '../../data/constants'
import type { StatusPendaftaran } from '../../types'

const statusColors: Record<string, string> = {
  Draft: 'bg-slate-100 text-slate-600',
  Terdaftar: 'bg-blue-50 text-blue-700',
  Selesai: 'bg-blue-50 text-blue-600',
  Terverifikasi: 'bg-brand-green-light text-brand-green-dark',
}

const FIELD_LABELS: Record<string, string> = {
  pilihanJurusan: 'Program Keahlian',
  alasanPilihJurusan: 'Alasan Memilih Program Keahlian',
  namaLengkap: 'Nama Lengkap',
  jenisKelamin: 'Jenis Kelamin',
  nisn: 'NISN',
  nik: 'NIK',
  tempatLahir: 'Tempat Lahir',
  tanggalLahir: 'Tanggal Lahir',
  agama: 'Agama',
  asalSekolah: 'Asal Sekolah',
  dusun: 'Dusun/Jalan',
  rtRw: 'RT/RW',
  desa: 'Desa/Kelurahan',
  kecamatan: 'Kecamatan',
  kabupaten: 'Kabupaten/Kota',
  kodePos: 'Kode Pos',
  koordinatMaps: 'Koordinat Maps',
  tinggalBersama: 'Tinggal Bersama',
  namaPondok: 'Nama Pondok Pesantren',
  namaAyah: 'Nama Ayah',
  kerjaAyah: 'Pekerjaan Ayah',
  namaIbu: 'Nama Ibu',
  kerjaIbu: 'Pekerjaan Ibu',
  teleponOrtu: 'Telepon Orang Tua/Wali',
  teleponSiswa: 'No. HP Siswa',
  anakKe: 'Anak Ke-',
  jumlahSaudara: 'Jumlah Saudara',
  tinggiBadan: 'Tinggi Badan',
  beratBadan: 'Berat Badan',
  tahunLahirAyah: 'Tahun Lahir Ayah',
  tahunLahirIbu: 'Tahun Lahir Ibu',
  namaWali: 'Nama Wali',
  tahunLahirWali: 'Tahun Lahir Wali',
  estimasiPenghasilanAyah: 'Estimasi Penghasilan Ayah',
  estimasiPenghasilanIbu: 'Estimasi Penghasilan Ibu',
  estimasiPenghasilanWali: 'Estimasi Penghasilan Wali',
  prestasi: 'Prestasi',
  statusPendaftaran: 'Status Pendaftaran',
  referralKategori: 'Referral (Kategori)',
  referralNama: 'Referral (Nama)',
}

const SENSITIVE_FIELDS = new Set([
  'referralKategori',
  'referralNama',
  'statusPendaftaran',
  'nik',
  'nisn',
  'namaLengkap',
])

interface SiswaRow {
  idPendaftaran: string
  email: string
  pilihanJurusan: string
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
  namaPondok: string
  namaAyah: string
  kerjaAyah: string
  namaIbu: string
  kerjaIbu: string
  teleponOrtu: string
  teleponSiswa: string
  anakKe: string
  jumlahSaudara: string
  tinggiBadan: string
  beratBadan: string
  tahunLahirAyah: string
  tahunLahirIbu: string
  namaWali: string
  tahunLahirWali: string
  estimasiPenghasilanAyah: string
  estimasiPenghasilanIbu: string
  estimasiPenghasilanWali: string
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
  const [editingSiswa, setEditingSiswa] = useState<SiswaRow | null>(null)
  const [editForm, setEditForm] = useState<Record<string, string>>({})
  const [editErrors, setEditErrors] = useState<Record<string, string>>({})
  const [savingEdit, setSavingEdit] = useState(false)
  const [saveConfirmOpen, setSaveConfirmOpen] = useState(false)
  const [confirmSaveText, setConfirmSaveText] = useState('')

  const fetchData = async () => {
    try {
      const res = await api.siswa.getAll()
      if (res.status === 'ok') {
        const list = (res.data as Array<Record<string, string>>).map((s) => ({
          idPendaftaran: s.id_pendaftaran || '',
          email: s.email || '',
          pilihanJurusan: s.pilihan_jurusan || '',
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
          namaPondok: s.nama_pondok || '',
          namaAyah: s.nama_ayah || '',
          kerjaAyah: s.kerja_ayah || '',
          namaIbu: s.nama_ibu || '',
          kerjaIbu: s.kerja_ibu || '',
          teleponOrtu: s.telepon_ortu || '',
          teleponSiswa: s.telepon_siswa || '',
          anakKe: s.anak_ke || '',
          jumlahSaudara: s.jumlah_saudara || '',
          tinggiBadan: s.tinggi_badan || '',
          beratBadan: s.berat_badan || '',
          tahunLahirAyah: s.tahun_lahir_ayah || '',
          tahunLahirIbu: s.tahun_lahir_ibu || '',
          namaWali: s.nama_wali || '',
          tahunLahirWali: s.tahun_lahir_wali || '',
          estimasiPenghasilanAyah: s.estimasi_penghasilan_ayah || '',
          estimasiPenghasilanIbu: s.estimasi_penghasilan_ibu || '',
          estimasiPenghasilanWali: s.estimasi_penghasilan_wali || '',
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

  const pendingChanges = useMemo(() => {
    if (!editingSiswa) return []
    const before = editingSiswa as unknown as Record<string, string>
    return Object.keys(FIELD_LABELS)
      .filter((key) => String(before[key] ?? '') !== String(editForm[key] ?? ''))
      .map((key) => ({
        key,
        label: FIELD_LABELS[key],
        from: String(before[key] ?? '') || '-',
        to: String(editForm[key] ?? '') || '-',
        sensitive: SENSITIVE_FIELDS.has(key),
      }))
  }, [editingSiswa, editForm])

  const handleExport = async () => {
    // Lazy-load xlsx agar bundle awal ringan (hanya dimuat saat klik Export).
    const XLSX = await import('xlsx')
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
      'Program Keahlian': s.pilihanJurusan,
      'Alasan Memilih Program Keahlian': s.alasanPilihJurusan,
      'Dusun': s.dusun,
      'RT/RW': s.rtRw,
      'Desa': s.desa,
      'Kecamatan': s.kecamatan,
      'Kabupaten': s.kabupaten,
      'Kode Pos': s.kodePos,
      'Koordinat Maps': s.koordinatMaps,
      'Link Google Maps': s.koordinatMaps ? `https://www.google.com/maps?q=${s.koordinatMaps}` : '',
      'Tinggal Bersama': s.tinggalBersama,
      'Nama Pondok Pesantren': s.namaPondok,
      'Nama Ayah': s.namaAyah,
      'Pekerjaan Ayah': s.kerjaAyah,
      'Nama Ibu': s.namaIbu,
      'Pekerjaan Ibu': s.kerjaIbu,
      'Telepon Orang Tua': s.teleponOrtu,
      'No. HP Siswa': s.teleponSiswa,
      'Anak Ke-': s.anakKe,
      'Jumlah Saudara': s.jumlahSaudara,
      'Tinggi Badan': s.tinggiBadan,
      'Berat Badan': s.beratBadan,
      'Tahun Lahir Ayah': s.tahunLahirAyah,
      'Tahun Lahir Ibu': s.tahunLahirIbu,
      'Nama Wali': s.namaWali,
      'Tahun Lahir Wali': s.tahunLahirWali,
      'Estimasi Penghasilan Ayah': s.estimasiPenghasilanAyah,
      'Estimasi Penghasilan Ibu': s.estimasiPenghasilanIbu,
      'Estimasi Penghasilan Wali': s.estimasiPenghasilanWali,
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
      { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 14 },
      { wch: 30 }, { wch: 30 }, { wch: 30 }, { wch: 14 }, { wch: 14 }, { wch: 20 },
      { wch: 14 }, { wch: 14 }, { wch: 20 }, { wch: 20 },
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

  const openEdit = (siswa: SiswaRow) => {
    setEditingSiswa(siswa)
    setEditForm({
      pilihanJurusan: siswa.pilihanJurusan,
      alasanPilihJurusan: siswa.alasanPilihJurusan,
      namaLengkap: siswa.namaLengkap,
      jenisKelamin: siswa.jenisKelamin,
      nisn: siswa.nisn,
      nik: siswa.nik,
      tempatLahir: siswa.tempatLahir,
      tanggalLahir: siswa.tanggalLahir,
      agama: siswa.agama,
      asalSekolah: siswa.asalSekolah,
      dusun: siswa.dusun,
      rtRw: siswa.rtRw,
      desa: siswa.desa,
      kecamatan: siswa.kecamatan,
      kabupaten: siswa.kabupaten,
      kodePos: siswa.kodePos,
      koordinatMaps: siswa.koordinatMaps,
      tinggalBersama: siswa.tinggalBersama,
      namaPondok: siswa.namaPondok,
      namaAyah: siswa.namaAyah,
      kerjaAyah: siswa.kerjaAyah,
      namaIbu: siswa.namaIbu,
      kerjaIbu: siswa.kerjaIbu,
      teleponOrtu: siswa.teleponOrtu,
      teleponSiswa: siswa.teleponSiswa,
      anakKe: siswa.anakKe,
      jumlahSaudara: siswa.jumlahSaudara,
      tinggiBadan: siswa.tinggiBadan,
      beratBadan: siswa.beratBadan,
      tahunLahirAyah: siswa.tahunLahirAyah,
      tahunLahirIbu: siswa.tahunLahirIbu,
      namaWali: siswa.namaWali,
      tahunLahirWali: siswa.tahunLahirWali,
      estimasiPenghasilanAyah: siswa.estimasiPenghasilanAyah,
      estimasiPenghasilanIbu: siswa.estimasiPenghasilanIbu,
      estimasiPenghasilanWali: siswa.estimasiPenghasilanWali,
      prestasi: siswa.prestasi,
      referralKategori: siswa.referralKategori,
      referralNama: siswa.referralNama,
      statusPendaftaran: siswa.statusPendaftaran,
    })
    setEditErrors({})
    setConfirmSaveText('')
    setSaveConfirmOpen(false)
  }

  const closeEdit = () => {
    setEditingSiswa(null)
    setEditForm({})
    setEditErrors({})
    setConfirmSaveText('')
    setSaveConfirmOpen(false)
  }

  const handleEditChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    if (name === 'tinggalBersama' && value !== 'Wali') {
      setEditForm((prev) => ({ ...prev, tinggalBersama: value, namaWali: '', tahunLahirWali: '', estimasiPenghasilanWali: '' }))
      return
    }
    setEditForm((prev) => ({ ...prev, [name]: value }))
    setEditErrors((prev) => ({ ...prev, [name]: '' }))
  }

  const handleReferralChange = (name: 'referralKategori' | 'referralNama', value: string) => {
    setEditForm((prev) => ({ ...prev, [name]: value }))
    setEditErrors((prev) => ({ ...prev, [name]: '' }))
  }

  const validateEdit = (): boolean => {
    const errs: Record<string, string> = {}
    if (!editForm.namaLengkap) errs.namaLengkap = 'Nama lengkap wajib diisi'
    if (!editForm.pilihanJurusan) errs.pilihanJurusan = 'Pilih program keahlian utama'
    if (!editForm.nik) errs.nik = 'NIK wajib diisi'
    else if (editForm.nik.length !== 16) errs.nik = 'NIK harus tepat 16 digit'
    if (!editForm.nisn) errs.nisn = 'NISN wajib diisi'
    if (!editForm.jenisKelamin) errs.jenisKelamin = 'Pilih jenis kelamin'
    if (!editForm.tempatLahir) errs.tempatLahir = 'Tempat lahir wajib diisi'
    if (!editForm.tanggalLahir) errs.tanggalLahir = 'Tanggal lahir wajib diisi'
    if (!editForm.agama) errs.agama = 'Pilih agama'
    if (!editForm.dusun) errs.dusun = 'Dusun/Jalan wajib diisi'
    if (!editForm.desa) errs.desa = 'Desa/Kelurahan wajib diisi'
    if (!editForm.kecamatan) errs.kecamatan = 'Kecamatan wajib diisi'
    if (!editForm.kabupaten) errs.kabupaten = 'Kabupaten/Kota wajib diisi'
    if (!editForm.tinggalBersama) errs.tinggalBersama = 'Pilih tinggal bersama'
    if (editForm.tinggalBersama === 'Pondok' && !editForm.namaPondok) errs.namaPondok = 'Nama pondok pesantren wajib diisi'
    if (!editForm.namaAyah) errs.namaAyah = 'Nama ayah wajib diisi'
    if (!editForm.tahunLahirAyah) errs.tahunLahirAyah = 'Tahun lahir ayah wajib diisi'
    if (!editForm.namaIbu) errs.namaIbu = 'Nama ibu wajib diisi'
    if (!editForm.tahunLahirIbu) errs.tahunLahirIbu = 'Tahun lahir ibu wajib diisi'
    if (editForm.tinggalBersama === 'Wali') {
      if (!editForm.namaWali) errs.namaWali = 'Nama wali wajib diisi'
      if (!editForm.tahunLahirWali) errs.tahunLahirWali = 'Tahun lahir wali wajib diisi'
      if (!editForm.estimasiPenghasilanWali) errs.estimasiPenghasilanWali = 'Estimasi penghasilan wali wajib dipilih'
    }
    if (!editForm.teleponOrtu) errs.teleponOrtu = 'No. telepon wajib diisi'
    if (!editForm.estimasiPenghasilanAyah) errs.estimasiPenghasilanAyah = 'Estimasi penghasilan ayah wajib dipilih'
    if (!editForm.estimasiPenghasilanIbu) errs.estimasiPenghasilanIbu = 'Estimasi penghasilan ibu wajib dipilih'
    if (!editForm.statusPendaftaran) errs.statusPendaftaran = 'Pilih status pendaftaran'
    setEditErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSaveEdit = () => {
    if (!editingSiswa || !validateEdit()) return
    if (pendingChanges.length === 0) return
    setConfirmSaveText('')
    setSaveConfirmOpen(true)
  }

  const confirmSaveEdit = async () => {
    if (!editingSiswa || confirmSaveText.trim().toUpperCase() !== 'SIMPAN') return
    setSavingEdit(true)
    try {
      await api.siswa.update(editingSiswa.email, {
        pilihan_jurusan: editForm.pilihanJurusan,
        alasan_pilih_jurusan: editForm.alasanPilihJurusan,
        nama_lengkap: editForm.namaLengkap,
        jenis_kelamin: editForm.jenisKelamin,
        nisn: editForm.nisn,
        nik: editForm.nik,
        tempat_lahir: editForm.tempatLahir,
        tanggal_lahir: editForm.tanggalLahir,
        agama: editForm.agama,
        asal_sekolah: editForm.asalSekolah,
        dusun: editForm.dusun,
        rt_rw: editForm.rtRw,
        desa: editForm.desa,
        kecamatan: editForm.kecamatan,
        kabupaten: editForm.kabupaten,
        kode_pos: editForm.kodePos,
        koordinat_maps: editForm.koordinatMaps,
        tinggal_bersama: editForm.tinggalBersama,
        nama_pondok: editForm.namaPondok,
        nama_ayah: editForm.namaAyah,
        kerja_ayah: editForm.kerjaAyah,
        nama_ibu: editForm.namaIbu,
        kerja_ibu: editForm.kerjaIbu,
        telepon_ortu: editForm.teleponOrtu,
        telepon_siswa: editForm.teleponSiswa,
        anak_ke: editForm.anakKe,
        jumlah_saudara: editForm.jumlahSaudara,
        tinggi_badan: editForm.tinggiBadan,
        berat_badan: editForm.beratBadan,
        tahun_lahir_ayah: editForm.tahunLahirAyah,
        tahun_lahir_ibu: editForm.tahunLahirIbu,
        nama_wali: editForm.namaWali,
        tahun_lahir_wali: editForm.tahunLahirWali,
        estimasi_penghasilan_ayah: editForm.estimasiPenghasilanAyah,
        estimasi_penghasilan_ibu: editForm.estimasiPenghasilanIbu,
        estimasi_penghasilan_wali: editForm.estimasiPenghasilanWali,
        prestasi: editForm.prestasi,
        referral_kategori: editForm.referralKategori,
        referral_nama: editForm.referralNama,
        status_pendaftaran: editForm.statusPendaftaran,
      })
      setSaveConfirmOpen(false)
      setConfirmSaveText('')
      closeEdit()
      fetchData()
      alert(`Data ${editingSiswa.namaLengkap} berhasil diperbarui`)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Gagal memperbarui data siswa')
    } finally {
      setSavingEdit(false)
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
        <ResponsiveTable
          caption="Daftar pendaftar"
          emptyMessage="Tidak ada data yang cocok"
          minWidth={960}
          data={filtered}
          getRowId={(siswa) => siswa.idPendaftaran}
          columns={[
            { key: 'no', header: 'No', render: (_, i) => <span className="text-slate-500">{i + 1}</span> },
            { key: 'id', header: 'ID', render: (s) => <span className="font-mono text-xs text-slate-700">{s.idPendaftaran}</span> },
            {
              key: 'nama', header: 'Nama',
              render: (s) => (
                <div>
                  <p className="font-medium text-slate-800">{s.namaLengkap}</p>
                  <p className="text-xs text-slate-400">{s.email}</p>
                </div>
              ),
            },
            { key: 'jurusan', header: 'Program Keahlian', render: (s) => s.pilihanJurusan },
            { key: 'gelombang', header: 'Gelombang', render: (s) => s.gelombang },
            {
              key: 'referral', header: 'Referral',
              render: (s) => s.referralNama ? (
                <div>
                  <p className="font-medium text-slate-800">{s.referralNama}</p>
                  <p className="text-xs text-slate-400">{s.referralKategori || '-'}</p>
                </div>
              ) : <span className="text-xs text-slate-400">-</span>,
            },
            {
              key: 'status', header: 'Status',
              render: (s) => (
                <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[s.statusPendaftaran]}`}>
                  {s.statusPendaftaran}
                </span>
              ),
            },
            {
              key: 'aksi', header: 'Aksi',
              render: (s) => (
                <div className="flex items-center gap-1">
                  <button onClick={() => openEdit(s)} aria-label="Edit data siswa" title="Edit data siswa" className="flex min-h-touch min-w-touch items-center justify-center rounded-lg text-slate-400 transition-colors hover:text-brand-green hover:bg-brand-green-light/50">
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button onClick={() => handleDeleteOne(s)} disabled={deletingId !== null} aria-label="Hapus data siswa" title="Hapus data siswa" className="flex min-h-touch min-w-touch items-center justify-center rounded-lg text-slate-400 transition-colors hover:text-red-500 hover:bg-red-50 disabled:opacity-50">
                    {deletingId === s.idPendaftaran ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                  </button>
                </div>
              ),
            },
          ]}
          mobileCard={(siswa, index) => (
            <Card className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-slate-800">{index + 1}. {siswa.namaLengkap}</p>
                  <p className="truncate font-mono text-[11px] text-slate-400">{siswa.idPendaftaran}</p>
                </div>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${statusColors[siswa.statusPendaftaran]}`}>
                  {siswa.statusPendaftaran}
                </span>
              </div>
              <dl className="mt-3 space-y-1 text-xs">
                <div className="flex justify-between gap-3"><dt className="text-slate-400">Program</dt><dd className="min-w-0 truncate text-right font-medium text-slate-700">{siswa.pilihanJurusan}</dd></div>
                <div className="flex justify-between gap-3"><dt className="text-slate-400">Gelombang</dt><dd className="font-medium text-slate-700">{siswa.gelombang}</dd></div>
                <div className="flex justify-between gap-3"><dt className="text-slate-400">Referral</dt><dd className="min-w-0 truncate text-right font-medium text-slate-700">{siswa.referralNama || '-'}</dd></div>
              </dl>
              <div className="mt-3 flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
                <Button variant="secondary" onClick={() => openEdit(siswa)} className="px-4 text-xs">
                  <Pencil className="h-4 w-4" /> Edit
                </Button>
                <Button variant="danger" onClick={() => handleDeleteOne(siswa)} disabled={deletingId !== null} loading={deletingId === siswa.idPendaftaran} className="px-4 text-xs">
                  <Trash2 className="h-4 w-4" /> Hapus
                </Button>
              </div>
            </Card>
          )}
        />
      )}

      <Modal
        open={confirmModalOpen}
        onClose={() => setConfirmModalOpen(false)}
        dismissible={!deletingAll}
        title="Hapus Semua Data Siswa"
        footer={
          <>
            <Button variant="ghost" fullWidth className="sm:w-auto" onClick={() => setConfirmModalOpen(false)} disabled={deletingAll}>
              Batal
            </Button>
            <Button
              variant="danger"
              fullWidth
              className="sm:w-auto"
              onClick={handleDeleteAll}
              disabled={confirmText.trim().toUpperCase() !== 'HAPUS'}
              loading={deletingAll}
            >
              <Trash2 className="h-4 w-4" />
              Hapus Semua
            </Button>
          </>
        }
      >
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
              className="min-h-touch w-full rounded-xl border border-slate-200 px-4 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 sm:text-sm"
            />

      </Modal>

      {editingSiswa && (
        <Modal
          open
          onClose={closeEdit}
          dismissible={!savingEdit}
          size="xl"
          title="Edit Data Siswa"
          footer={
            <>
              <Button variant="ghost" fullWidth className="sm:w-auto" onClick={closeEdit} disabled={savingEdit}>
                Batal
              </Button>
              <Button
                variant="primary"
                fullWidth
                className="sm:w-auto"
                onClick={handleSaveEdit}
                disabled={pendingChanges.length === 0}
                loading={savingEdit}
              >
                Simpan Perubahan
              </Button>
            </>
          }
        >
          <p className="mb-4 text-xs text-slate-500">
            {editingSiswa.namaLengkap} · <span className="font-mono">{editingSiswa.idPendaftaran}</span>
          </p>
          <div className="space-y-5">
              <div className="bg-slate-50 rounded-xl p-4">
                <p className="text-sm font-semibold text-slate-700 mb-3">Status Pendaftaran</p>
                <InputField
                  label="Status"
                  name="statusPendaftaran"
                  value={editForm.statusPendaftaran}
                  onChange={handleEditChange}
                  required
                  error={editErrors.statusPendaftaran}
                  options={[
                    { value: 'Draft', label: 'Draft' },
                    { value: 'Terdaftar', label: 'Terdaftar' },
                    { value: 'Selesai', label: 'Selesai' },
                    { value: 'Terverifikasi', label: 'Terverifikasi' },
                  ]}
                />
              </div>

              <div>
                <p className="text-sm font-semibold text-slate-700 mb-3">Pilihan Program Keahlian</p>
                <div className="space-y-4">
                  <InputField
                    label="Program Keahlian Utama"
                    name="pilihanJurusan"
                    value={editForm.pilihanJurusan}
                    onChange={handleEditChange}
                    required
                    error={editErrors.pilihanJurusan}
                    options={DATA_JURUSAN.map((j) => ({ value: j.value, label: j.label }))}
                  />
                  <InputField
                    label="Alasan Memilih Program Keahlian (Motivasi Memilih Program Keahlian)"
                    name="alasanPilihJurusan"
                    value={editForm.alasanPilihJurusan}
                    onChange={handleEditChange}
                    textarea
                  />
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4">
                <p className="text-sm font-semibold text-slate-700 mb-3">Data Pribadi</p>
                <div className="space-y-4">
                  <InputField
                    label="Nama Lengkap (sesuai Ijazah/Akte)"
                    name="namaLengkap"
                    value={editForm.namaLengkap}
                    onChange={handleEditChange}
                    required
                    error={editErrors.namaLengkap}
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <InputField
                      label="Jenis Kelamin"
                      name="jenisKelamin"
                      value={editForm.jenisKelamin}
                      onChange={handleEditChange}
                      required
                      error={editErrors.jenisKelamin}
                      options={[
                        { value: 'Laki-laki', label: 'Laki-laki' },
                        { value: 'Perempuan', label: 'Perempuan' },
                      ]}
                    />
                    <InputField
                      label="Agama"
                      name="agama"
                      value={editForm.agama}
                      onChange={handleEditChange}
                      required
                      error={editErrors.agama}
                      options={DATA_AGAMA.map((a) => ({ value: a, label: a }))}
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <InputField
                      label="NISN"
                      name="nisn"
                      value={editForm.nisn}
                      onChange={handleEditChange}
                      required
                      error={editErrors.nisn}
                      helperText="NISN dapat dilihat di kartu pelajar maupun di raport."
                    />
                    <InputField
                      label="NIK"
                      name="nik"
                      value={editForm.nik}
                      onChange={handleEditChange}
                      placeholder="16 digit NIK"
                      required
                      maxLength={16}
                      error={editErrors.nik}
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <InputField
                      label="Tempat Lahir"
                      name="tempatLahir"
                      value={editForm.tempatLahir}
                      onChange={handleEditChange}
                      required
                      error={editErrors.tempatLahir}
                    />
                    <InputField
                      label="Tanggal Lahir"
                      name="tanggalLahir"
                      type="date"
                      value={editForm.tanggalLahir}
                      onChange={handleEditChange}
                      required
                      error={editErrors.tanggalLahir}
                    />
                  </div>
                  <InputField
                    label="Asal Sekolah"
                    name="asalSekolah"
                    value={editForm.asalSekolah}
                    onChange={handleEditChange}
                  />
                  <InputField
                    label="No. HP Siswa (WhatsApp)"
                    name="teleponSiswa"
                    value={editForm.teleponSiswa}
                    onChange={handleEditChange}
                    type="tel"
                    placeholder="628xxxxxxxxxx"
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <InputField
                      label="Anak Ke-"
                      name="anakKe"
                      value={editForm.anakKe}
                      onChange={handleEditChange}
                      type="number"
                      min={1}
                      placeholder="Contoh: 1"
                    />
                    <InputField
                      label="Jumlah Saudara"
                      name="jumlahSaudara"
                      value={editForm.jumlahSaudara}
                      onChange={handleEditChange}
                      type="number"
                      min={0}
                      placeholder="Contoh: 2"
                      helperText="Jumlah saudara kandung."
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <InputField
                      label="Tinggi Badan (cm)"
                      name="tinggiBadan"
                      value={editForm.tinggiBadan}
                      onChange={handleEditChange}
                      type="number"
                      min={1}
                      placeholder="Contoh: 155"
                    />
                    <InputField
                      label="Berat Badan (kg)"
                      name="beratBadan"
                      value={editForm.beratBadan}
                      onChange={handleEditChange}
                      type="number"
                      min={1}
                      placeholder="Contoh: 45"
                    />
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4">
                <p className="text-sm font-semibold text-slate-700 mb-3">Alamat & Titik Koordinat</p>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <InputField
                      label="Dusun/Jalan"
                      name="dusun"
                      value={editForm.dusun}
                      onChange={handleEditChange}
                      required
                      error={editErrors.dusun}
                    />
                    <InputField
                      label="RT / RW"
                      name="rtRw"
                      value={editForm.rtRw}
                      onChange={handleEditChange}
                      placeholder="Contoh: 001/002"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <InputField
                      label="Desa/Kelurahan"
                      name="desa"
                      value={editForm.desa}
                      onChange={handleEditChange}
                      required
                      error={editErrors.desa}
                    />
                    <InputField
                      label="Kecamatan"
                      name="kecamatan"
                      value={editForm.kecamatan}
                      onChange={handleEditChange}
                      required
                      error={editErrors.kecamatan}
                    />
                    <InputField
                      label="Kabupaten/Kota"
                      name="kabupaten"
                      value={editForm.kabupaten}
                      onChange={handleEditChange}
                      required
                      error={editErrors.kabupaten}
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <InputField
                      label="Kode Pos"
                      name="kodePos"
                      value={editForm.kodePos}
                      onChange={handleEditChange}
                    />
                    <InputField
                      label="Koordinat Maps"
                      name="koordinatMaps"
                      value={editForm.koordinatMaps}
                      onChange={handleEditChange}
                      placeholder="Contoh: -8.4112,114.1234"
                    />
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4">
                <p className="text-sm font-semibold text-slate-700 mb-3">Orang Tua/Wali</p>
                <div className="space-y-4">
                  <InputField
                    label="Tinggal Bersama"
                    name="tinggalBersama"
                    value={editForm.tinggalBersama}
                    onChange={handleEditChange}
                    required
                    error={editErrors.tinggalBersama}
                    options={DATA_TINGGAL_BERSAMA.map((t) => ({ value: t, label: t }))}
                  />
                  {editForm.tinggalBersama === 'Pondok' && (
                    <InputField
                      label="Nama Pondok Pesantren"
                      name="namaPondok"
                      value={editForm.namaPondok}
                      onChange={handleEditChange}
                      required
                      error={editErrors.namaPondok}
                    />
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <InputField
                      label="Nama Ayah"
                      name="namaAyah"
                      value={editForm.namaAyah}
                      onChange={handleEditChange}
                      required
                      error={editErrors.namaAyah}
                    />
                    <InputField
                      label="Tahun Lahir Ayah"
                      name="tahunLahirAyah"
                      value={editForm.tahunLahirAyah}
                      onChange={handleEditChange}
                      type="number"
                      min={1920}
                      max={2005}
                      placeholder="Contoh: 1980"
                      required
                      error={editErrors.tahunLahirAyah}
                      helperText="Data dapat dilihat di KK (Kartu Keluarga)"
                    />
                    <InputField
                      label="Estimasi Penghasilan Ayah"
                      name="estimasiPenghasilanAyah"
                      value={editForm.estimasiPenghasilanAyah}
                      onChange={handleEditChange}
                      required
                      error={editErrors.estimasiPenghasilanAyah}
                      options={DATA_ESTIMASI_PENGHASILAN.map((p) => ({ value: p, label: p }))}
                    />
                  </div>
                  <InputField
                    label="Pekerjaan Ayah"
                    name="kerjaAyah"
                    value={editForm.kerjaAyah}
                    onChange={handleEditChange}
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <InputField
                      label="Nama Ibu"
                      name="namaIbu"
                      value={editForm.namaIbu}
                      onChange={handleEditChange}
                      required
                      error={editErrors.namaIbu}
                    />
                    <InputField
                      label="Tahun Lahir Ibu"
                      name="tahunLahirIbu"
                      value={editForm.tahunLahirIbu}
                      onChange={handleEditChange}
                      type="number"
                      min={1920}
                      max={2005}
                      placeholder="Contoh: 1982"
                      required
                      error={editErrors.tahunLahirIbu}
                      helperText="Data dapat dilihat di KK (Kartu Keluarga)"
                    />
                    <InputField
                      label="Estimasi Penghasilan Ibu"
                      name="estimasiPenghasilanIbu"
                      value={editForm.estimasiPenghasilanIbu}
                      onChange={handleEditChange}
                      required
                      error={editErrors.estimasiPenghasilanIbu}
                      options={DATA_ESTIMASI_PENGHASILAN.map((p) => ({ value: p, label: p }))}
                    />
                  </div>
                  <InputField
                    label="Pekerjaan Ibu"
                    name="kerjaIbu"
                    value={editForm.kerjaIbu}
                    onChange={handleEditChange}
                  />
                  {editForm.tinggalBersama === 'Wali' && (
                    <div className="border-t border-slate-100 pt-4">
                      <p className="text-sm font-semibold text-slate-700 mb-3">Data Wali</p>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <InputField
                          label="Nama Wali"
                          name="namaWali"
                          value={editForm.namaWali}
                          onChange={handleEditChange}
                          placeholder="Nama lengkap wali"
                          required
                          error={editErrors.namaWali}
                        />
                        <InputField
                          label="Tahun Lahir Wali"
                          name="tahunLahirWali"
                          value={editForm.tahunLahirWali}
                          onChange={handleEditChange}
                          type="number"
                          min={1920}
                          max={2005}
                          placeholder="Contoh: 1978"
                          required
                          error={editErrors.tahunLahirWali}
                          helperText="Data dapat dilihat di KK (Kartu Keluarga)"
                        />
                        <InputField
                          label="Estimasi Penghasilan Wali"
                          name="estimasiPenghasilanWali"
                          value={editForm.estimasiPenghasilanWali}
                          onChange={handleEditChange}
                          required
                          error={editErrors.estimasiPenghasilanWali}
                          options={DATA_ESTIMASI_PENGHASILAN.map((p) => ({ value: p, label: p }))}
                        />
                      </div>
                    </div>
                  )}
                  <InputField
                    label="No. Telepon Orang Tua/Wali (WhatsApp)"
                    name="teleponOrtu"
                    value={editForm.teleponOrtu}
                    onChange={handleEditChange}
                    type="tel"
                    placeholder="628xxxxxxxxxx"
                    required
                    error={editErrors.teleponOrtu}
                  />
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4">
                <p className="text-sm font-semibold text-slate-700 mb-3">Prestasi (Opsional)</p>
                <InputField
                  label="Prestasi"
                  name="prestasi"
                  value={editForm.prestasi}
                  onChange={handleEditChange}
                  textarea
                  placeholder="Contoh: Juara 1 OSN Matematika tingkat Kabupaten..."
                />
              </div>

              <ReferralFields
                kategori={editForm.referralKategori}
                nama={editForm.referralNama}
                onChange={handleReferralChange}
              />
            </div>

          {pendingChanges.length === 0 && (
            <p className="mt-4 text-center text-xs text-slate-400">Belum ada perubahan pada data.</p>
          )}
        </Modal>
      )}

      {saveConfirmOpen && editingSiswa && (
        <Modal
          open
          onClose={() => setSaveConfirmOpen(false)}
          dismissible={!savingEdit}
          title="Konfirmasi Perubahan Data Siswa"
          footer={
            <>
              <Button variant="ghost" fullWidth className="sm:w-auto" onClick={() => setSaveConfirmOpen(false)} disabled={savingEdit}>
                Batal
              </Button>
              <Button
                variant="primary"
                fullWidth
                className="sm:w-auto"
                onClick={confirmSaveEdit}
                disabled={confirmSaveText.trim().toUpperCase() !== 'SIMPAN'}
                loading={savingEdit}
              >
                Ya, Simpan Perubahan
              </Button>
            </>
          }
        >
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-100 mb-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-amber-700 mb-1">
                <AlertTriangle className="w-4 h-4" />
                Periksa kembali sebelum menyimpan
              </div>
              <p className="text-xs text-amber-600">
                Anda akan mengubah data <span className="font-semibold">{editingSiswa.namaLengkap}</span>{' '}
                (<span className="font-mono">{editingSiswa.idPendaftaran}</span>). Perubahan langsung
                tersimpan dan berdampak pada formulir pendaftaran serta rekap referral.
              </p>
            </div>

            <p className="text-xs font-medium text-slate-600 mb-2">
              {pendingChanges.length} field akan diubah:
            </p>
            <div className="space-y-2 mb-5 max-h-64 overflow-y-auto pr-1">
              {pendingChanges.map((change) => (
                <div
                  key={change.key}
                  className={`rounded-lg border px-3 py-2 text-xs ${
                    change.sensitive
                      ? 'bg-amber-50/60 border-amber-200'
                      : 'bg-slate-50 border-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-700">{change.label}</span>
                    {change.sensitive && (
                      <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 font-medium">
                        Perlu perhatian
                      </span>
                    )}
                  </div>
                  <div className="mt-1 break-words text-slate-500">
                    <span className="line-through">{change.from}</span>
                    <span className="mx-2 text-slate-400">→</span>
                    <span className="font-medium text-slate-800">{change.to}</span>
                  </div>
                </div>
              ))}
            </div>

            <label className="text-xs font-medium text-slate-600 mb-1 block">
              Ketik <span className="font-bold tracking-wide">SIMPAN</span> untuk konfirmasi
            </label>
            <input
              type="text"
              value={confirmSaveText}
              onChange={(e) => setConfirmSaveText(e.target.value)}
              disabled={savingEdit}
              placeholder="SIMPAN"
              className="min-h-touch w-full rounded-xl border border-slate-200 px-4 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 sm:text-sm"
            />
        </Modal>
      )}
    </div>
  )
}

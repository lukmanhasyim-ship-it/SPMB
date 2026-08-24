import { useState } from 'react'
import type { ChangeEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { UserPlus, GraduationCap, MapPin, Users, Award, Mail, CheckCircle2, Printer, FileText } from 'lucide-react'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import InputField from '../../components/ui/InputField'
import { useAuthStore } from '../../store/authStore'
import type { User } from '../../types'
import { api } from '../../services/api'
import { DATA_JURUSAN, DATA_AGAMA, DATA_TINGGAL_BERSAMA, DATA_KATEGORI_REFERRAL } from '../../data/constants'

const KATEGORI_GURU_INTERNAL = 'Guru SMKS AL AZHAR SEMPU'
const KATEGORI_GURU_SMP = 'Guru SMP/MTs'

const buatFormKosong = (user: User | null) => {
  const isGuruInternal = user?.role === 'guru'
  const isGuruSmp = user?.role === 'guru_smp'
  return {
    email: '',
    namaLengkap: '',
    pilihanJurusan: '',
    pilihanAlternatif: '',
    alasanPilihJurusan: '',
    jenisKelamin: '',
    nisn: '',
    nik: '',
    tempatLahir: '',
    tanggalLahir: '',
    agama: '',
    asalSekolah: isGuruSmp ? user?.asal_sekolah || '' : '',
    dusun: '',
    rtRw: '',
    desa: '',
    kecamatan: '',
    kabupaten: '',
    kodePos: '',
    koordinatMaps: '',
    tinggalBersama: '',
    namaAyah: '',
    kerjaAyah: '',
    namaIbu: '',
    kerjaIbu: '',
    teleponOrtu: '',
    prestasi: '',
    referralKategori: isGuruInternal ? KATEGORI_GURU_INTERNAL : isGuruSmp ? KATEGORI_GURU_SMP : '',
    referralNama: isGuruInternal || isGuruSmp ? user?.nama || '' : '',
  }
}

interface AdminDaftarSiswaProps {
  cetakPath?: string
}

export default function AdminDaftarSiswa({ cetakPath = '/admin/formulir' }: AdminDaftarSiswaProps) {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const referralTerkunci = user?.role === 'guru' || user?.role === 'guru_smp'
  const isGuruSmp = user?.role === 'guru_smp'
  const sekolahTerkunci = isGuruSmp && !!user?.asal_sekolah
  const [form, setForm] = useState(() => buatFormKosong(user))
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<{ idPendaftaran: string; namaLengkap: string } | null>(null)

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    setErrors((prev) => ({ ...prev, [name]: '' }))
  }

  const validate = (): boolean => {
    const errs: Record<string, string> = {}
    if (!form.namaLengkap) errs.namaLengkap = 'Nama lengkap wajib diisi'
    if (!form.pilihanJurusan) errs.pilihanJurusan = 'Pilih jurusan utama'
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) errs.email = 'Format email tidak valid'
    if (!form.nik) errs.nik = 'NIK wajib diisi'
    else if (form.nik.length !== 16) errs.nik = 'NIK harus tepat 16 digit'
    if (!form.jenisKelamin) errs.jenisKelamin = 'Pilih jenis kelamin'
    if (!form.tempatLahir) errs.tempatLahir = 'Tempat lahir wajib diisi'
    if (!form.tanggalLahir) errs.tanggalLahir = 'Tanggal lahir wajib diisi'
    if (!form.agama) errs.agama = 'Pilih agama'
    if (!form.dusun) errs.dusun = 'Dusun/Jalan wajib diisi'
    if (!form.desa) errs.desa = 'Desa/Kelurahan wajib diisi'
    if (!form.kecamatan) errs.kecamatan = 'Kecamatan wajib diisi'
    if (!form.kabupaten) errs.kabupaten = 'Kabupaten/Kota wajib diisi'
    if (!form.tinggalBersama) errs.tinggalBersama = 'Pilih tinggal bersama'
    if (!form.namaAyah) errs.namaAyah = 'Nama ayah wajib diisi'
    if (!form.namaIbu) errs.namaIbu = 'Nama ibu wajib diisi'
    if (!form.teleponOrtu) errs.teleponOrtu = 'No. telepon wajib diisi'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return
    setSubmitting(true)
    try {
      const res = await api.siswa.create({
        email: form.email,
        pilihan_jurusan: form.pilihanJurusan,
        pilihan_alternatif: form.pilihanAlternatif,
        alasan_pilih_jurusan: form.alasanPilihJurusan,
        nama_lengkap: form.namaLengkap,
        jenis_kelamin: form.jenisKelamin,
        nisn: form.nisn,
        nik: form.nik,
        tempat_lahir: form.tempatLahir,
        tanggal_lahir: form.tanggalLahir,
        agama: form.agama,
        asal_sekolah: form.asalSekolah,
        dusun: form.dusun,
        rt_rw: form.rtRw,
        desa: form.desa,
        kecamatan: form.kecamatan,
        kabupaten: form.kabupaten,
        kode_pos: form.kodePos,
        koordinat_maps: form.koordinatMaps,
        tinggal_bersama: form.tinggalBersama,
        nama_ayah: form.namaAyah,
        kerja_ayah: form.kerjaAyah,
        nama_ibu: form.namaIbu,
        kerja_ibu: form.kerjaIbu,
        telepon_ortu: form.teleponOrtu,
        prestasi: form.prestasi,
        referral_kategori: form.referralKategori,
        referral_nama: form.referralNama,
      })
      const data = (res.data || {}) as { id_pendaftaran?: string }
      setResult({
        idPendaftaran: data.id_pendaftaran || '',
        namaLengkap: form.namaLengkap,
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Gagal mendaftarkan siswa'
      alert(message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleReset = () => {
    setForm(buatFormKosong(user))
    setErrors({})
    setResult(null)
  }

  const sectionIcon = (color: string, Icon: typeof UserPlus) => (
    <div className={`w-10 h-10 ${color} rounded-full flex items-center justify-center`}>
      <Icon className="w-5 h-5" />
    </div>
  )

  return (
    <div className="page-fade-in space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 bg-brand-green-light rounded-xl flex items-center justify-center">
          <UserPlus className="w-5 h-5 text-brand-green" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-800">Daftarkan Siswa</h1>
          <p className="text-sm text-slate-500">
            {referralTerkunci
              ? 'Referral otomatis tercatat atas nama Anda — email boleh dikosongkan jika siswa tidak punya email'
              : 'Daftarkan siswa atas nama panitia — email boleh dikosongkan jika siswa tidak punya email'}
          </p>
        </div>
      </div>

      <Card className="p-4 sm:p-5">
        <div className="flex items-center gap-3 mb-4">
          {sectionIcon('bg-brand-green-light', Mail)}
          <div>
            <h3 className="text-base font-semibold text-slate-800">Identitas Akun</h3>
            <p className="text-xs text-slate-500">Email digunakan siswa untuk login SPMB</p>
          </div>
        </div>
        <div className="space-y-4">
          <InputField
            label="Email (Opsional)"
            name="email"
            value={form.email}
            onChange={handleChange}
            type="email"
            placeholder="contoh@email.com"
            error={errors.email}
          />
          <InputField
            label="Nama Lengkap (sesuai Ijazah/Akte)"
            name="namaLengkap"
            value={form.namaLengkap}
            onChange={handleChange}
            placeholder="Masukkan nama lengkap"
            required
            error={errors.namaLengkap}
          />
        </div>
      </Card>

      <Card className="p-4 sm:p-5">
        <div className="flex items-center gap-3 mb-4">
          {sectionIcon('bg-brand-green-light', GraduationCap)}
          <div>
            <h3 className="text-base font-semibold text-slate-800">Pilihan Jurusan</h3>
            <p className="text-xs text-slate-500">Kompetensi keahlian yang dipilih calon siswa</p>
          </div>
        </div>
        <div className="space-y-4">
          <InputField
            label="Jurusan Utama"
            name="pilihanJurusan"
            value={form.pilihanJurusan}
            onChange={handleChange}
            required
            error={errors.pilihanJurusan}
            options={DATA_JURUSAN.map((j) => ({ value: j.value, label: j.label }))}
          />
          <InputField
            label="Jurusan Alternatif (Opsional)"
            name="pilihanAlternatif"
            value={form.pilihanAlternatif}
            onChange={handleChange}
            options={[
              { value: '', label: 'Tidak ada pilihan alternatif' },
              ...DATA_JURUSAN.filter((j) => j.value !== form.pilihanJurusan).map((j) => ({
                value: j.value,
                label: `${j.value} - ${j.label}`,
              })),
            ]}
          />
          <InputField
            label="Alasan Memilih Jurusan Alternatif"
            name="alasanPilihJurusan"
            value={form.alasanPilihJurusan}
            onChange={handleChange}
            textarea
            placeholder="Alasan Memilih Jurusan Alternatif (opsional)"
          />
          <div className="border-t border-slate-100 pt-4">
            <p className="text-sm font-semibold text-slate-700 mb-1">
              Referral (Opsional)
            </p>
            <p className="text-xs text-slate-500 mb-3">
              Nama guru, siswa kelas XI/XII, atau alumni yang memandu pendaftaran
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InputField
                label="Kategori"
                name="referralKategori"
                value={form.referralKategori}
                onChange={handleChange}
                disabled={referralTerkunci}
                options={DATA_KATEGORI_REFERRAL}
              />
              <InputField
                label="Nama"
                name="referralNama"
                value={form.referralNama}
                onChange={handleChange}
                disabled={referralTerkunci}
                placeholder={referralTerkunci ? 'Otomatis dari akun Anda' : 'Nama yang memandu pendaftaran'}
              />
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-4 sm:p-5">
        <div className="flex items-center gap-3 mb-4">
          {sectionIcon('bg-blue-50', Users)}
          <div>
            <h3 className="text-base font-semibold text-slate-800">Data Pribadi</h3>
            <p className="text-xs text-slate-500">Data diri calon siswa</p>
          </div>
        </div>
        <div className="space-y-4">
          <InputField
            label="Jenis Kelamin"
            name="jenisKelamin"
            value={form.jenisKelamin}
            onChange={handleChange}
            required
            error={errors.jenisKelamin}
            options={[
              { value: 'Laki-laki', label: 'Laki-laki' },
              { value: 'Perempuan', label: 'Perempuan' },
            ]}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InputField
              label="NISN (Opsional)"
              name="nisn"
              value={form.nisn}
              onChange={handleChange}
              placeholder="Nomor Induk Siswa Nasional"
            />
            <InputField
              label="NIK"
              name="nik"
              value={form.nik}
              onChange={handleChange}
              placeholder="16 digit NIK"
              required
              maxLength={16}
              error={errors.nik}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InputField
              label="Tempat Lahir"
              name="tempatLahir"
              value={form.tempatLahir}
              onChange={handleChange}
              placeholder="Kabupaten/Kota"
              required
              error={errors.tempatLahir}
            />
            <InputField
              label="Tanggal Lahir"
              name="tanggalLahir"
              type="date"
              value={form.tanggalLahir}
              onChange={handleChange}
              required
              error={errors.tanggalLahir}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InputField
              label="Agama"
              name="agama"
              value={form.agama}
              onChange={handleChange}
              required
              error={errors.agama}
              options={DATA_AGAMA.map((a) => ({ value: a, label: a }))}
            />
            <div>
              <InputField
                label="Asal Sekolah"
                name="asalSekolah"
                value={form.asalSekolah}
                onChange={handleChange}
                placeholder="Nama SMP/MTs asal"
                disabled={sekolahTerkunci}
              />
              {isGuruSmp && (
                <p className={`mt-1 text-xs ${sekolahTerkunci ? 'text-slate-400' : 'text-amber-600'}`}>
                  {sekolahTerkunci
                    ? 'Otomatis dari akun guru Anda'
                    : 'Akun belum memiliki asal sekolah — hubungi admin SMKS agar terisi otomatis'}
                </p>
              )}
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-4 sm:p-5">
        <div className="flex items-center gap-3 mb-4">
          {sectionIcon('bg-orange-50', MapPin)}
          <div>
            <h3 className="text-base font-semibold text-slate-800">Alamat & Titik Koordinat</h3>
            <p className="text-xs text-slate-500">Alamat domisili calon siswa</p>
          </div>
        </div>
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InputField
              label="Dusun/Jalan"
              name="dusun"
              value={form.dusun}
              onChange={handleChange}
              placeholder="Nama dusun atau jalan"
              required
              error={errors.dusun}
            />
            <InputField
              label="RT / RW"
              name="rtRw"
              value={form.rtRw}
              onChange={handleChange}
              placeholder="Contoh: 001/002"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <InputField
              label="Desa/Kelurahan"
              name="desa"
              value={form.desa}
              onChange={handleChange}
              placeholder="Desa"
              required
              error={errors.desa}
            />
            <InputField
              label="Kecamatan"
              name="kecamatan"
              value={form.kecamatan}
              onChange={handleChange}
              placeholder="Kecamatan"
              required
              error={errors.kecamatan}
            />
            <InputField
              label="Kabupaten/Kota"
              name="kabupaten"
              value={form.kabupaten}
              onChange={handleChange}
              placeholder="Kabupaten/Kota"
              required
              error={errors.kabupaten}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InputField
              label="Kode Pos"
              name="kodePos"
              value={form.kodePos}
              onChange={handleChange}
              placeholder="Kode pos"
            />
            <InputField
              label="Koordinat Maps"
              name="koordinatMaps"
              value={form.koordinatMaps}
              onChange={handleChange}
              placeholder="Contoh: -8.4112,114.1234"
            />
          </div>
        </div>
      </Card>

      <Card className="p-4 sm:p-5">
        <div className="flex items-center gap-3 mb-4">
          {sectionIcon('bg-purple-50', Users)}
          <div>
            <h3 className="text-base font-semibold text-slate-800">Orang Tua/Wali</h3>
            <p className="text-xs text-slate-500">Informasi orang tua atau wali calon siswa</p>
          </div>
        </div>
        <div className="space-y-4">
          <InputField
            label="Tinggal Bersama"
            name="tinggalBersama"
            value={form.tinggalBersama}
            onChange={handleChange}
            required
            error={errors.tinggalBersama}
            options={DATA_TINGGAL_BERSAMA.map((t) => ({ value: t, label: t }))}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InputField
              label="Nama Ayah"
              name="namaAyah"
              value={form.namaAyah}
              onChange={handleChange}
              placeholder="Nama lengkap ayah"
              required
              error={errors.namaAyah}
            />
            <InputField
              label="Pekerjaan Ayah"
              name="kerjaAyah"
              value={form.kerjaAyah}
              onChange={handleChange}
              placeholder="Pekerjaan ayah"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InputField
              label="Nama Ibu"
              name="namaIbu"
              value={form.namaIbu}
              onChange={handleChange}
              placeholder="Nama lengkap ibu"
              required
              error={errors.namaIbu}
            />
            <InputField
              label="Pekerjaan Ibu"
              name="kerjaIbu"
              value={form.kerjaIbu}
              onChange={handleChange}
              placeholder="Pekerjaan ibu"
            />
          </div>
          <InputField
            label="No. Telepon Orang Tua/Wali (WhatsApp)"
            name="teleponOrtu"
            value={form.teleponOrtu}
            onChange={handleChange}
            placeholder="08xxxxxxxxxx"
            required
            error={errors.teleponOrtu}
          />
        </div>
      </Card>

      <Card className="p-4 sm:p-5">
        <div className="flex items-center gap-3 mb-4">
          {sectionIcon('bg-amber-50', Award)}
          <div>
            <h3 className="text-base font-semibold text-slate-800">Prestasi (Opsional)</h3>
            <p className="text-xs text-slate-500">Catat prestasi selama SMP/MTs</p>
          </div>
        </div>
        <InputField
          label="Prestasi"
          name="prestasi"
          value={form.prestasi}
          onChange={handleChange}
          textarea
          placeholder="Contoh: Juara 1 OSN Matematika tingkat Kabupaten..."
        />
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSubmit} loading={submitting} className="text-base py-3 px-8">
          <UserPlus className="w-4 h-4" />
          {submitting ? 'Menyimpan...' : 'Daftarkan Siswa'}
        </Button>
      </div>

      {result && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md p-6 text-center">
            <div className="mx-auto mb-4 w-14 h-14 bg-brand-green-light rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-7 h-7 text-brand-green" />
            </div>
            <h2 className="text-lg font-bold text-slate-800">Siswa Berhasil Didaftarkan</h2>
            <p className="text-sm text-slate-500 mt-1">{result.namaLengkap}</p>
            <div className="mt-5 bg-slate-50 rounded-xl p-4">
              <p className="text-xs text-slate-400 mb-1">ID Pendaftaran</p>
              <p className="font-mono text-lg font-bold text-brand-green-dark tracking-wide">
                {result.idPendaftaran || '-'}
              </p>
            </div>
            <p className="text-xs text-slate-400 mt-3">
              Salin ID ini untuk pencatatan. Formulir pendaftaran dapat langsung dicetak.
            </p>
            <div className="flex flex-col gap-2 mt-6">
              <Button
                onClick={() => navigate(`${cetakPath}?id=${encodeURIComponent(result.idPendaftaran)}`)}
                className="w-full"
              >
                <Printer className="w-4 h-4" />
                Cetak Formulir
              </Button>
              <Button variant="secondary" onClick={handleReset} className="w-full">
                <FileText className="w-4 h-4" />
                Daftarkan Siswa Lain
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}

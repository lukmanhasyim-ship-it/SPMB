import { useState, useEffect } from 'react'
import type { ChangeEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, MapPin, GraduationCap, Map as MapIcon, ExternalLink } from 'lucide-react'
import { useStudentStore } from '../../../store/studentStore'
import { useAuthStore } from '../../../store/authStore'
import InputField from '../../../components/ui/InputField'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import ReferralFields from '../components/ReferralFields'
import { DATA_JURUSAN, DATA_AGAMA } from '../../../data/constants'

const defaultPosition: [number, number] = [-8.4112, 114.1234]



export default function FormPendaftaranAwal() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { data, updateData, loadSiswa, selesaikanPendaftaranAwal } = useStudentStore()
  const [position, setPosition] = useState<[number, number]>(defaultPosition)
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!data.idPendaftaran && user?.email) {
      loadSiswa(user.email)
    }
  }, [])

  useEffect(() => {
    if (data.koordinatMaps) {
      const parts = data.koordinatMaps.split(',')
      if (parts.length === 2) {
        const lat = parseFloat(parts[0])
        const lng = parseFloat(parts[1])
        if (!isNaN(lat) && !isNaN(lng)) {
          setPosition([lat, lng])
        }
      }
    }
  }, [data.koordinatMaps])

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    updateData({ [name]: value })
    setErrors((prev) => ({ ...prev, [name]: '' }))
  }





  const validate = (): boolean => {
    const errs: Record<string, string> = {}
    if (!data.pilihanJurusan) errs.pilihanJurusan = 'Pilih jurusan utama'
    if (!data.namaLengkap) errs.namaLengkap = 'Nama lengkap harus diisi'
    if (!data.jenisKelamin) errs.jenisKelamin = 'Pilih jenis kelamin'
    if (!data.nik) errs.nik = 'NIK harus diisi'
    else if (data.nik.length !== 16) errs.nik = 'NIK harus tepat 16 digit'
    if (!data.tempatLahir) errs.tempatLahir = 'Tempat lahir harus diisi'
    if (!data.tanggalLahir) errs.tanggalLahir = 'Tanggal lahir harus diisi'
    if (!data.agama) errs.agama = 'Pilih agama'
    if (!data.dusun) errs.dusun = 'Dusun/Jalan harus diisi'
    if (!data.desa) errs.desa = 'Desa/Kelurahan harus diisi'
    if (!data.kecamatan) errs.kecamatan = 'Kecamatan harus diisi'
    if (!data.kabupaten) errs.kabupaten = 'Kabupaten/Kota harus diisi'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return
    setSubmitting(true)
    try {
      await selesaikanPendaftaranAwal()
      navigate('/student/kartu-pendaftaran')
    } catch {
      alert('Gagal menyimpan data')
    } finally {
      setSubmitting(false)
    }
  }

  const handleBack = () => {
    navigate('/student/dashboard')
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={handleBack}
          className="flex items-center gap-1.5 text-sm text-brand-green hover:text-brand-green-dark font-medium transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali
        </button>
        <h2 className="text-lg font-bold text-slate-800">Pendaftaran Awal</h2>
        <div className="w-20" />
      </div>

      <Card className="p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 bg-brand-green-light rounded-full flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-brand-green" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-800">Pilihan Jurusan</h3>
            <p className="text-xs text-slate-500">Pilih kompetensi keahlian yang Anda minati</p>
          </div>
        </div>
        <div className="space-y-4">
          <InputField
            label="Jurusan Utama"
            name="pilihanJurusan"
            value={data.pilihanJurusan}
            onChange={handleChange}
            required
            error={errors.pilihanJurusan}
            options={DATA_JURUSAN.map((j) => ({ value: j.value, label: j.label }))}
          />
          <InputField
            label="Jurusan Alternatif (Opsional)"
            name="pilihanAlternatif"
            value={data.pilihanAlternatif}
            onChange={handleChange}
            options={[
              { value: '', label: 'Tidak ada pilihan alternatif' },
              ...DATA_JURUSAN.filter((j) => j.value !== data.pilihanJurusan).map((j) => ({
                value: j.value,
                label: `${j.value} - ${j.label}`,
              })),
            ]}
          />
          <ReferralFields
            kategori={data.referralKategori}
            nama={data.referralNama}
            onChange={(name, value) => updateData({ [name]: value })}
          />
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-800">Data Pribadi</h3>
            <p className="text-xs text-slate-500">Isi data diri Anda dengan lengkap dan benar</p>
          </div>
        </div>
        <div className="space-y-4">
          <InputField
            label="Nama Lengkap (sesuai Ijazah/Akte)"
            name="namaLengkap"
            value={data.namaLengkap}
            onChange={handleChange}
            placeholder="Masukkan nama lengkap"
            required
            error={errors.namaLengkap}
          />

          <InputField
            label="Jenis Kelamin"
            name="jenisKelamin"
            value={data.jenisKelamin}
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
              value={data.nisn}
              onChange={handleChange}
              placeholder="Nomor Induk Siswa Nasional"
            />
            <InputField
              label="NIK"
              name="nik"
              value={data.nik}
              onChange={handleChange}
              placeholder="16 digit NIK"
              required
              error={errors.nik}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InputField
              label="Tempat Lahir"
              name="tempatLahir"
              value={data.tempatLahir}
              onChange={handleChange}
              placeholder="Kabupaten/Kota"
              required
              error={errors.tempatLahir}
            />
            <InputField
              label="Tanggal Lahir"
              name="tanggalLahir"
              type="date"
              value={data.tanggalLahir}
              onChange={handleChange}
              required
              error={errors.tanggalLahir}
            />
          </div>

          <InputField
            label="Agama"
            name="agama"
            value={data.agama}
            onChange={handleChange}
            required
            error={errors.agama}
            options={DATA_AGAMA.map((a) => ({ value: a, label: a }))}
          />

          <InputField
            label="Asal Sekolah"
            name="asalSekolah"
            value={data.asalSekolah}
            onChange={handleChange}
            placeholder="Nama SMP/MTs asal"
          />

          <InputField
            label="No. HP Siswa (WhatsApp)"
            name="teleponSiswa"
            value={data.teleponSiswa}
            onChange={handleChange}
            type="tel"
            placeholder="628xxxxxxxxxx"
          />
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 bg-orange-50 rounded-full flex items-center justify-center">
            <MapPin className="w-5 h-5 text-orange-600" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-800">Alamat & Titik Koordinat</h3>
            <p className="text-xs text-slate-500">Lengkapi alamat domisili dan tandai lokasi rumah Anda di peta</p>
          </div>
        </div>
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InputField
              label="Dusun/Jalan"
              name="dusun"
              value={data.dusun}
              onChange={handleChange}
              placeholder="Nama dusun atau jalan"
              required
              error={errors.dusun}
            />
            <InputField
              label="RT / RW"
              name="rtRw"
              value={data.rtRw}
              onChange={handleChange}
              placeholder="Contoh: 001/002"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <InputField
              label="Desa/Kelurahan"
              name="desa"
              value={data.desa}
              onChange={handleChange}
              placeholder="Desa"
              required
              error={errors.desa}
            />
            <InputField
              label="Kecamatan"
              name="kecamatan"
              value={data.kecamatan}
              onChange={handleChange}
              placeholder="Kecamatan"
              required
              error={errors.kecamatan}
            />
            <InputField
              label="Kabupaten/Kota"
              name="kabupaten"
              value={data.kabupaten}
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
              value={data.kodePos}
              onChange={handleChange}
              placeholder="Kode pos"
            />
            <InputField
              label="Koordinat Maps"
              name="koordinatMaps"
              value={data.koordinatMaps}
              onChange={handleChange}
              placeholder="Klik peta untuk mengisi otomatis"
            />
          </div>

          <Card className="p-3">
            <div className="flex items-center gap-2 mb-3 text-sm text-slate-600">
              <MapPin className="w-4 h-4 text-brand-green" />
              <span>Preview lokasi rumah Anda (Gunakan tombol deteksi jika tersedia)</span>
            </div>
            <div className="h-[350px] rounded-xl overflow-hidden border border-slate-200">
              <iframe
                title="Google Maps"
                src={`https://www.google.com/maps?q=${position[0]},${position[1]}&output=embed&z=16`}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                loading="lazy"
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-3 mt-3">
              <a
                href={`geo:${position[0]},${position[1]}?q=${position[0]},${position[1]}`}
                className="flex-1 flex items-center justify-center gap-2 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 rounded-lg font-medium transition-all"
              >
                <MapIcon className="w-3.5 h-3.5" />
                Buka di Aplikasi Maps (HP)
              </a>
              <a
                href={`https://www.google.com/maps?q=${position[0]},${position[1]}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 text-xs text-brand-green hover:bg-brand-green-light border border-brand-green/20 py-2.5 rounded-lg font-medium transition-all"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Buka di Google Maps (Web)
              </a>
            </div>
          </Card>
        </div>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSubmit} loading={submitting} className="text-base py-3 px-8">
          {submitting ? 'Menyimpan...' : 'Simpan & Dapatkan Kartu'}
        </Button>
      </div>
    </div>
  )
}

import { useState } from 'react'
import type { ChangeEvent } from 'react'
import { isDataPribadiLengkap, useStudentStore } from '../../../store/studentStore'
import { DATA_AGAMA } from '../../../data/constants'
import StepLayout from '../components/StepLayout'
import InputField from '../../../components/ui/InputField'

interface Step2Props {
  onComplete: () => void
  onBack: () => void
}

export default function Step2Pribadi({ onComplete, onBack }: Step2Props) {
  const { data, steps, updateData, completeStep } = useStudentStore()
  const [showValidation, setShowValidation] = useState(false)

  const requiredError = (value: string) => showValidation && !value.trim() ? 'Lengkapi' : undefined
  const nikError = showValidation && data.nik && data.nik.length !== 16 ? 'Lengkapi 16 digit' : requiredError(data.nik)

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    updateData({ [name]: value })
    setShowValidation(true)
  }

  const handleNext = () => {
    if (!isDataPribadiLengkap(data)) {
      setShowValidation(true)
      return
    }
    completeStep(2)
    onComplete()
  }

  return (
    <StepLayout
      title="Data Pribadi"
      subtitle="Isi data diri Anda dengan lengkap dan benar"
      steps={steps}
      currentStep={2}
      onPrevious={onBack}
      onNext={handleNext}
    >
      <div className="space-y-4 max-w-lg mx-auto">
        {showValidation && !isDataPribadiLengkap(data) && (
          <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            Lengkapi semua field yang wajib diisi sebelum melanjutkan.
          </div>
        )}
        <InputField
          label="Nama Lengkap (sesuai Ijazah/Akte)"
          name="namaLengkap"
          value={data.namaLengkap}
          onChange={handleChange}
          placeholder="Masukkan nama lengkap"
          required
          error={requiredError(data.namaLengkap)}
        />

        <InputField
          label="Jenis Kelamin"
          name="jenisKelamin"
          value={data.jenisKelamin}
          onChange={handleChange}
          required
          error={requiredError(data.jenisKelamin)}
          options={[
            { value: 'Laki-laki', label: 'Laki-laki' },
            { value: 'Perempuan', label: 'Perempuan' },
          ]}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InputField
            label="NISN"
            name="nisn"
            value={data.nisn}
            onChange={handleChange}
            placeholder="Nomor Induk Siswa Nasional"
            required
            helperText="NISN dapat dilihat di kartu pelajar maupun di raport."
            error={requiredError(data.nisn)}
          />
          <InputField
            label="NIK"
            name="nik"
            value={data.nik}
            onChange={handleChange}
            placeholder="16 digit NIK"
            required
            maxLength={16}
            error={nikError}
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
            error={requiredError(data.tempatLahir)}
          />
          <InputField
            label="Tanggal Lahir"
            name="tanggalLahir"
            type="date"
            value={data.tanggalLahir}
            onChange={handleChange}
            required
            error={requiredError(data.tanggalLahir)}
          />
        </div>

        <InputField
          label="Agama"
          name="agama"
          value={data.agama}
          onChange={handleChange}
          required
          error={requiredError(data.agama)}
          options={DATA_AGAMA.map((a) => ({ value: a, label: a }))}
        />

        <InputField
          label="Asal Sekolah"
          name="asalSekolah"
          value={data.asalSekolah}
          onChange={handleChange}
          placeholder="Nama SMP/MTs asal"
          required
          error={requiredError(data.asalSekolah)}
        />

        <InputField
          label="No. HP Siswa (WhatsApp)"
          name="teleponSiswa"
          value={data.teleponSiswa}
          onChange={handleChange}
          type="tel"
          placeholder="628xxxxxxxxxx"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InputField
            label="Anak Ke-"
            name="anakKe"
            value={data.anakKe}
            onChange={handleChange}
            type="number"
            min={1}
            placeholder="Contoh: 1"
          />
          <InputField
            label="Jumlah Saudara"
            name="jumlahSaudara"
            value={data.jumlahSaudara}
            onChange={handleChange}
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
            value={data.tinggiBadan}
            onChange={handleChange}
            type="number"
            min={1}
            placeholder="Contoh: 155"
          />
          <InputField
            label="Berat Badan (kg)"
            name="beratBadan"
            value={data.beratBadan}
            onChange={handleChange}
            type="number"
            min={1}
            placeholder="Contoh: 45"
          />
        </div>
      </div>
    </StepLayout>
  )
}

import type { ChangeEvent } from 'react'
import { useStudentStore } from '../../../store/studentStore'
import { DATA_AGAMA } from '../../../data/constants'
import StepLayout from '../components/StepLayout'
import InputField from '../../../components/ui/InputField'

interface Step2Props {
  onComplete: () => void
  onBack: () => void
}

export default function Step2Pribadi({ onComplete, onBack }: Step2Props) {
  const { data, steps, updateData, completeStep } = useStudentStore()

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    updateData({ [name]: value })
  }

  const handleNext = () => {
    if (!data.namaLengkap || !data.nik || !data.tempatLahir || !data.tanggalLahir || !data.agama || !data.jenisKelamin) {
      alert('Lengkapi semua field yang wajib diisi')
      return
    }
    if (data.nik.length !== 16) {
      alert('NIK harus tepat 16 digit')
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
        <InputField
          label="Nama Lengkap (sesuai Ijazah/Akte)"
          name="namaLengkap"
          value={data.namaLengkap}
          onChange={handleChange}
          placeholder="Masukkan nama lengkap"
          required
        />

        <InputField
          label="Jenis Kelamin"
          name="jenisKelamin"
          value={data.jenisKelamin}
          onChange={handleChange}
          required
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
            maxLength={16}
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
          />
          <InputField
            label="Tanggal Lahir"
            name="tanggalLahir"
            type="date"
            value={data.tanggalLahir}
            onChange={handleChange}
            required
          />
        </div>

        <InputField
          label="Agama"
          name="agama"
          value={data.agama}
          onChange={handleChange}
          required
          options={DATA_AGAMA.map((a) => ({ value: a, label: a }))}
        />

        <InputField
          label="Asal Sekolah"
          name="asalSekolah"
          value={data.asalSekolah}
          onChange={handleChange}
          placeholder="Nama SMP/MTs asal"
          required
        />
      </div>
    </StepLayout>
  )
}

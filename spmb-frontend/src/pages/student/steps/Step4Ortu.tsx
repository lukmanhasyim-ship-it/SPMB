import type { ChangeEvent } from 'react'
import { useStudentStore } from '../../../store/studentStore'
import { DATA_TINGGAL_BERSAMA } from '../../../data/constants'
import StepLayout from '../components/StepLayout'
import InputField from '../../../components/ui/InputField'

interface Step4Props {
  onComplete: () => void
  onBack: () => void
}

export default function Step4Ortu({ onComplete, onBack }: Step4Props) {
  const { data, steps, updateData, completeStep } = useStudentStore()

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    updateData({ [name]: value })
  }

  const handleNext = () => {
    if (!data.namaAyah || !data.namaIbu || !data.teleponOrtu || !data.tinggalBersama) {
      alert('Lengkapi data orang tua')
      return
    }
    completeStep(4)
    onComplete()
  }

  return (
    <StepLayout
      title="Data Orang Tua/Wali"
      subtitle="Informasi orang tua atau wali calon siswa"
      steps={steps}
      currentStep={4}
      onPrevious={onBack}
      onNext={handleNext}
    >
      <div className="space-y-4 max-w-lg mx-auto">
        <InputField
          label="Tinggal Bersama"
          name="tinggalBersama"
          value={data.tinggalBersama}
          onChange={handleChange}
          required
          options={DATA_TINGGAL_BERSAMA.map((t) => ({ value: t, label: t }))}
        />

        <div className="border-t border-gray-100 pt-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Data Ayah</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InputField
              label="Nama Ayah"
              name="namaAyah"
              value={data.namaAyah}
              onChange={handleChange}
              placeholder="Nama lengkap ayah"
              required
            />
            <InputField
              label="Pekerjaan Ayah"
              name="kerjaAyah"
              value={data.kerjaAyah}
              onChange={handleChange}
              placeholder="Pekerjaan ayah"
            />
          </div>
        </div>

        <div className="border-t border-gray-100 pt-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Data Ibu</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InputField
              label="Nama Ibu"
              name="namaIbu"
              value={data.namaIbu}
              onChange={handleChange}
              placeholder="Nama lengkap ibu"
              required
            />
            <InputField
              label="Pekerjaan Ibu"
              name="kerjaIbu"
              value={data.kerjaIbu}
              onChange={handleChange}
              placeholder="Pekerjaan ibu"
            />
          </div>
        </div>

        <InputField
          label="No. Telepon Orang Tua/Wali (WhatsApp)"
          name="teleponOrtu"
          value={data.teleponOrtu}
          onChange={handleChange}
          type="tel"
          placeholder="628xxxxxxxxxx"
          required
        />
      </div>
    </StepLayout>
  )
}

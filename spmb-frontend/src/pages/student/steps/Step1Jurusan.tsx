import type { ChangeEvent } from 'react'
import { useStudentStore } from '../../../store/studentStore'
import { DATA_JURUSAN } from '../../../data/constants'
import StepLayout from '../components/StepLayout'
import InputField from '../../../components/ui/InputField'

interface Step1Props {
  onComplete: () => void
  onBack: () => void
}

export default function Step1Jurusan({ onComplete, onBack }: Step1Props) {
  const { data, steps, updateData, completeStep } = useStudentStore()

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    updateData({ [name]: value })
  }

  const handleNext = () => {
    if (!data.pilihanJurusan) {
      alert('Pilih jurusan utama terlebih dahulu')
      return
    }
    completeStep(1)
    onComplete()
  }

  return (
    <StepLayout
      title="Pilihan Jurusan"
      subtitle="Pilih kompetensi keahlian yang Anda minati"
      steps={steps}
      currentStep={1}
      isFirst
      onPrevious={onBack}
      onNext={handleNext}
    >
      <div className="space-y-5 max-w-lg mx-auto">
        <InputField
          label="Jurusan Utama"
          name="pilihanJurusan"
          value={data.pilihanJurusan}
          onChange={handleChange}
          required
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

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">
            Mengapa saya memilih jurusan ini? <span className="text-red-500">*</span>
          </label>
          <textarea
            name="alasanPilihJurusan"
            value={data.alasanPilihJurusan}
            onChange={handleChange}
            placeholder="Jelaskan alasan Anda memilih jurusan ini..."
            required
            rows={3}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm transition-all outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/30 text-slate-800 placeholder:text-slate-400 resize-none"
          />
        </div>


      </div>
    </StepLayout>
  )
}

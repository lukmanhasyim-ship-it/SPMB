import type { ChangeEvent } from 'react'
import { useStudentStore } from '../../../store/studentStore'
import { DATA_JURUSAN, DATA_PROSPEK_KARIR } from '../../../data/constants'
import StepLayout from '../components/StepLayout'
import InputField from '../../../components/ui/InputField'
import ReferralFields from '../components/ReferralFields'

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
    if (data.pilihanAlternatif && !data.alasanPilihJurusan.trim()) {
      alert('Isi Alasan Memilih Jurusan Alternatif terlebih dahulu')
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

        {data.pilihanJurusan && DATA_PROSPEK_KARIR[data.pilihanJurusan] && (
          <div className="bg-brand-green-light/40 border border-brand-green/20 rounded-xl p-4">
            <p className="text-sm font-semibold text-brand-green-dark mb-3">
              Prospek Karir — {data.pilihanJurusan}
            </p>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5">
              {DATA_PROSPEK_KARIR[data.pilihanJurusan].map((karir) => (
                <li key={karir} className="flex items-start gap-2 text-sm text-slate-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-green mt-1.5 shrink-0" />
                  {karir}
                </li>
              ))}
            </ul>
          </div>
        )}

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

        {data.pilihanAlternatif && (
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
        )}

        <ReferralFields
          kategori={data.referralKategori}
          nama={data.referralNama}
          onChange={(name, value) => updateData({ [name]: value })}
        />

      </div>
    </StepLayout>
  )
}

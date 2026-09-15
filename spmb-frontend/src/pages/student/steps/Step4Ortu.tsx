import type { ChangeEvent } from 'react'
import { useStudentStore } from '../../../store/studentStore'
import type { TinggalBersama } from '../../../types'
import { DATA_TINGGAL_BERSAMA, DATA_ESTIMASI_PENGHASILAN } from '../../../data/constants'
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
    if (name === 'tinggalBersama' && value !== 'Wali') {
      updateData({ tinggalBersama: value as TinggalBersama | '', namaWali: '', tahunLahirWali: '', estimasiPenghasilanWali: '' })
      return
    }
    updateData({ [name]: value })
  }

  const handleNext = () => {
    if (!data.namaAyah || !data.tahunLahirAyah || !data.estimasiPenghasilanAyah ||
      !data.namaIbu || !data.tahunLahirIbu || !data.estimasiPenghasilanIbu ||
      !data.teleponOrtu || !data.tinggalBersama) {
      alert('Lengkapi data orang tua/wali')
      return
    }
    if (data.tinggalBersama === 'Wali' && (!data.namaWali || !data.tahunLahirWali || !data.estimasiPenghasilanWali)) {
      alert('Lengkapi data wali')
      return
    }
    if (data.tinggalBersama === 'Pondok' && !data.namaPondok.trim()) {
      alert('Lengkapi nama pondok pesantren')
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

        {data.tinggalBersama === 'Pondok' && (
          <InputField
            label="Nama Pondok Pesantren"
            name="namaPondok"
            value={data.namaPondok}
            onChange={handleChange}
            placeholder="Nama pondok pesantren tempat tinggal"
            required
          />
        )}

        <div className="border-t border-gray-100 pt-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Data Ayah</h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <InputField
              label="Nama Ayah"
              name="namaAyah"
              value={data.namaAyah}
              onChange={handleChange}
              placeholder="Nama lengkap ayah"
              required
            />
            <InputField
              label="Tahun Lahir Ayah"
              name="tahunLahirAyah"
              value={data.tahunLahirAyah}
              onChange={handleChange}
              type="number"
              min={1920}
              max={2005}
              placeholder="Contoh: 1980"
              required
              helperText="Data dapat dilihat di KK (Kartu Keluarga)"
            />
            <InputField
              label="Estimasi Penghasilan Ayah"
              name="estimasiPenghasilanAyah"
              value={data.estimasiPenghasilanAyah}
              onChange={handleChange}
              required
              options={DATA_ESTIMASI_PENGHASILAN.map((p) => ({ value: p, label: p }))}
            />
          </div>
          <InputField
            label="Pekerjaan Ayah"
            name="kerjaAyah"
            value={data.kerjaAyah}
            onChange={handleChange}
            placeholder="Pekerjaan ayah"
          />
        </div>

        <div className="border-t border-gray-100 pt-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Data Ibu</h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <InputField
              label="Nama Ibu"
              name="namaIbu"
              value={data.namaIbu}
              onChange={handleChange}
              placeholder="Nama lengkap ibu"
              required
            />
            <InputField
              label="Tahun Lahir Ibu"
              name="tahunLahirIbu"
              value={data.tahunLahirIbu}
              onChange={handleChange}
              type="number"
              min={1920}
              max={2005}
              placeholder="Contoh: 1982"
              required
              helperText="Data dapat dilihat di KK (Kartu Keluarga)"
            />
            <InputField
              label="Estimasi Penghasilan Ibu"
              name="estimasiPenghasilanIbu"
              value={data.estimasiPenghasilanIbu}
              onChange={handleChange}
              required
              options={DATA_ESTIMASI_PENGHASILAN.map((p) => ({ value: p, label: p }))}
            />
          </div>
          <InputField
            label="Pekerjaan Ibu"
            name="kerjaIbu"
            value={data.kerjaIbu}
            onChange={handleChange}
            placeholder="Pekerjaan ibu"
          />
        </div>

        {data.tinggalBersama === 'Wali' && (
          <div className="border-t border-gray-100 pt-4">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Data Wali</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <InputField
                label="Nama Wali"
                name="namaWali"
                value={data.namaWali}
                onChange={handleChange}
                placeholder="Nama lengkap wali"
                required
              />
              <InputField
                label="Tahun Lahir Wali"
                name="tahunLahirWali"
                value={data.tahunLahirWali}
                onChange={handleChange}
                type="number"
                min={1920}
                max={2005}
                placeholder="Contoh: 1978"
                required
                helperText="Data dapat dilihat di KK (Kartu Keluarga)"
              />
              <InputField
                label="Estimasi Penghasilan Wali"
                name="estimasiPenghasilanWali"
                value={data.estimasiPenghasilanWali}
                onChange={handleChange}
                required
                options={DATA_ESTIMASI_PENGHASILAN.map((p) => ({ value: p, label: p }))}
              />
            </div>
          </div>
        )}

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

import type { ChangeEvent } from 'react'
import { useRef, useState } from 'react'
import { Upload, Award, Wallet } from 'lucide-react'
import { useStudentStore } from '../../../store/studentStore'
import { DATA_ESTIMASI_PENGHASILAN } from '../../../data/constants'
import StepLayout from '../components/StepLayout'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import InputField from '../../../components/ui/InputField'

interface Step5Props {
  onComplete: () => void
  onBack: () => void
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export default function Step5Berkas({ onComplete, onBack }: Step5Props) {
  const { data, steps, updateData, completeStep, finalisasi } = useStudentStore()
  const fotoRef = useRef<HTMLInputElement>(null)
  const [uploadingFoto, setUploadingFoto] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    updateData({ [name]: value })
  }

  const handleUploadFoto = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      alert('Ukuran file maksimal 2MB')
      return
    }
    setUploadingFoto(true)
    const base64 = await fileToBase64(file)
    updateData({ fotoProfilBase64: base64 })
    setUploadingFoto(false)
  }

  const handleSelesai = async () => {
    if (!data.estimasiPenghasilanOrtu) {
      alert('Pilih estimasi penghasilan orang tua/wali terlebih dahulu')
      return
    }
    setLoading(true)
    completeStep(5)
    await finalisasi()
    setLoading(false)
    onComplete()
  }

  return (
    <StepLayout
      title="Berkas & Prestasi"
      subtitle="Unggah pas foto dan catat prestasi Anda"
      steps={steps}
      currentStep={5}
      isLast
      onPrevious={onBack}
      onNext={handleSelesai}
      loading={loading}
    >
      <div className="space-y-5 max-w-lg mx-auto">
        <Card className="p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-brand-green-light rounded-full flex items-center justify-center">
              <Upload className="w-5 h-5 text-brand-green" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-800">Pas Foto</p>
              <p className="text-xs text-slate-500">Maks 2MB, format JPG/PNG</p>
            </div>
          </div>

          <input
            ref={fotoRef}
            type="file"
            accept="image/*"
            onChange={handleUploadFoto}
            className="hidden"
          />

          {data.fotoProfilBase64 ? (
            <div className="flex items-center gap-3">
              <img
                src={data.fotoProfilBase64}
                alt="Preview"
                className="w-16 h-16 rounded-lg object-cover border border-slate-200"
              />
              <Button onClick={() => fotoRef.current?.click()} variant="ghost" className="text-xs">
                Ganti Foto
              </Button>
            </div>
          ) : (
            <Button
              onClick={() => fotoRef.current?.click()}
              variant="secondary"
              loading={uploadingFoto}
              className="w-full"
            >
              <Upload className="w-4 h-4" />
              Pilih Foto
            </Button>
          )}
        </Card>

        <Card className="p-4 bg-blue-50/50 border-blue-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center">
              <Award className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-800">Berkas Fisik (KK, Akta, SKL)</p>
              <p className="text-xs text-slate-500">
                Tidak perlu diunggah. Berkas akan diperiksa langsung oleh panitia SPMB.
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-amber-50 rounded-full flex items-center justify-center">
              <Award className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-800">Prestasi (Opsional)</p>
              <p className="text-xs text-slate-500">Catat prestasi selama SMP/MTs</p>
            </div>
          </div>
          <textarea
            name="prestasi"
            value={data.prestasi}
            onChange={handleChange}
            placeholder="Contoh: Juara 1 OSN Matematika tingkat Kabupaten..."
            rows={4}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green transition-all text-sm resize-none"
          />

          <div className="mt-4 flex items-start gap-3 bg-blue-50/50 border border-blue-100 rounded-xl p-3">
            <Award className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <p className="text-xs text-slate-600 leading-relaxed">
              Sertifikat/Piagam pendukung tidak perlu diunggah, tetapi siapkan fisiknya untuk
              keperluan administrasi dan validasi oleh panitia SPMB saat verifikasi berkas.
            </p>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center">
              <Wallet className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-800">Estimasi Penghasilan Orang Tua/Wali</p>
              <p className="text-xs text-slate-500">Pilih rentang penghasilan per bulan</p>
            </div>
          </div>
          <InputField
            label="Estimasi Penghasilan Orang Tua/Wali"
            name="estimasiPenghasilanOrtu"
            value={data.estimasiPenghasilanOrtu}
            onChange={handleChange}
            required
            options={DATA_ESTIMASI_PENGHASILAN.map((p) => ({ value: p, label: p }))}
          />
        </Card>

        <div className="bg-amber-50 rounded-xl p-4 text-sm text-amber-800">
          <p className="font-medium mb-1">Perhatian:</p>
          <p>
            Setelah menekan tombol "Selesai", data pendaftaran Anda akan difinalisasi
            dan status berubah menjadi <strong>Selesai</strong>. Pastikan semua data sudah benar.
          </p>
        </div>
      </div>
    </StepLayout>
  )
}

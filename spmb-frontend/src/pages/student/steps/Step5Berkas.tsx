import type { ChangeEvent } from 'react'
import { useRef, useState } from 'react'
import { Upload, Award } from 'lucide-react'
import { useStudentStore } from '../../../store/studentStore'
import { api, driveImageUrl, getFriendlyAuthError } from '../../../services/api'
import { compressAndCropImage } from '../../../utils/imageCompress'
import StepLayout from '../components/StepLayout'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'

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

const MAX_INPUT_BYTES = 10 * 1024 * 1024

async function compressFoto(file: File): Promise<{ base64: string; info: string }> {
  // Kompresi wajib (crop 4/5 dipertahankan di util): 10MB -> target <300KB agar Drive hemat & upload cepat.
  const raw = await compressAndCropImage(file, { maxWidth: 1024, quality: 0.75 })
  const approxBytes = Math.floor(raw.length * 3 / 4)
  const kb = Math.round(approxBytes / 1024)
  return { base64: raw, info: `~${kb}KB setelah kompresi` }
}

export default function Step5Berkas({ onComplete, onBack }: Step5Props) {
  const { data, steps, updateData, completeStep, finalisasi } = useStudentStore()
  const fotoRef = useRef<HTMLInputElement>(null)
  const [uploadingFoto, setUploadingFoto] = useState(false)
  const [uploadStage, setUploadStage] = useState('')
  const [saveError, setSaveError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    updateData({ [name]: value })
  }

  const handleUploadFoto = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > MAX_INPUT_BYTES) {
      alert('Ukuran foto maksimal 10MB. Foto akan dikompresi otomatis di bawah 300KB.')
      e.target.value = ''
      return
    }
    setUploadingFoto(true)
    setSaveError('')
    try {
      setUploadStage('Mengompresi foto...')
      let base64: string
      try {
        const compressed = await compressFoto(file)
        base64 = compressed.base64
        setUploadStage(`Mengunggah (${compressed.info})...`)
      } catch {
        // Fallback: file mentah bila kompresi gagal (mis. browser lama).
        setUploadStage('Mengunggah...')
        base64 = await fileToBase64(file)
      }
      const identitas = (data.idPendaftaran || data.email || 'siswa').replace(/[^a-zA-Z0-9_-]/g, '_')
      const uploadResult = await api.upload(`${identitas}-foto-profil.jpg`, 'image/jpeg', base64)
      const info = uploadResult.data as { fileUrl?: string; fileId?: string } | undefined
      const fotoUrl = info?.fileId
        ? driveImageUrl(info.fileId, 800)
        : info?.fileUrl
          ? driveImageUrl(info.fileUrl, 800)
          : ''
      if (!fotoUrl) throw new Error('URL foto tidak tersedia')

      setUploadStage('Menyimpan ke data...')
      updateData({ fotoProfilBase64: fotoUrl })
      if (data.email) {
        try {
          await api.siswa.update(data.email, { foto_profil_url: fotoUrl })
        } catch (err) {
          // File sudah di Drive, hanya simpan ke Sheet yang gagal -> bisa Simpan Ulang.
          setSaveError(getFriendlyAuthError(err))
        }
      }
    } catch (error) {
      updateData({ fotoProfilBase64: '' })
      const message = error instanceof Error ? error.message : 'Kesalahan tidak diketahui'
      alert(`Foto gagal diunggah: ${getFriendlyAuthError(message)}`)
    } finally {
      setUploadingFoto(false)
      setUploadStage('')
      if (e.target) e.target.value = ''
    }
  }

  const handleSimpanUlangFoto = async () => {
    if (!data.email || !data.fotoProfilBase64) return
    setUploadingFoto(true)
    setSaveError('')
    try {
      await api.siswa.update(data.email, { foto_profil_url: data.fotoProfilBase64 })
    } catch (err) {
      setSaveError(getFriendlyAuthError(err))
    } finally {
      setUploadingFoto(false)
    }
  }

  const handleSelesai = async () => {
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
              <p className="text-xs text-slate-500">Maks 10MB, otomatis dikompresi di bawah 300KB (JPG/PNG/WEBP)</p>
              <p className="text-xs text-brand-green-dark mt-0.5">Foto ini akan muncul di formulir pendaftaran.</p>
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
                loading="lazy"
                referrerPolicy="no-referrer"
                onError={(ev) => { (ev.target as HTMLImageElement).style.opacity = '0.4' }}
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
          {uploadingFoto && uploadStage && (
            <p className="text-xs text-slate-500 mt-2">{uploadStage}</p>
          )}
          {saveError && (
            <div className="mt-2 bg-amber-50 border border-amber-200 rounded-xl p-3">
              <p className="text-xs text-amber-800">{saveError}</p>
              <Button onClick={handleSimpanUlangFoto} variant="secondary" loading={uploadingFoto} className="w-full mt-2 text-xs">
                Simpan Ulang ke Data
              </Button>
            </div>
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
              Jika memiliki prestasi, siapkan foto sertifikat/piagam untuk diunggah pada proses
              berikutnya. Foto ini akan muncul di formulir pendaftaran. Sertifikat/piagam fisik
              tetap perlu disiapkan untuk validasi panitia SPMB.
            </p>
          </div>
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

import { useEffect, useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import { Upload, RefreshCw, CheckCircle, AlertTriangle, ScanLine } from 'lucide-react'
import Button from '../../../components/ui/Button'
import InputField from '../../../components/ui/InputField'
import Modal from '../../../components/ui/Modal'
import {
  preprocessDokumen,
  runOcr,
  extractAlamat,
} from '../../../utils/ocr'
import type { HasilEkstraksiAlamat, JenisDokumen } from '../../../utils/ocr'

interface ScanAlamatModalProps {
  open: boolean
  onClose: () => void
  onApply: (hasil: HasilEkstraksiAlamat, arsipBase64: string) => void
}

type Fase = 'pilih' | 'proses' | 'hasil'

const FIELDS: Array<{ key: keyof HasilEkstraksiAlamat; label: string }> = [
  { key: 'rtRw', label: 'RT/RW' },
  { key: 'kodePos', label: 'Kode Pos' },
  { key: 'desa', label: 'Desa/Kelurahan' },
  { key: 'kecamatan', label: 'Kecamatan' },
  { key: 'kabupaten', label: 'Kabupaten/Kota' },
]

export default function ScanAlamatModal({ open, onClose, onApply }: ScanAlamatModalProps) {
  const [fase, setFase] = useState<Fase>('pilih')
  const [jenis, setJenis] = useState<JenisDokumen>('KK')
  const [preview, setPreview] = useState('')
  const [progress, setProgress] = useState(0)
  const [statusTeks, setStatusTeks] = useState('')
  const [hasil, setHasil] = useState<HasilEkstraksiAlamat>({})
  const [teksMentah, setTeksMentah] = useState('')
  const [error, setError] = useState('')
  const arsipRef = useRef('')
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setFase('pilih')
      setJenis('KK')
      setPreview('')
      setProgress(0)
      setStatusTeks('')
      setHasil({})
      setTeksMentah('')
      setError('')
      arsipRef.current = ''
    }
  }, [open])

  const prosesFile = async (file: File) => {
    setError('')
    if (!file.type.startsWith('image/')) {
      setError('File harus berupa gambar (JPG/PNG)')
      return
    }
    if (file.size > 8 * 1024 * 1024) {
      setError('Ukuran foto maksimal 8MB')
      return
    }
    setFase('proses')
    setProgress(0)
    setStatusTeks('Memproses gambar...')
    try {
      const prep = await preprocessDokumen(file)
      setPreview(prep.dataUrl)
      arsipRef.current = prep.base64
      const teks = await runOcr(prep.blob, (p, s) => {
        setProgress(p)
        setStatusTeks(s)
      })
      const h = extractAlamat(teks)
      setHasil(h)
      setTeksMentah(teks)
      setFase('hasil')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal memproses dokumen')
      setFase('pilih')
    }
  }

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (file) prosesFile(file)
  }

  const handleUbahHasil = (key: keyof HasilEkstraksiAlamat, value: string) => {
    setHasil((h) => ({ ...h, [key]: value }))
  }

  const jumlahDitemukan = Object.values(hasil).filter(Boolean).length

  return (
    <Modal
      open={open}
      onClose={onClose}
      dismissible={fase !== 'proses'}
      size="lg"
      title={
        <span className="flex items-center gap-2">
          <ScanLine className="h-5 w-5 shrink-0 text-brand-green" />
          Scan KK / KTP
        </span>
      }
      footer={fase === 'hasil' ? (
        <>
          <Button variant="ghost" onClick={() => setFase('pilih')} fullWidth className="sm:w-auto">
            <RefreshCw className="h-4 w-4" />
            Ulangi Scan
          </Button>
          <Button onClick={() => onApply(hasil, arsipRef.current)} fullWidth className="sm:w-auto">
            <CheckCircle className="h-4 w-4" />
            Gunakan Data
          </Button>
        </>
      ) : undefined}
    >
      {fase !== 'proses' && (
        <div className="mb-4 grid grid-cols-2 gap-2">
          {(['KK', 'KTP'] as const).map((j) => (
            <button
              key={j}
              type="button"
              onClick={() => setJenis(j)}
              className={`min-h-touch rounded-xl border px-2 text-xs font-medium transition-all sm:text-sm ${
                jenis === j
                  ? 'border-brand-green bg-brand-green text-white shadow-sm'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-brand-green/40'
              }`}
            >
              {j === 'KK' ? 'Kartu Keluarga' : 'KTP Orang Tua'}
            </button>
          ))}
        </div>
      )}

      {error && (
        <div className="mb-4 flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 p-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
          <p className="text-xs text-red-600">{error}</p>
        </div>
      )}

      {fase === 'pilih' && (
        <>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex min-h-[160px] w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-300 px-4 transition-all hover:border-brand-green hover:bg-brand-green-light/20"
          >
            <Upload className="h-8 w-8 text-slate-400" />
            <span className="text-sm font-medium text-slate-600">Ambil Foto / Unggah Gambar</span>
            <span className="text-xs text-slate-400">JPG atau PNG, maksimal 8 MB</span>
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
          <p className="mt-3 text-xs leading-relaxed text-slate-500">
            Pastikan seluruh dokumen terlihat dan tulisan terbaca jelas. Data alamat akan diisi
            otomatis dan dapat Anda periksa sebelum disimpan.
          </p>
        </>
      )}

      {fase === 'proses' && (
        <div className="py-6">
          {preview && (
            <img
              src={preview}
              alt="Dokumen"
              className="mx-auto mb-5 max-h-56 rounded-xl border border-slate-200 object-contain"
            />
          )}
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-2 rounded-full bg-brand-green transition-all duration-300"
              style={{ width: `${Math.round(progress * 100)}%` }}
            />
          </div>
          <div className="mt-3 flex items-center justify-center gap-2">
            <svg
              className="h-3.5 w-3.5 animate-spin text-brand-green"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span className="text-xs text-slate-500">{statusTeks || 'Memproses...'}</span>
            <span className="text-xs font-medium text-slate-400">{Math.round(progress * 100)}%</span>
          </div>
        </div>
      )}

      {fase === 'hasil' && (
        <>
          {jumlahDitemukan > 0 ? (
            <div className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50 p-3">
              <CheckCircle className="h-4 w-4 shrink-0 text-emerald-500" />
              <p className="text-xs text-emerald-700">
                {jumlahDitemukan} data berhasil dibaca. Periksa dan koreksi bila ada yang kurang tepat.
              </p>
            </div>
          ) : (
            <div className="mb-4 flex items-start gap-2 rounded-xl border border-amber-100 bg-amber-50 p-3">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
              <p className="text-xs text-amber-700">
                Tidak ada data alamat yang dikenali. Coba foto ulang dengan pencahayaan lebih baik,
                atau isi manual pada formulir.
              </p>
            </div>
          )}

          <div className="space-y-3">
            <InputField
              label="Alamat (Dusun/Jalan)"
              name="alamat"
              value={hasil.alamat || ''}
              onChange={(e) => handleUbahHasil('alamat', e.target.value)}
              textarea
              placeholder="Tidak terbaca"
            />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {FIELDS.map((f) => (
                <InputField
                  key={f.key}
                  label={f.label}
                  name={f.key}
                  value={hasil[f.key] || ''}
                  onChange={(e) => handleUbahHasil(f.key, e.target.value)}
                  placeholder="Tidak terbaca"
                />
              ))}
            </div>
          </div>

          <details className="mt-4">
            <summary className="cursor-pointer select-none text-xs text-slate-500">
              Lihat teks mentah hasil scan
            </summary>
            <pre className="mt-2 max-h-40 overflow-y-auto rounded-lg border border-slate-100 bg-slate-50 p-3 text-[11px] whitespace-pre-wrap">
              {teksMentah || '(kosong)'}
            </pre>
          </details>
        </>
      )}
    </Modal>
  )
}

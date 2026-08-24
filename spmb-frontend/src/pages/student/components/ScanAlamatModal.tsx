import { useEffect, useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import { X, Upload, RefreshCw, CheckCircle, AlertTriangle, ScanLine } from 'lucide-react'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import InputField from '../../../components/ui/InputField'
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

  if (!open) return null

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

  const gunakanData = () => {
    onApply(hasil, arsipRef.current)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && fase === 'pilih') onClose()
      }}
    >
      <Card className="w-full max-w-lg p-5 max-h-[92vh] overflow-y-auto relative">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <ScanLine className="w-5 h-5 text-brand-green" />
            <h3 className="font-semibold text-slate-800">Scan KK / KTP</h3>
          </div>
          <button
            onClick={onClose}
            disabled={fase === 'proses'}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all disabled:opacity-40"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {fase !== 'proses' && (
          <div className="grid grid-cols-2 gap-2 mb-4">
            {(['KK', 'KTP'] as const).map((j) => (
              <button
                key={j}
                onClick={() => setJenis(j)}
                className={`py-2 rounded-xl text-sm font-medium border transition-all ${
                  jenis === j
                    ? 'bg-brand-green text-white border-brand-green shadow-sm'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-brand-green/40'
                }`}
              >
                {j === 'KK' ? 'Kartu Keluarga' : 'KTP Orang Tua'}
              </button>
            ))}
          </div>
        )}

        {error && (
          <div className="flex items-start gap-2 p-3 mb-4 rounded-xl bg-red-50 border border-red-100">
            <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
            <p className="text-xs text-red-600">{error}</p>
          </div>
        )}

        {fase === 'pilih' && (
          <>
            <button
              onClick={() => fileRef.current?.click()}
              className="w-full py-10 border-2 border-dashed border-slate-300 hover:border-brand-green hover:bg-brand-green-light/20 rounded-2xl flex flex-col items-center gap-2 transition-all"
            >
              <Upload className="w-8 h-8 text-slate-400" />
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
            <p className="text-xs text-slate-400 mt-3 leading-relaxed">
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
                className="max-h-56 mx-auto object-contain rounded-xl border border-slate-200 mb-5"
              />
            )}
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
              <div
                className="bg-brand-green h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.round(progress * 100)}%` }}
              />
            </div>
            <div className="flex items-center justify-center gap-2 mt-3">
              <svg
                className="animate-spin w-3.5 h-3.5 text-brand-green"
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
              <div className="flex items-center gap-2 p-3 mb-4 rounded-xl bg-emerald-50 border border-emerald-100">
                <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                <p className="text-xs text-emerald-700">
                  {jumlahDitemukan} data berhasil dibaca. Periksa dan koreksi bila ada yang kurang tepat.
                </p>
              </div>
            ) : (
              <div className="flex items-start gap-2 p-3 mb-4 rounded-xl bg-amber-50 border border-amber-100">
                <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
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
              <div className="grid grid-cols-2 gap-3">
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
              <summary className="text-xs text-slate-400 cursor-pointer select-none">
                Lihat teks mentah hasil scan
              </summary>
              <pre className="mt-2 p-3 bg-slate-50 rounded-lg text-[11px] whitespace-pre-wrap max-h-40 overflow-y-auto border border-slate-100">
                {teksMentah || '(kosong)'}
              </pre>
            </details>

            <div className="flex gap-3 mt-5">
              <Button variant="ghost" onClick={() => setFase('pilih')} fullWidth>
                <RefreshCw className="w-4 h-4" />
                Ulangi Scan
              </Button>
              <Button onClick={gunakanData} fullWidth>
                <CheckCircle className="w-4 h-4" />
                Gunakan Data
              </Button>
            </div>
          </>
        )}
      </Card>
    </div>
  )
}

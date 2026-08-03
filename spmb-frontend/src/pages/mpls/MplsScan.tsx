import { useEffect, useRef, useState } from 'react'
import { Camera, ScanLine, CheckCircle2, XCircle, RefreshCw, UserCheck, Loader2 } from 'lucide-react'
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode'
import { useAuthStore } from '../../store/authStore'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import { api } from '../../services/api'

const READER_ID = 'mpls-qr-reader'

interface LookupData {
  id_pendaftaran: string
  nama_lengkap: string
  email: string
  pilihan_jurusan: string
  gelombang: string
  tahun_ajaran: string
  status_pendaftaran: string
  hadir_hari_ini: boolean
}

function extractIdPendaftaran(text: string): string {
  const trimmed = text.trim()
  try {
    const parsed = JSON.parse(trimmed)
    if (parsed && typeof parsed === 'object') {
      return String(parsed.id_pendaftaran || parsed.idPendaftaran || trimmed)
    }
  } catch {
    // not JSON
  }
  const match = trimmed.match(/SPMB-[A-Z0-9-]+/i)
  return match ? match[0] : trimmed
}

export default function MplsScan() {
  const { user } = useAuthStore()
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const [cameraOn, setCameraOn] = useState(false)
  const [cameraStarting, setCameraStarting] = useState(false)
  const [cameraError, setCameraError] = useState('')
  const [scanResult, setScanResult] = useState<LookupData | null>(null)
  const [scanError, setScanError] = useState('')
  const [manualId, setManualId] = useState('')
  const [saving, setSaving] = useState(false)
  const [savedMsg, setSavedMsg] = useState('')

  const stopCamera = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop()
        scannerRef.current.clear()
      } catch {
        // ignore
      }
      scannerRef.current = null
    }
    setCameraOn(false)
  }

  const lookup = async (idPendaftaran: string) => {
    setScanError('')
    setSavedMsg('')
    try {
      const res = await api.mpls.lookupById(idPendaftaran)
      if (res.status === 'ok') {
        setScanResult(res.data as LookupData)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Gagal memuat data siswa'
      setScanError(message)
      setScanResult(null)
    }
  }

  const handleDecodedText = async (text: string) => {
    await stopCamera()
    const idPendaftaran = extractIdPendaftaran(text)
    if (!idPendaftaran) {
      setScanError('Barcode tidak mengandung ID pendaftaran yang valid')
      return
    }
    await lookup(idPendaftaran)
  }

  const startCamera = async () => {
    setCameraError('')
    setScanResult(null)
    setScanError('')
    setCameraStarting(true)
    setCameraOn(true)
    try {
      const qrCode = new Html5Qrcode(READER_ID, {
        verbose: false,
        formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
      })
      scannerRef.current = qrCode
      await qrCode.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          handleDecodedText(decodedText)
        },
        () => {},
      )
      setCameraStarting(false)
    } catch (err) {
      setCameraStarting(false)
      setCameraError(
        err instanceof Error && err.message
          ? `Kamera tidak dapat diakses: ${err.message}`
          : 'Kamera tidak dapat diakses. Gunakan input manual ID pendaftaran.',
      )
      if (scannerRef.current) {
        try {
          scannerRef.current.clear()
        } catch {
          // ignore
        }
        scannerRef.current = null
      }
      setCameraOn(false)
    }
  }

  const handleManual = async () => {
    const id = manualId.trim()
    if (!id) {
      setScanError('Masukkan ID pendaftaran terlebih dahulu')
      return
    }
    await lookup(id)
  }

  const handleSave = async () => {
    if (!scanResult) return
    setSaving(true)
    setSavedMsg('')
    try {
      const res = await api.mpls.addKehadiran(scanResult.id_pendaftaran, user?.nama || user?.email || '')
      if (res.status === 'ok') {
        setSavedMsg(`Absensi berhasil tercatat pukul ${String((res.data as { jam: string }).jam).slice(0, 5)}`)
        setScanResult({ ...scanResult, hadir_hari_ini: true })
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Gagal menyimpan absensi'
      setScanError(message)
    } finally {
      setSaving(false)
    }
  }

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        try {
          scannerRef.current.stop()
        } catch {
          // ignore
        }
      }
    }
  }, [])

  const resetScan = () => {
    setScanResult(null)
    setScanError('')
    setSavedMsg('')
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-800">Scan Absen</h1>
        <p className="text-sm text-slate-500">
          Arahkan kamera ke QR code pada kartu bukti pendaftaran siswa untuk mengabsen kehadiran.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card className="p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
            <Camera className="w-4 h-4 text-brand-green" />
            Pemindai Absen
          </h3>

          <div className="relative w-full overflow-hidden rounded-xl bg-slate-900">
            <div
              id={READER_ID}
              className={`w-full h-64 sm:h-80 ${cameraOn ? 'block' : 'hidden'}`}
            />
            {cameraStarting && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-slate-300 text-sm">
                <Loader2 className="w-6 h-6 animate-spin" />
                Memulai kamera...
              </div>
            )}
          </div>

          {!cameraOn && (
            <div className="flex flex-col items-center justify-center h-56 rounded-xl border-2 border-dashed border-slate-200 text-slate-400">
              <ScanLine className="w-10 h-10 mb-2" />
              <p className="text-sm">Kamera belum aktif</p>
              <p className="text-xs mt-1">Klik tombol di bawah untuk mulai memindai</p>
            </div>
          )}

          <div className="flex gap-2 mt-4">
            {!cameraOn ? (
              <Button onClick={startCamera} fullWidth>
                <Camera className="w-4 h-4" />
                Mulai Kamera
              </Button>
            ) : (
              <Button variant="danger" fullWidth onClick={stopCamera}>
                <XCircle className="w-4 h-4" />
                Stop Kamera
              </Button>
            )}
          </div>

          {cameraError && (
            <div className="mt-3 p-3 rounded-xl bg-amber-50 border border-amber-100 text-xs text-amber-700">
              {cameraError}
            </div>
          )}

          <div className="mt-4 pt-4 border-t border-slate-100">
            <label className="text-xs font-medium text-slate-600 mb-1 block">
              Atau input manual ID Pendaftaran
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={manualId}
                onChange={(e) => setManualId(e.target.value)}
                placeholder="SPMB-2627-G1-XXXX"
                className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30"
              />
              <Button variant="secondary" onClick={handleManual}>
                Cari
              </Button>
            </div>
          </div>
        </Card>

        <div className="space-y-4">
          {scanError && (
            <Card className="p-5 border-red-100">
              <div className="flex items-start gap-3">
                <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-red-600">Scan gagal</p>
                  <p className="text-xs text-slate-500 mt-1">{scanError}</p>
                </div>
              </div>
            </Card>
          )}

          {savedMsg && (
            <Card className="p-5 border-brand-green-light bg-brand-green-light/30">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-brand-green shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-brand-green-dark">Kehadiran tercatat</p>
                  <p className="text-xs text-slate-500 mt-1">{savedMsg}</p>
                </div>
              </div>
            </Card>
          )}

          {!scanResult && !scanError && !savedMsg && (
            <Card className="p-5">
              <div className="text-center py-10 text-slate-400">
                <ScanLine className="w-10 h-10 mx-auto mb-3" />
                <p className="text-sm">Hasil scan akan tampil di sini</p>
              </div>
            </Card>
          )}

          {scanResult && (
            <Card className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-slate-700">Data Siswa Terdeteksi</h3>
                <button
                  onClick={resetScan}
                  className="flex items-center gap-1 text-xs text-slate-400 hover:text-brand-green transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Scan Lagi
                </button>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between border-b border-slate-50 pb-2">
                  <span className="text-slate-500">ID Pendaftaran</span>
                  <span className="font-medium text-brand-green">{scanResult.id_pendaftaran}</span>
                </div>
                <div className="flex justify-between border-b border-slate-50 pb-2">
                  <span className="text-slate-500">Nama</span>
                  <span className="font-semibold text-slate-800 text-right">{scanResult.nama_lengkap || '-'}</span>
                </div>
                <div className="flex justify-between border-b border-slate-50 pb-2">
                  <span className="text-slate-500">Email</span>
                  <span className="text-slate-700 text-right">{scanResult.email || '-'}</span>
                </div>
                <div className="flex justify-between border-b border-slate-50 pb-2">
                  <span className="text-slate-500">Jurusan</span>
                  <span className="text-slate-700 text-right">{scanResult.pilihan_jurusan || '-'}</span>
                </div>
                <div className="flex justify-between border-b border-slate-50 pb-2">
                  <span className="text-slate-500">Gelombang</span>
                  <span className="text-slate-700">{scanResult.gelombang || '-'}</span>
                </div>
                <div className="flex justify-between border-b border-slate-50 pb-2">
                  <span className="text-slate-500">Status Pendaftaran</span>
                  <span className="text-slate-700">{scanResult.status_pendaftaran || '-'}</span>
                </div>
              </div>

              <div className="mt-5">
                {scanResult.hadir_hari_ini ? (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-brand-green-light/40 text-brand-green-dark text-sm font-medium">
                    <CheckCircle2 className="w-4 h-4" />
                    Siswa ini sudah tercatat hadir hari ini
                  </div>
                ) : (
                  <Button fullWidth onClick={handleSave} loading={saving}>
                    <UserCheck className="w-4 h-4" />
                    Konfirmasi Hadir
                  </Button>
                )}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

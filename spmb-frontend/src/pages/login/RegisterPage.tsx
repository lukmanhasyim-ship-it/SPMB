import { useState, useRef } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { UserPlus, Upload, Camera } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import InputField from '../../components/ui/InputField'

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export default function RegisterPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { register, loading, error } = useAuthStore()
  const googleData = location.state as { email?: string; nama?: string; fotoUrl?: string } | null

  const [nama, setNama] = useState(googleData?.nama || '')
  const [email, setEmail] = useState(googleData?.email || '')
  const [fotoBase64, setFotoBase64] = useState(googleData?.fotoUrl || '')
  const [localError, setLocalError] = useState('')
  const fotoRef = useRef<HTMLInputElement>(null)
  const fromGoogle = !!(googleData?.email)

  const handleUploadFoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      setLocalError('Ukuran foto maksimal 2MB')
      return
    }
    const base64 = await fileToBase64(file)
    setFotoBase64(base64)
    setLocalError('')
  }

  const handleRegister = async () => {
    setLocalError('')
    if (!nama.trim()) {
      setLocalError('Nama lengkap harus diisi')
      return
    }
    if (!email.trim()) {
      setLocalError('Alamat email harus diisi')
      return
    }
    if (!email.toLowerCase().includes('@gmail.com')) {
      setLocalError('Gunakan alamat Gmail (@gmail.com) yang aktif')
      return
    }
    try {
      await register(email.trim(), nama.trim(), fotoBase64 || undefined)
      navigate('/student/dashboard')
    } catch {
      setLocalError(error || 'Registrasi gagal')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 w-20 h-20 flex items-center justify-center">
            <img src="/logo.svg" alt="Logo SMKS Al Azhar Sempu" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Daftar Akun</h1>
          <p className="text-sm text-slate-500 mt-1">
            Sistem Penerimaan Murid Baru
          </p>
          <p className="text-xs text-slate-400 mt-0.5">
            SMKS AL AZHAR SEMPU
          </p>
        </div>

        <div className="space-y-4">
          <div className="flex flex-col items-center gap-3">
            <div
              className="w-24 h-24 rounded-full overflow-hidden border-2 border-slate-200 bg-slate-50 flex items-center justify-center cursor-pointer hover:border-brand-green transition-colors group"
              onClick={() => fotoRef.current?.click()}
            >
              {fotoBase64 ? (
                <img src={fotoBase64} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <Camera className="w-8 h-8 text-slate-400 group-hover:text-brand-green transition-colors" />
              )}
            </div>
            <input
              ref={fotoRef}
              type="file"
              accept="image/*"
              onChange={handleUploadFoto}
              className="hidden"
            />
            <button
              onClick={() => fotoRef.current?.click()}
              className="text-xs text-brand-green hover:text-brand-green-dark font-medium flex items-center gap-1"
            >
              <Upload className="w-3.5 h-3.5" />
              {fromGoogle ? 'Ganti Foto Profile' : 'Upload Foto Profile'}
            </button>
            <p className="text-[10px] text-slate-400">Maks 2MB, format JPG/PNG</p>
          </div>

          <InputField
            label="Nama Lengkap"
            name="nama"
            value={nama}
            onChange={(e) => setNama(e.target.value)}
            placeholder="Masukkan nama lengkap Anda"
            required
          />

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-semibold text-slate-700">
                Alamat Email (Gmail)
              </label>
              {fromGoogle && (
                <span className="text-[10px] font-medium text-white bg-brand-green px-1.5 py-0.5 rounded">
                  Google
                </span>
              )}
            </div>
            <input
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="contoh@gmail.com"
              required
              disabled={fromGoogle}
              className={`w-full px-4 py-2.5 rounded-xl border text-sm transition-all outline-none
                ${fromGoogle
                  ? 'bg-slate-50 border-slate-200 text-slate-500 cursor-not-allowed'
                  : 'bg-white border-slate-200 focus:border-brand-green focus:ring-2 focus:ring-brand-green/30 text-slate-800 placeholder:text-slate-400'
                }`}
            />
          </div>

          {(localError || error) && (
            <p className="text-sm text-red-500 text-center">{localError || error}</p>
          )}

          <Button
            onClick={handleRegister}
            fullWidth
            loading={loading}
            className="text-base py-3"
          >
            <UserPlus className="w-5 h-5" />
            Daftar & Mulai Pendaftaran
          </Button>
        </div>

        <p className="text-sm text-slate-500 text-center mt-6">
          Sudah punya akun?{' '}
          <Link to="/" className="text-brand-green hover:text-brand-green-dark font-medium">
            Masuk di sini
          </Link>
        </p>
      </Card>
    </div>
  )
}
